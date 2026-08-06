"use client";

import { useEffect, useRef, useState } from "react";

import {
  COLS,
  LINE_HEIGHT,
  MAX_LEVEL,
  RAMP,
  ROWS,
  ROWS_BELOW_ORIGIN,
  STILL_PHASE,
  computeFrame,
  createGeometry,
  holeRadiusCells,
  type FieldGeometry,
  type Ripple,
} from "./ascii-field";

/**
 * The hero wave field.
 *
 * The design rewrote a 6,272-character <pre>'s textContent on every frame,
 * forcing a full text layout each time and giving every glyph the same flat
 * colour. This renders to canvas in three layers instead:
 *
 *   glyph layer  — the characters, redrawn at the design's 14fps step so the
 *                  field keeps its stepped, terminal-like cadence
 *   bloom layer  — only the densest glyphs, blurred and added back
 *   display      — composites both every animation frame with a smoothly
 *                  interpolated alpha, so the field breathes at 60fps even
 *                  though the glyphs themselves only change 14 times a second
 *
 * Drawing per ramp level (13 fillText passes per row rather than one) is what
 * buys the per-level colour ramp: faint cells recede, dense cells read hot.
 */

const GLYPH_FPS = 14;
const GLYPH_INTERVAL = 1 / GLYPH_FPS;
const MAX_DPR = 2;

/**
 * Top fade, as a fraction of the field's height.
 *
 * The design used a flat 15% of a 32-row field — 4.8 rows. Held at 15% the
 * fade would grow with the grid every time the arc's sweep widened, so it is
 * pinned to that row count instead.
 */
const TOP_FADE = `${((4.8 / ROWS) * 100).toFixed(1)}%`;
const FIELD_MASK = `linear-gradient(180deg, transparent 0%, #000 ${TOP_FADE}, #000 100%)`;

/** Base ink from the design (#e7e9ec), lerped towards white as density rises. */
function levelStyle(level: number): string {
  const t = (level - 2) / (MAX_LEVEL - 2);
  const alpha = 0.3 + 0.7 * Math.pow(t, 0.85);
  const r = Math.round(231 + 24 * t);
  const g = Math.round(233 + 22 * t);
  const b = Math.round(236 + 19 * t);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}

const LEVEL_STYLES = Array.from({ length: MAX_LEVEL + 1 }, (_, level) =>
  RAMP[level] === " " ? null : levelStyle(level),
);

/** Levels dense enough to glow. */
const BLOOM_FLOOR = 10;

interface Metrics {
  cell: number;
  cellWidth: number;
  cellHeight: number;
  width: number;
  height: number;
  font: string;
}

function readMetrics(host: HTMLElement, ctx: CanvasRenderingContext2D): Metrics | null {
  const styles = getComputedStyle(host);
  const cell = Number.parseFloat(styles.fontSize);
  if (!Number.isFinite(cell) || cell <= 0) return null;

  const font = `400 ${cell}px ${styles.fontFamily}`;
  ctx.font = font;

  // Measure rather than assume 0.6em: if the webfont hasn't loaded yet the
  // fallback's advance differs, and a wrong cell width would misalign the
  // field against the illustration that sits in its centre.
  const cellWidth = ctx.measureText("@").width || cell * 0.6;
  const cellHeight = cell * LINE_HEIGHT;

  return {
    cell,
    cellWidth,
    cellHeight,
    width: cellWidth * COLS,
    height: cellHeight * ROWS,
    font,
  };
}

function sizeCanvas(canvas: HTMLCanvasElement, metrics: Metrics, dpr: number): void {
  canvas.width = Math.round(metrics.width * dpr);
  canvas.height = Math.round(metrics.height * dpr);
  canvas.style.width = `${metrics.width}px`;
  canvas.style.height = `${metrics.height}px`;
}

/**
 * Centres the display canvas on its wrapper rather than trusting `left: 0` to
 * line up — the wrapper is sized by the <pre> behind it, and any sub-pixel or
 * font-fallback difference in advance width would offset the whole field.
 *
 * Margins, not `transform`: the wrapper carries `.animate-ascii-drift`, whose
 * keyframe owns `transform`, and a second translate there is exactly what threw
 * the field a full width off-screen earlier.
 */
function centreCanvas(canvas: HTMLCanvasElement, metrics: Metrics): void {
  canvas.style.left = "50%";
  canvas.style.marginLeft = `${-metrics.width / 2}px`;
}

export function AsciiWaveField({ still }: { still: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    /*
     * Reduced motion never starts a loop — not a paused loop, no loop at all.
     * It does still get one canvas frame, which it did not before.
     *
     * The reason is the centre hole: it is derived from the portrait's rendered
     * radius, and `--cell` is a viewport unit, so the server-rendered still has
     * to guess. It guesses the uncapped disc, which on a large display leaves a
     * hole ~70px wider than the portrait needs. Drawing one static frame from
     * the measured cell size closes that, and a single paint is not motion.
     */
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const glyphLayer = document.createElement("canvas");
    const bloomLayer = document.createElement("canvas");
    const glyphCtx = glyphLayer.getContext("2d");
    const bloomCtx = bloomLayer.getContext("2d");
    if (!glyphCtx || !bloomCtx) return;

    /*
     * Rebuilt whenever the cell size crosses the portrait's 200px cap, since
     * the hole is derived from the disc's *rendered* radius. It is ~6k trig
     * calls, so it is gated on the radius actually changing rather than run on
     * every resize callback.
     */
    let holeCells = 0;
    let geometry: FieldGeometry = createGeometry();
    const levels = new Uint8Array(COLS * ROWS);
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    let metrics: Metrics | null = null;
    let phase = 0;
    let glyphAccumulator = GLYPH_INTERVAL; // draw the first frame immediately
    let elapsed = 0;
    let lastTime = performance.now();
    let raf = 0;
    let running = false;
    let visible = true;
    let started = false;

    let amplitude = 1;
    const ripple: Ripple = { x: COLS / 2, y: ROWS / 2, energy: 0, time: 0 };
    let pointerInside = false;
    let pointerClient: { x: number; y: number } | null = null;

    /** Repaints the two offscreen layers. Runs at GLYPH_FPS, not every frame. */
    const drawGlyphs = () => {
      if (!metrics) return;

      computeFrame(geometry, levels, phase, {
        amplitude,
        ripple: ripple.energy > 0.001 ? ripple : null,
      });

      for (const layer of [glyphCtx, bloomCtx]) {
        layer.setTransform(dpr, 0, 0, dpr, 0, 0);
        layer.clearRect(0, 0, metrics.width, metrics.height);
        layer.font = metrics.font;
        layer.textBaseline = "middle";
      }

      // One pass per density level: 13 fillStyle changes instead of 6,272.
      for (let level = 2; level <= MAX_LEVEL; level += 1) {
        const style = LEVEL_STYLES[level];
        if (!style) continue;

        const glyph = RAMP[level]!;
        const target = level >= BLOOM_FLOOR ? [glyphCtx, bloomCtx] : [glyphCtx];
        for (const layer of target) layer.fillStyle = style;

        for (let y = 0; y < ROWS; y += 1) {
          let row = "";
          let any = false;
          for (let x = 0; x < COLS; x += 1) {
            if (levels[y * COLS + x] === level) {
              row += glyph;
              any = true;
            } else {
              row += " ";
            }
          }
          if (!any) continue;

          const baseline = y * metrics.cellHeight + metrics.cellHeight / 2;
          for (const layer of target) layer.fillText(row, 0, baseline);
        }
      }
    };

    const composite = () => {
      if (!metrics) return;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // A slow swell on top of the CSS drift, interpolated every frame so the
      // field never looks frozen between glyph steps.
      const breath = 0.92 + 0.08 * Math.sin(elapsed * 0.55);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = Math.max(0, Math.min(1, breath * amplitude));
      ctx.drawImage(glyphLayer, 0, 0);

      ctx.globalCompositeOperation = "lighter";
      // The transform is identity here, so the blur radius is in device pixels
      // and has to be scaled by DPR to look the same on a retina display.
      ctx.filter = `blur(${6 * dpr}px)`;
      ctx.globalAlpha = 0.5 * amplitude;
      ctx.drawImage(bloomLayer, 0, 0);

      ctx.filter = "none";
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const measure = () => {
      const pre = preRef.current;
      const next = readMetrics(pre ?? host, ctx);
      if (!next) return false;

      metrics = next;

      const nextHole = holeRadiusCells(next.cell);
      if (Math.abs(nextHole - holeCells) > 0.02) {
        holeCells = nextHole;
        geometry = createGeometry(nextHole);
      }

      sizeCanvas(canvas, next, dpr);
      sizeCanvas(glyphLayer, next, dpr);
      sizeCanvas(bloomLayer, next, dpr);
      centreCanvas(canvas, next);
      return true;
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);

      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;

      // Phase advances with wall-clock time, so the wave moves at the same
      // speed on a 60Hz and a 144Hz display.
      phase += dt * 1.25;

      // Ripple energy decays once the pointer leaves; while it is inside, the
      // decay is slower so the disturbance trails the cursor.
      ripple.time += dt;

      // One layout read per frame, shared by the ripple and the scroll fade.
      const rect = canvas.getBoundingClientRect();

      if (pointerClient && rect.width > 0 && rect.height > 0) {
        const margin = 120;
        pointerInside =
          pointerClient.x >= rect.left - margin &&
          pointerClient.x <= rect.right + margin &&
          pointerClient.y >= rect.top - margin &&
          pointerClient.y <= rect.bottom + margin;

        if (pointerInside) {
          ripple.x = ((pointerClient.x - rect.left) / rect.width) * COLS;
          ripple.y = ((pointerClient.y - rect.top) / rect.height) * ROWS;
          ripple.energy = 1;
        }
        pointerClient = null;
      }

      // Held while the pointer is over the field, shed quickly once it leaves.
      ripple.energy = Math.max(0, ripple.energy - dt * (pointerInside ? 0.35 : 1.6));

      const scrolledPast = Math.max(0, -rect.bottom + rect.height);
      amplitude = Math.max(
        0,
        Math.min(1, 1 - scrolledPast / Math.max(1, window.innerHeight * 0.8)),
      );

      glyphAccumulator += dt;
      if (glyphAccumulator >= GLYPH_INTERVAL) {
        glyphAccumulator = 0;
        drawGlyphs();
        if (!started) {
          started = true;
          // Only now hand over from the server-rendered still, so there is no
          // frame where the hero shows nothing.
          setLive(true);
        }
      }

      composite();
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTime = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    /** One static frame, at the phase the server's still was captured on. */
    const renderStatic = () => {
      if (!metrics) return;
      phase = STILL_PHASE;
      amplitude = 1;
      ripple.energy = 0;
      elapsed = 0;
      drawGlyphs();
      composite();
      setLive(true);
    };

    const sync = () => {
      if (motionQuery.matches) {
        stop();
        renderStatic();
      } else if (visible && !document.hidden) start();
      else stop();
    };

    // The handler only records coordinates; the frame loop consumes them, so
    // pointer movement causes neither a React render nor a layout read.
    // Touch and pen are ignored — a ripple you can't hover is just jitter.
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerClient = { x: event.clientX, y: event.clientY };
    };

    // `pointerleave` on the document root, not `pointerout` on window:
    // pointerout bubbles from every element the cursor crosses, so it would
    // fire constantly during normal movement and kill the ripple mid-stroke.
    const onPointerLeave = () => {
      pointerInside = false;
      pointerClient = null;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        sync();
      },
      { rootMargin: "120px" },
    );

    const resizeObserver = new ResizeObserver(() => {
      if (!measure()) return;
      // A resize can change the cell size, and with it the hole — so the static
      // frame has to be redrawn too, not just the animated one.
      if (motionQuery.matches) renderStatic();
      else drawGlyphs();
    });

    const onMotionChange = sync;

    let cancelled = false;

    // Measuring before the webfont resolves would lock in the fallback's
    // advance width and leave the field permanently misaligned.
    const boot = () => {
      if (cancelled) return;
      if (!measure()) return;

      observer.observe(canvas);
      resizeObserver.observe(host);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave, {
        passive: true,
      });
      document.addEventListener("visibilitychange", sync);
      motionQuery.addEventListener("change", onMotionChange);
      sync();
    };

    if (document.fonts?.ready) {
      void document.fonts.ready.then(boot);
    } else {
      boot();
    }

    return () => {
      cancelled = true;
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", sync);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="animate-ascii-drift pointer-events-none absolute left-1/2 -translate-x-1/2"
      style={{
        /*
         * The design anchored the field 10.75 cells above the illustration row.
         * Rows added below the wave origin for a wider sweep hang off the
         * bottom of the box, so the anchor drops by exactly their height —
         * otherwise widening the arc would shove the whole arch up the page.
         */
        bottom: `calc(${(10.75 - ROWS_BELOW_ORIGIN * LINE_HEIGHT).toFixed(2)} * var(--cell))`,
        opacity: "var(--ascii-opacity)",
      }}
    >
      {/*
        The server renders this still so the hero is complete in the initial
        HTML. It is also the entire animation for reduced-motion visitors, and
        the fallback if the canvas context is unavailable.
      */}
      <pre
        ref={preRef}
        className="m-0 whitespace-pre font-mono leading-[1.16] text-[#e7e9ec] transition-opacity duration-500"
        style={{
          fontSize: "var(--cell)",
          letterSpacing: 0,
          opacity: live ? 0 : 1,
          maskImage: FIELD_MASK,
          WebkitMaskImage: FIELD_MASK,
        }}
      >
        {still}
      </pre>

      {/* left/marginLeft are set by centreCanvas once the metrics are known. */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 transition-opacity duration-500"
        style={{
          opacity: live ? 1 : 0,
          maskImage: FIELD_MASK,
          WebkitMaskImage: FIELD_MASK,
        }}
      />
    </div>
  );
}

export { STILL_PHASE };

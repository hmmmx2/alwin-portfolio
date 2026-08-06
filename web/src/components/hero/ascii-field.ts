/**
 * The hero's ASCII wave field, as pure maths.
 *
 * No DOM, no timers, no canvas — which is what lets the server render the
 * first frame into a <pre> (so the hero is never blank before hydration) while
 * the client drives the exact same function at 14fps.
 *
 * The constants below are ported verbatim from the source design. They are the
 * look; changing any of them changes the artwork.
 */

export const COLS = 196;

/**
 * Angular sweep of the wave, centred on straight up.
 *
 * The design was locked to 180° — a flat arch ending at the horizontal — and
 * not by choice of parameter: its falloff term was `max(0, sin a)`, which is
 * only positive over the upper half-plane, and the wave origin sat *below* the
 * bottom row so no cell could ever fall past the horizontal anyway.
 *
 * Both of those are now derived from this one number. Dial it and the arc
 * opens or closes; the grid grows to hold whatever it needs.
 */
export const ARC_SPAN_DEGREES = 240;

/** Line box of the <pre>, in cell widths. Everything vertical is a multiple. */
export const LINE_HEIGHT = 1.16;

/** Radius the wave's envelope peaks at — the bright ring. See `computeFrame`. */
const RING_RADIUS = 19;

/** Rows above the wave origin. The design's original field height. */
const ROWS_ABOVE_ORIGIN = 32;

const HALF_SPAN = ((ARC_SPAN_DEGREES / 2) * Math.PI) / 180;

/**
 * Rows below the origin.
 *
 * A 180° sweep needs none — the arc stops at the horizontal, which is exactly
 * where the grid stops. Anything wider curls underneath, and those cells have
 * to exist or the extra sweep has nowhere to draw. The ring drops
 * `RING_RADIUS · sin(halfSpan − 90°)` rows below the origin at its lowest
 * point; the margin covers the envelope's spread either side of the ring.
 */
export const ROWS_BELOW_ORIGIN =
  HALF_SPAN <= Math.PI / 2
    ? 0
    : Math.ceil(RING_RADIUS * Math.sin(HALF_SPAN - Math.PI / 2)) + 4;

export const ROWS = ROWS_ABOVE_ORIGIN + ROWS_BELOW_ORIGIN;

/** Density ramp. Index 0 and 1 are blank, which is what carves the horizon. */
export const RAMP = [
  " ",
  " ",
  ".",
  ".",
  ":",
  "-",
  "=",
  "+",
  "x",
  "X",
  "#",
  "8",
  "@",
] as const;

export const MAX_LEVEL = RAMP.length - 1;

/**
 * Phase the server-rendered still is captured at.
 *
 * Not arbitrary: the envelope peaks at r = 19 and the crest sits at
 * r = (phase + π/2) / 0.42, so this puts the bright ring right on the peak and
 * reproduces the full arch the design used as its static artwork. Phases much
 * above ~1.5 push the crest inside the centre hole and the still looks lopsided.
 */
export const STILL_PHASE = 0.9;

/** Horizontal advance of one cell, in em. IBM Plex Mono. */
const CELL_ADVANCE = 0.6;

/** Cell aspect: IBM Plex Mono advances 0.6em against a 1.16em line box. */
const CELL_ASPECT = CELL_ADVANCE / LINE_HEIGHT;

/* ------------------------------------------------------------------------- *
 * The hole the portrait sits in.
 *
 * These live here, not in Hero.tsx, because the field has to know how big the
 * disc it is drawn around actually is — the two were independent constants and
 * that is what opened the gap:
 *
 *   1. The gate was `r < 11.5` in *field* radius, which is anisotropic — one
 *      unit is 1.5em across but 1.16em down. So the hole was an ellipse 29%
 *      wider than it was tall, sitting behind a circular portrait. The gap read
 *      about twice as wide at the sides as above the head.
 *   2. The field scales with `--cell` but the portrait is capped at 200px, so
 *      on anything above ~1400px wide the disc stopped growing and the hole
 *      did not. The clearance grew with the display: ~8 cells at laptop size,
 *      ~13 by 1920.
 *
 * Both go away by defining the hole in *screen* units — em, at the <pre>'s font
 * size — and deriving it from the portrait rather than declaring it.
 * ------------------------------------------------------------------------- */

/** Diameter of the portrait disc, in `--cell` units. Hero.tsx renders it. */
export const PORTRAIT_CELLS = 18;

/** Ceiling on that diameter, in px, so it stays laptop-scale on a big display. */
export const PORTRAIT_MAX_PX = 200;

/** Clear space between the disc's edge and the first ink, in `--cell` units. */
export const HOLE_MARGIN_CELLS = 1.9;

/** Width of the fade from empty to full ink, in `--cell` units. */
const HOLE_FEATHER_CELLS = 2.2;

/**
 * Screen-space radius of the hole for a given cell size, in `--cell` units.
 *
 * Mirrors the portrait's own `min(18 * cell, 200px)` so the clearance around
 * the disc is the same on a 1366 laptop and a 5K ultrawide.
 */
export function holeRadiusCells(cellPx: number): number {
  const portraitRadius = Math.min(PORTRAIT_CELLS / 2, PORTRAIT_MAX_PX / 2 / cellPx);
  return portraitRadius + HOLE_MARGIN_CELLS;
}

/**
 * What the server-rendered still uses, since `--cell` is a viewport unit and
 * unknowable at build time. Deliberately the *uncapped* portrait radius: it is
 * the largest the disc can ever be relative to the field, so the still's hole
 * is never smaller than the disc it has to clear. The client re-derives the
 * real value from the measured cell size on its first frame.
 */
export const DEFAULT_HOLE_CELLS = PORTRAIT_CELLS / 2 + HOLE_MARGIN_CELLS;

const CENTER_X = (COLS - 1) / 2;
/**
 * Pinned to the original field height, not to `ROWS`. Rows added below the
 * origin for a wider sweep must not move the origin, or the whole arch would
 * slide up the page every time the span changed.
 */
const CENTER_Y = ROWS_ABOVE_ORIGIN + 1;

/**
 * How quickly the wave dies at the edge of its sweep, in radians (~13°).
 *
 * The design left a 0.16 floor at the horizon, which was invisible because no
 * cells existed beyond it. Now that they do, that floor would carpet everything
 * outside the arc in faint noise, so the whole term is windowed to zero.
 */
const EDGE_SOFTNESS = 0.22;

/** The original's hash-noise, kept identical so the grain pattern matches. */
function hashNoise(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export interface FieldGeometry {
  /** Radius of each cell from the wave origin. */
  readonly radius: Float32Array;
  /** Static per-cell weight: horizon fade × grain × centre-hole gate. */
  readonly weight: Float32Array;
}

/**
 * Per-cell terms that never change. Computed once and reused for every frame —
 * this is ~6k trig calls that the original repeated on each redraw.
 */
export function createGeometry(holeCells: number = DEFAULT_HOLE_CELLS): FieldGeometry {
  const radius = new Float32Array(COLS * ROWS);
  const weight = new Float32Array(COLS * ROWS);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const i = y * COLS + x;
      const ux = (x - CENTER_X) * 0.4;
      const uy = y - CENTER_Y;
      const r = Math.hypot(ux, uy);

      /*
       * The same cell measured on screen, in `--cell` units. The wave itself
       * still runs on the anisotropic `r` above — that ellipse is the arch, and
       * it is the design — but the hole has to be a circle, because the thing
       * it clears is one.
       */
      const screenRadius = Math.hypot(
        (x - CENTER_X) * CELL_ADVANCE,
        (y - CENTER_Y) * LINE_HEIGHT,
      );
      const angle = Math.atan2(-uy, ux);

      /*
       * Fades the field out towards the ends of its sweep.
       *
       * `delta` is the signed angle from straight up, wrapped into (−π, π] so
       * cells below the horizontal on the left read as ~+180° rather than
       * ~−270°. At a 180° span `lobe` reduces to exactly `sin(angle)`, which is
       * what the design used — this is a generalisation of it, not a
       * replacement.
       */
      let delta = angle - Math.PI / 2;
      if (delta <= -Math.PI) delta += 2 * Math.PI;

      const lobe = Math.max(0, Math.cos((delta / HALF_SPAN) * (Math.PI / 2)));
      // The fade straddles the boundary rather than ending on it, so ink
      // actually reaches the configured sweep. Ramping inward from it instead
      // cost ~10° of visible arc — a 240° setting measured 230° on screen.
      const edge = Math.max(
        0,
        Math.min(1, (HALF_SPAN + EDGE_SOFTNESS / 2 - Math.abs(delta)) / EDGE_SOFTNESS),
      );
      const horizon = (0.16 + 0.84 * Math.pow(lobe, 0.8)) * edge;
      const grain = 0.6 + 0.58 * hashNoise(x * 0.7, y * 1.3);

      // Punches the hole the portrait sits in.
      let gate = 1;
      if (screenRadius < holeCells) gate = 0;
      else if (screenRadius < holeCells + HOLE_FEATHER_CELLS) {
        gate = (screenRadius - holeCells) / HOLE_FEATHER_CELLS;
      }

      radius[i] = r;
      weight[i] = horizon * grain * gate * 1.55;
    }
  }

  return { radius, weight };
}

export interface Ripple {
  /** Pointer position in cell coordinates. */
  x: number;
  y: number;
  /** 0–1, decays after the pointer leaves. */
  energy: number;
  /** Seconds, for the ripple's own oscillation. */
  time: number;
}

export interface FrameOptions {
  /** Global wave strength, 0–1. Driven by scroll position. */
  amplitude?: number;
  ripple?: Ripple | null;
}

const RIPPLE_STRENGTH = 0.9;
const RIPPLE_FALLOFF = 9;

/**
 * Writes one frame's ramp indices into `out` (length COLS × ROWS).
 *
 * Reusing a caller-owned buffer keeps the render loop allocation-free, so the
 * animation never triggers a garbage collection pause mid-scroll.
 */
export function computeFrame(
  geometry: FieldGeometry,
  out: Uint8Array,
  phase: number,
  { amplitude = 1, ripple = null }: FrameOptions = {},
): void {
  const { radius, weight } = geometry;

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const i = y * COLS + x;
      const w = weight[i]!;

      if (w <= 0) {
        out[i] = 0;
        continue;
      }

      const r = radius[i]!;

      // The pointer disturbs the *phase* rather than the amplitude, so the
      // surface reads as being pushed around instead of simply brightening.
      let local = phase;
      if (ripple && ripple.energy > 0.001) {
        const dx = (x - ripple.x) * CELL_ASPECT;
        const dy = y - ripple.y;
        const d = Math.hypot(dx, dy);
        local +=
          RIPPLE_STRENGTH *
          ripple.energy *
          Math.exp(-(d * d) / (2 * RIPPLE_FALLOFF * RIPPLE_FALLOFF)) *
          Math.sin(d * 0.5 - ripple.time * 4);
      }

      const v = Math.max(0, Math.sin(r * 0.42 - local));
      const envelope = Math.exp(-Math.pow(r - 19, 2) / 420);
      let intensity = Math.pow(v, 1.3) * envelope * w * amplitude;
      if (intensity > 1) intensity = 1;

      const level = (intensity * (MAX_LEVEL + 1)) | 0;
      out[i] = level > MAX_LEVEL ? MAX_LEVEL : level;
    }
  }
}

/**
 * Renders a computed frame as text, for the server-side still and for anyone
 * running with reduced motion.
 *
 * Rows are deliberately *not* right-trimmed. The design's animation loop
 * trimmed them, which left the <pre> measuring only its longest row — 191 of
 * 196 columns. The wave field's wrapper is sized by that <pre>, so the canvas
 * (always a full 196 columns) overhung it and the whole field rendered 16px
 * right of the illustration it is supposed to be concentric with. Padding to
 * COLS makes the text box exactly the field box.
 */
export function frameToText(levels: Uint8Array): string {
  const lines: string[] = [];
  for (let y = 0; y < ROWS; y += 1) {
    let line = "";
    for (let x = 0; x < COLS; x += 1) {
      line += RAMP[levels[y * COLS + x]!];
    }
    lines.push(line);
  }
  return lines.join("\n");
}

/** Convenience for the server: geometry, one frame, text — in one call. */
export function renderStillFrame(phase: number = STILL_PHASE): string {
  const levels = new Uint8Array(COLS * ROWS);
  computeFrame(createGeometry(), levels, phase);
  return frameToText(levels);
}

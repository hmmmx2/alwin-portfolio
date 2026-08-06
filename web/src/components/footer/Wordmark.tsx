"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The oversized footer signature.
 *
 * Two hard requirements it has to hold at every viewport width:
 *
 *   1. the text spans exactly 85% of the viewport, breaking out of the footer's
 *      1240px column;
 *   2. the letterforms are complete, with the baseline sitting on the bottom
 *      edge of the page — so the word is clipped only below the baseline, not
 *      through the letters.
 *
 * The design sized it with `min(9.6vw, 124px)` inside that capped column, so the
 * span drifted with the window, and clipped with a separate `min(7.2vw, 93px)`
 * that cut through the letterforms. Both are derived from measurement here
 * rather than tuned by hand.
 */

/** Fraction of the viewport the signature spans. */
const TARGET_WIDTH = 0.85;

/**
 * First-paint estimates for "Alwin's Portfolio." at weight 700: laid-out width
 * in ems, and the baseline's distance below the line box top in ems.
 *
 * Only estimates — the effect below re-measures whatever name is actually
 * configured, so a different name self-corrects rather than under- or
 * overflowing. Getting them close just avoids a visible reflow on hydration.
 * They are also the fallback where `fontBoundingBoxAscent` is unavailable.
 */
const ESTIMATED_EM_WIDTH = 7.3;
const ESTIMATED_BASELINE_EM = 0.845;

interface Metrics {
  /** Laid-out width ÷ font size. */
  emWidth: number;
  /** Baseline offset from the line box top ÷ font size. */
  baselineEm: number;
}

/**
 * Both measurements are size-independent ratios, so one pass solves the layout
 * exactly — everything involved scales linearly with font size.
 *
 * Width comes from a `Range`, not canvas `measureText`. Canvas returns the
 * font's advance width and knows nothing about CSS; this wordmark carries
 * `tracking-[-0.045em]`, which over 18 characters removes 0.81em. Sized against
 * the advance it rendered at 76.5% of the viewport while every number said 85%.
 *
 * The baseline comes from canvas font metrics, which is correct here — letter
 * spacing is purely horizontal, so it cannot affect the vertical position.
 */
function measureMetrics(el: HTMLElement): Metrics | null {
  const styles = getComputedStyle(el);
  const fontSize = parseFloat(styles.fontSize);
  if (!Number.isFinite(fontSize) || fontSize <= 0) return null;

  const range = document.createRange();
  range.selectNodeContents(el);
  const width = range.getBoundingClientRect().width;
  range.detach();
  if (width <= 0) return null;

  const emWidth = width / fontSize;

  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return { emWidth, baselineEm: ESTIMATED_BASELINE_EM };

  ctx.font = `${styles.fontWeight} ${fontSize}px ${styles.fontFamily}`;
  const metrics = ctx.measureText("H");
  const ascent = metrics.fontBoundingBoxAscent;
  const descent = metrics.fontBoundingBoxDescent;
  if (!Number.isFinite(ascent) || !Number.isFinite(descent)) {
    return { emWidth, baselineEm: ESTIMATED_BASELINE_EM };
  }

  // With `line-height: 1` the line box is exactly 1em, and the browser splits
  // the difference against the font's own ascent+descent as half-leading —
  // negative for Space Grotesk, whose metrics exceed 1em.
  const halfLeading = (fontSize - (ascent + descent)) / 2;
  return { emWidth, baselineEm: (halfLeading + ascent) / fontSize };
}

export function Wordmark({ name }: { name: string }) {
  const text = `${name}’s Portfolio.`;
  const ref = useRef<HTMLParagraphElement>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelled = false;

    const fit = () => {
      if (cancelled || !ref.current) return;
      const measured = measureMetrics(ref.current);
      if (measured) setMetrics(measured);
    };

    // Measuring before the webfont resolves would size the signature against
    // the fallback's metrics and leave it short or overflowing.
    if (document.fonts?.ready) void document.fonts.ready.then(fit);
    else fit();

    // The fit is a pure ratio, so a resize doesn't change it — but a fallback
    // swap or a font-size-adjust change would, and this is one observer.
    const observer = new ResizeObserver(fit);
    observer.observe(document.documentElement);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [text]);

  const emWidth = metrics?.emWidth ?? ESTIMATED_EM_WIDTH;
  const baselineEm = metrics?.baselineEm ?? ESTIMATED_BASELINE_EM;
  // Solve for the size that makes the text exactly TARGET_WIDTH of the viewport.
  const fontSize = `${(TARGET_WIDTH * 100) / emWidth}vw`;

  return (
    <div
      aria-hidden="true"
      className="overflow-hidden"
      style={{
        fontSize,
        // Full-bleed out of the footer's capped column. `50%` resolves against
        // the footer's content box and the footer is centred, so this lands the
        // block dead centre on the viewport at any width — without a transform,
        // which the scroll-driven `wordmark-settle` animation owns.
        width: `${TARGET_WIDTH * 100}vw`,
        marginInline: `calc(50% - ${(TARGET_WIDTH * 100) / 2}vw)`,
        // Clip on the baseline, so every letterform is complete and the word
        // sits on the bottom edge of the page. Only what falls below the
        // baseline — descenders and the drop-shadow's glow — is trimmed.
        // In em, so the cut tracks the font size instead of needing its own
        // tuned viewport unit.
        height: `${baselineEm}em`,
      }}
    >
      <p
        ref={ref}
        className="wordmark m-0 whitespace-nowrap bg-gradient-to-r from-white from-[4%] via-[#f0f1f3] via-[30%] to-[#4e5257] to-[100%] bg-clip-text text-center font-display font-bold leading-none tracking-[-0.045em] text-transparent"
        style={{
          /*
           * The design's `0 18px 46px` / `0 2px 2px`, converted to em against
           * the 124px font size it was authored for (18/124, 46/124, 2/124).
           *
           * They have to scale with the text. Left in absolute pixels, a 46px
           * blur on a 44px-tall glyph — which is where this lands on a phone —
           * blows out the filter region, and combined with `background-clip:
           * text` the wordmark stops painting altogether. It rendered fine at
           * desktop sizes and vanished below roughly 500px wide.
           */
          filter:
            "drop-shadow(0 0.145em 0.371em rgb(214 220 230 / 0.13)) drop-shadow(0 0.016em 0.016em rgb(0 0 0 / 0.6))",
        }}
      >
        {text}
      </p>
    </div>
  );
}

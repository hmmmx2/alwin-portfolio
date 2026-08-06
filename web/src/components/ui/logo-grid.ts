/**
 * Geometry of the dot-matrix mark, shared by the nav logo and the favicon.
 *
 * It lives apart from `Logo.tsx` because the favicon is not a React component —
 * it is an SVG document served by `app/icon.tsx`. Sharing the grid rather than
 * the markup is what keeps the two from drifting: edit a character here and
 * both follow.
 *
 *   '.' small dot   'O' large dot   ' ' empty
 */
const GRID = [
  " ...... ",
  "...OO...",
  "...OO...",
  "..OOOO..",
  "..OOOO..",
  ".OO..OO.",
  ".O....O.",
  "  ....  ",
] as const;

/** Exact tick positions from the design; not a computed step, to avoid drift. */
const TICKS = [7.5, 11.6, 15.8, 19.9, 24.1, 28.2, 32.4, 36.5] as const;

/** The mark is authored in a 44x44 box. */
export const LOGO_VIEWBOX = 44;

/** Where the dots actually start and stop inside that box. */
export const LOGO_EXTENT_MIN: number = TICKS[0];
export const LOGO_EXTENT_MAX: number = TICKS[TICKS.length - 1]!;

/** The design's radii, as drawn in the nav. */
export const LOGO_DOT_SMALL = 0.72;
export const LOGO_DOT_LARGE = 1.85;

export interface LogoDot {
  cx: number;
  cy: number;
  r: number;
}

/**
 * The mark as a flat list of circles, in the 44x44 box.
 *
 * The radii are parameters because a favicon needs different ones. At 32px the
 * design's small dot is half a pixel across and disappears entirely, leaving
 * the mark looking like it lost half its ink — so the icon fattens both and
 * narrows the gap between them.
 */
export function logoDots(
  small: number = LOGO_DOT_SMALL,
  large: number = LOGO_DOT_LARGE,
): LogoDot[] {
  return GRID.flatMap((row, rowIndex) =>
    [...row].flatMap((cell, colIndex) =>
      cell === " "
        ? []
        : [{ cx: TICKS[colIndex]!, cy: TICKS[rowIndex]!, r: cell === "O" ? large : small }],
    ),
  );
}

/* --------------------------------------------------------------------------
 * Icon variant.
 *
 * Two consumers, and neither may compute any of this for itself: the SVG
 * favicon in `app/icon.tsx`, and `scripts/build-apple-icon.py`, which reads
 * these values back out through Node because iOS only accepts a raster
 * apple-touch-icon. Anything either one derived locally would be a second
 * definition of the mark waiting to drift.
 * ------------------------------------------------------------------------ */

/** Brand tokens, inlined: an icon is served without the stylesheet. */
export const ICON_VOID = "#050506";
export const ICON_INK = "#f4f5f6";

/**
 * Radii at icon sizes. Only the small dot changes, 0.72 -> 1.05; the large dot
 * is exactly as designed.
 *
 * At 16px the design's small dot covers about half a pixel and washes out, so
 * the field around the mark disappears and it reads as damaged rather than
 * subtle. Fattening it restores the two-weight grid. The large dot cannot
 * follow — tick spacing is 4.15, so past roughly 2.0 neighbours touch and the
 * whole mark collapses into blobs.
 */
export const ICON_DOT_SMALL = 1.05;
export const ICON_DOT_LARGE = 1.85;

/**
 * Breathing room around the dots, as a fraction of the icon. Kept tight: the
 * mark's 44-unit box already carries ~17% of its own, and at 16px every percent
 * of padding comes off dots with no pixels to spare.
 */
export const ICON_PADDING = 0.06;

/** Corner rounding, as a fraction of the side. Ignored by iOS, which masks. */
export const ICON_CORNER = 0.1875;

/** The mark laid out in pixels for an icon of `size`, ready to draw. */
export function iconCircles(size: number): LogoDot[] {
  const extent = LOGO_EXTENT_MAX - LOGO_EXTENT_MIN;
  const scale = (size * (1 - 2 * ICON_PADDING)) / extent;
  const origin = size * ICON_PADDING;

  return logoDots(ICON_DOT_SMALL, ICON_DOT_LARGE).map((dot) => ({
    cx: origin + (dot.cx - LOGO_EXTENT_MIN) * scale,
    cy: origin + (dot.cy - LOGO_EXTENT_MIN) * scale,
    r: dot.r * scale,
  }));
}

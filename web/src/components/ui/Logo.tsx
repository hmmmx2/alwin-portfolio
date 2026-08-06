import { LOGO_VIEWBOX, logoDots } from "./logo-grid";

/**
 * The dot-matrix mark from the design.
 *
 * The source spelled out sixty-odd <circle> elements by hand. Same output,
 * expressed as the grid it actually is — so the mark can be edited by moving
 * a character rather than recalculating coordinates. That grid now lives in
 * `logo-grid.ts`, because the favicon draws from it too.
 */
const DOTS = logoDots();

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LOGO_VIEWBOX} ${LOGO_VIEWBOX}`}
      className={className}
      shapeRendering="geometricPrecision"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor">
        {DOTS.map((dot) => (
          <circle key={`${dot.cx}-${dot.cy}`} cx={dot.cx} cy={dot.cy} r={dot.r} />
        ))}
      </g>
    </svg>
  );
}

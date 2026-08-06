import {
  ICON_CORNER,
  ICON_INK,
  ICON_VOID,
  iconCircles,
} from "@/components/ui/logo-grid";

/**
 * The dot-matrix mark, as the browser-tab icon.
 *
 * Served as SVG rather than generated with `ImageResponse`. The mark is already
 * vector, so rasterising it only loses information — and `next/og` fails
 * outright under Turbopack's dev server on this setup ("Input buffer contains
 * unsupported image format", from an empty buffer reaching the rasteriser),
 * which would mean a 500 in the log on every dev page load for a file that
 * needs no rasteriser in the first place. An SVG route has no such moving part
 * and renders identically in dev and production.
 *
 * `apple-icon.png` is the exception: iOS will not take an SVG, so it is a
 * committed raster built from these same numbers by `scripts/build-apple-icon.py`.
 */

export const contentType = "image/svg+xml";
export const size = { width: 64, height: 64 };

export default function Icon() {
  const circles = iconCircles(size.width)
    .map(
      (dot) =>
        `<circle cx="${dot.cx.toFixed(2)}" cy="${dot.cy.toFixed(2)}" r="${dot.r.toFixed(2)}"/>`,
    )
    .join("");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" ` +
    `viewBox="0 0 ${size.width} ${size.height}">` +
    `<rect width="${size.width}" height="${size.height}" ` +
    `rx="${(size.width * ICON_CORNER).toFixed(2)}" fill="${ICON_VOID}"/>` +
    `<g fill="${ICON_INK}">${circles}</g>` +
    `</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}

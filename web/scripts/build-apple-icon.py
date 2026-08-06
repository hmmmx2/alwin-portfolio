"""
Rasterise the dot-matrix mark into `src/app/apple-icon.png`.

Every other icon on this site is SVG, which scales for free. iOS is the one
holdout: an apple-touch-icon must be a raster, so this is the single place the
mark gets pixels baked in.

The geometry is *not* restated here. The script shells out to Node, which reads
`src/components/ui/logo-grid.ts` directly (Node strips the types), and draws
exactly the circles that module hands back — the same ones `app/icon.tsx` puts
in the SVG. Edit the grid there and rerun; there is nothing to keep in sync by
hand.

Square corners on purpose: iOS applies its own rounding and masks whatever it
is given, so pre-rounding shows up as a dark halo inside the system's corners.

Usage:
    python scripts/build-apple-icon.py

Requires Pillow and Node 22+ (`pip install pillow`). Not part of the build —
run it by hand when the mark changes.
"""

import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "app" / "apple-icon.png"

# The size current iPhones ask for.
SIZE = 180

# Drawn at 8x and filtered down: Pillow's ellipse has no anti-aliasing, and a
# grid of hard-edged circles is exactly where that shows.
SUPERSAMPLE = 8

READ_GEOMETRY = """
const m = await import('./src/components/ui/logo-grid.ts');
process.stdout.write(JSON.stringify({
  circles: m.iconCircles(%d),
  void: m.ICON_VOID,
  ink: m.ICON_INK,
}));
"""


def read_geometry(size: int) -> dict:
    """Ask Node for the mark, so this script owns none of the numbers."""
    result = subprocess.run(
        ["node", "--input-type=module", "-e", READ_GEOMETRY % size],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        sys.exit(f"could not read logo-grid.ts through Node:\n{result.stderr}")
    return json.loads(result.stdout)


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


geometry = read_geometry(SIZE * SUPERSAMPLE)
circles = geometry["circles"]
print(f"read {len(circles)} circles from logo-grid.ts")

canvas = Image.new("RGB", (SIZE * SUPERSAMPLE,) * 2, hex_to_rgb(geometry["void"]))
draw = ImageDraw.Draw(canvas)
ink = hex_to_rgb(geometry["ink"])

for dot in circles:
    cx, cy, r = dot["cx"], dot["cy"], dot["r"]
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ink)

canvas = canvas.resize((SIZE, SIZE), Image.LANCZOS)

OUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUT, format="PNG", optimize=True)
print(f"wrote {OUT.relative_to(ROOT)}  {canvas.size}  {OUT.stat().st_size / 1024:.0f} KB")

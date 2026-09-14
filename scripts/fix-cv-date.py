"""
Correct the graduation date in the published CV: July 2026 -> June 2026.

The site says June and the user confirmed June is right, so the PDF is the one
that is wrong. Patched rather than asking for another export, but only if it
renders cleanly -- a visibly re-typed line on a CV a recruiter downloads is
worse than the wrong month.

The whole span is rewritten rather than the four letters, because "June" is
wider than "July" in this face (n+e against l+y) and the line is right-aligned
to the margin: replacing in place would push it past the edge.
"""

import shutil
import sys
from pathlib import Path

import fitz

SRC = Path("web/public/resume.pdf")
WORK = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/patched.pdf")

OLD = "September 2024 - July 2026"
NEW = "September 2024 - June 2026"

shutil.copyfile(SRC, WORK)
doc = fitz.open(WORK)

patched = 0
for page in doc:
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                if span["text"].strip() != OLD:
                    continue

                x0, y0, x1, y1 = span["bbox"]
                size = span["size"]
                # Arial and Helvetica are metrically identical, so the base-14
                # Helvetica-Bold lays out at the same widths as Arial-BoldMT
                # without embedding anything new.
                font = fitz.Font("hebo")
                width = font.text_length(NEW, fontsize=size)

                # Right-aligned: keep the right edge where it was.
                origin = fitz.Point(x1 - width, span["origin"][1])

                page.add_redact_annot(fitz.Rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1))
                page.apply_redactions()
                page.insert_text(
                    origin,
                    NEW,
                    fontname="hebo",
                    fontsize=size,
                    color=(0, 0, 0),
                )
                patched += 1

if patched != 1:
    raise SystemExit(f"expected exactly one date span, patched {patched} -- not writing")

OUT = WORK.with_name("patched-out.pdf")
doc.save(OUT, garbage=4, deflate=True)
doc.close()

check = fitz.open(OUT)
text = " ".join(p.get_text() for p in check)
print(f"  patched {patched} span")
print(f"  'June 2026' present : {'June 2026' in text}")
print(f"  'July 2026' gone    : {'July 2026' not in text}")
print(f"  pages               : {check.page_count}")
print(f"  wrote               : {OUT}")
check.close()

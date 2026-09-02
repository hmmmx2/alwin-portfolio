"""
Strip the referees' contact details out of the CV, for the copy the website
serves.

The site publishes `assets/resume.pdf` at a public URL. The CV's REFERENCES
block carries two other people's personal emails and mobile numbers, and
publishing those is their decision to make, not ours -- so the served copy ends
at "Available on request." and the full CV stays for direct applications.

This is a real redaction, not a black box drawn on top. PyMuPDF's
`apply_redactions` removes the underlying text operators, so the details cannot
be recovered by selecting the text, running `pdftotext`, or reading the content
stream. The check at the end asserts exactly that, and refuses to write a file
that still contains any of them.

Usage:
    python api/scripts/redact-resume.py <source.pdf> [out.pdf]

Defaults to writing ../assets/resume.pdf. Requires PyMuPDF (`pip install
pymupdf`). Not part of the build -- rerun it whenever the CV is updated, and
keep the unredacted original somewhere the web server cannot reach.
"""

import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else None
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "assets" / "resume.pdf"

if SRC is None or not SRC.is_file():
    raise SystemExit(f"usage: python {Path(__file__).name} <source.pdf> [out.pdf]")

# The heading stays; everything under it goes.
HEADING = "REFERENCES"
REPLACEMENT = "Available on request."

# Belt and braces. Redacting the block below the heading should remove all of
# this, but a CV that reflows could put a phone number somewhere unexpected, and
# a leak here is the whole point of the exercise. Anything still present after
# the redaction aborts the write.
MUST_NOT_SURVIVE = [
    "kelkaeazle@swinburne.edu.my",
    "nicholas.wong@finology-group.com",
    "(+60)19-648 1377",
    "(+60)17-308 9696",
    "Khaled ELKarazle",
    "Nicholas Wong",
]

doc = fitz.open(SRC)

redacted_pages = 0
for page in doc:
    headings = page.search_for(HEADING)
    if not headings:
        continue

    heading = headings[0]

    # Everything below the heading, to the last glyph on the page. Derived from
    # the text rather than a fixed y, so a shorter or longer referee list is
    # covered either way.
    below = [
        span["bbox"]
        for block in page.get_text("dict")["blocks"]
        for line in block.get("lines", [])
        for span in line["spans"]
        if span["bbox"][1] >= heading.y1 - 1 and span["text"].strip()
    ]
    if not below:
        continue

    top = heading.y1 + 1
    bottom = max(b[3] for b in below) + 2
    area = fitz.Rect(0, top, page.rect.width, bottom)

    # White fill, matching the page, so the result reads as a short section
    # rather than a document with a bar through it.
    page.add_redact_annot(area, fill=(1, 1, 1))
    page.apply_redactions()

    # Same face and size as the body text it replaces.
    page.insert_text(
        fitz.Point(heading.x0, heading.y1 + 13),
        REPLACEMENT,
        fontname="helv",
        fontsize=10,
        color=(0, 0, 0),
    )
    redacted_pages += 1

# No heading is not automatically an error: a CV that never had a REFERENCES
# section, or one where they have already been removed at the source, is
# exactly what we want. What must never pass is a CV that still carries the
# details under a heading this script did not recognise -- so when nothing was
# redacted, the source itself has to be clean.
if redacted_pages == 0:
    source_text = chr(10).join(page.get_text("text") for page in doc)
    still_there = [needle for needle in MUST_NOT_SURVIVE if needle in source_text]
    if still_there:
        raise SystemExit(
            f'no "{HEADING}" heading found, but {still_there} are in the document -- '
            "refusing to write an unredacted copy"
        )
    print(f'no "{HEADING}" section; source is already clean')

# Google Docs leaves the source filename in the title.
doc.set_metadata({"title": "CV - Alwin Tay Jing Xue", "author": "Alwin Tay Jing Xue"})

# Verify against the *output*, not the in-memory document: what matters is what
# a reader can extract from the file on disk.
doc.save(OUT, garbage=4, deflate=True, clean=True)
doc.close()

check = fitz.open(OUT)
text = "\n".join(page.get_text("text") for page in check)
survivors = [needle for needle in MUST_NOT_SURVIVE if needle in text]
pages, size = check.page_count, OUT.stat().st_size
check.close()

if survivors:
    OUT.unlink()
    raise SystemExit(f"redaction failed, {survivors} still extractable -- output deleted")

print(f"redacted {redacted_pages} page(s); none of {len(MUST_NOT_SURVIVE)} details survive")
print(f"wrote {OUT}  {pages} pages  {size / 1024:.0f} KB")

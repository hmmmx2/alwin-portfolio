"""
Cut the subject out of the profile photo and frame it for the hero's disc.

The source is 1024x1024, fully opaque, shot against a real wall — warm beige,
lit by a gradient that runs from luma ~203 on one side to ~145 on the other.

There is no threshold that separates that from the subject. The face samples
175-186, which sits *inside* the wall's range, and the steepest gradient across
the jaw/wall boundary is only 15-42 luma units. An earlier version of this
script flood-filled from the border against a brightness-and-neutrality
predicate, which worked on a photo shot against a flat checkerboard; against
this one it matches 0.02% of the frame and would ship the wall.

So the mask comes from grabCut, which models foreground and background as
colour distributions and cuts where the two disagree, rather than at a
brightness the wall and the cheek happen to share. It is seeded with what we
can assert for free: near-black is hair or shirt, the bright top strip and side
margins are wall, everything in the middle is unknown and left for the solver.

Usage:
    python scripts/build-portrait.py <source.png> [out.webp]

Requires Pillow, numpy and OpenCV (`pip install pillow numpy opencv-python`).
Not part of the build — run it by hand when the photo or its framing changes.
`HEAD_FRACTION` and `HEAD_TOP` below are the knobs for how tightly the circle
frames the head.
"""

import hashlib
import io
import re
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "public" / "alwin-source.png")
OUT = sys.argv[2] if len(sys.argv) > 2 else str(ROOT / "public" / "alwin.webp")

# Extensions the cleanup below sweeps, so switching output format doesn't strand
# the previous build in public/ under its old suffix.
AVATAR_SUFFIXES = (".png", ".webp", ".avif", ".jpg")

# Framing, as fractions of the final square's height. These are the two knobs:
# how big the face is, and how much room sits above it.
HEAD_FRACTION = 0.64  # head (hair top to jaw) as a share of the disc
HEAD_TOP = 0.15  # space above the hair

# Seeds for grabCut, all deliberately conservative — anything we get wrong here
# the solver cannot recover from, whereas anything we leave unknown it can.
DARK_IS_SUBJECT = 40  # hair and shirt; the wall never comes near this
BRIGHT_IS_WALL = 120  # only applied within the margins below
TOP_MARGIN = 40  # rows of the top edge that are wall above the hair
SIDE_MARGIN = 25  # columns either side that are wall beside the shoulders
GRABCUT_ITERATIONS = 5
# Largest enclosed background region still treated as a mistake rather than a
# real gap. The holes this photo produced were 1-271 px; a gap you could see
# through would be orders of magnitude larger.
MAX_HOLE = 2000

im = Image.open(SRC).convert("RGBA")
rgb = np.asarray(im.convert("RGB")).astype(np.int16)
h, w = rgb.shape[:2]

luma = rgb.mean(axis=2)

# Probably-background everywhere, probably-foreground over the middle where a
# head-and-shoulders portrait puts its subject.
mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
mask[round(0.06 * h) :, round(0.15 * w) : round(0.88 * w)] = cv2.GC_PR_FGD

mask[luma < DARK_IS_SUBJECT] = cv2.GC_FGD

# Bright pixels *in the margins only*. Applying this over the whole frame would
# mark the forehead as wall, which is the trap the old threshold fell into.
for region in (
    np.s_[:TOP_MARGIN, :],
    np.s_[:, :SIDE_MARGIN],
    np.s_[:, -SIDE_MARGIN:],
):
    window = mask[region]
    window[luma[region] > BRIGHT_IS_WALL] = cv2.GC_BGD
    mask[region] = window

cv2.grabCut(
    cv2.cvtColor(np.asarray(im.convert("RGB")), cv2.COLOR_RGB2BGR),
    mask,
    None,
    np.zeros((1, 65), np.float64),
    np.zeros((1, 65), np.float64),
    GRABCUT_ITERATIONS,
    cv2.GC_INIT_WITH_MASK,
)

foreground = np.isin(mask, (cv2.GC_FGD, cv2.GC_PR_FGD))

# The subject is one solid mass, so anything not joined to it is a speck the
# solver stranded in the wall — a dozen pixels that would render as dirt on the
# glass. Keep the largest component and drop the rest.
count, labels = cv2.connectedComponents(foreground.astype(np.uint8))
sizes = np.bincount(labels.ravel())
sizes[0] = 0  # label 0 is the background
subject_label = int(np.argmax(sizes))
strays = sorted((int(n) for n in sizes[1:] if n and n != sizes[subject_label]), reverse=True)
foreground = labels == subject_label
if strays:
    print(f"dropped {len(strays)} stray blob(s): {strays[:5]}")

# The mirror of the same idea: a background region *enclosed* by the subject is
# a hole, not a gap. grabCut punches these through the specular highlights —
# hair shine and the lit forehead are as bright as the wall, so they land in the
# wall's colour distribution. Left in, they render as dark specks on the face,
# because what shows through a transparent pixel here is the dark page.
#
# Bounded by MAX_HOLE, so a photo with a genuine see-through gap (an arm away
# from the body, daylight between hair strands) keeps it instead of being
# silently welded shut.
hole_count, hole_labels = cv2.connectedComponents((~foreground).astype(np.uint8))
touching_border = set(
    np.concatenate(
        [hole_labels[0], hole_labels[-1], hole_labels[:, 0], hole_labels[:, -1]]
    ).tolist()
)
enclosed = [
    label
    for label in range(1, hole_count)
    if label not in touching_border and (hole_labels == label).sum() <= MAX_HOLE
]
if enclosed:
    filled = np.isin(hole_labels, enclosed)
    foreground |= filled
    print(f"filled {len(enclosed)} enclosed hole(s): {int(filled.sum())} px")

background = ~foreground
print(f"background: {background.mean():.1%} of the frame")
print(f"subject: {int(sizes[subject_label])} px, {foreground.mean():.1%} of the frame")

# Two assertions, because each has caught a real failure. A leak through the
# face reaches the top edge; a collapsed mask shows up in the row span.
corners = [bool(foreground[y, x]) for y, x in ((0, 0), (0, w - 1), (0, w // 2))]
print(f"top corners kept (want all False): {corners}")

subject_rows = foreground.sum(axis=1)
top = int(np.argmax(subject_rows > 0))
bottom = h - 1 - int(np.argmax(subject_rows[::-1] > 0))
print(f"subject spans rows {top}..{bottom}")

if any(corners) or not 0.25 < foreground.mean() < 0.75:
    raise SystemExit("mask failed its sanity checks — inspect before shipping")

alpha = np.where(background, 0, 255).astype(np.uint8)

# Soften the cut, then pull the ramp inwards so the wall-coloured rind along the
# boundary is cut rather than half-kept. Wider than the values this used against
# a crisp checkerboard (0.8 / 90): a photographed edge is softer, and ~12% of
# the raw boundary ring still reads as wall.
alpha_img = Image.fromarray(alpha, mode="L").filter(ImageFilter.GaussianBlur(1.2))
alpha_arr = np.asarray(alpha_img).astype(np.int16)
alpha_arr = np.clip((alpha_arr - 110) * (255 / (255 - 110)), 0, 255).astype(np.uint8)

out = np.dstack([np.asarray(im.convert("RGB")), alpha_arr])
result = Image.fromarray(out, mode="RGBA")

# Crop to the subject so it fills the hero's slot instead of floating in the
# empty margins the checkerboard used to occupy.
bbox = result.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
print("alpha bbox:", bbox)
result = result.crop(bbox)

# Frame the head inside a square canvas.
#
# The hero renders this inside a circle, and a non-square source would get
# cropped again by `object-cover` before the circle even applies.
#
# Framed against the *head*, not the whole silhouette. Padding the full subject
# until the top looked right kept shrinking the face, because the shoulders were
# taking most of the frame — at 36% headroom the head was only 45% of the disc
# and unreadable at 200px.
#
# The head's lower bound is the narrowest row below it: the neck. Detected from
# the alpha's width profile rather than hardcoded, so a different photo re-frames
# itself — the head is narrow, the neck narrower, and the shoulders flare to the
# full frame width immediately below.
profile = (np.asarray(result.getchannel("A")) > 8).sum(axis=1)
lo, hi = int(len(profile) * 0.45), int(len(profile) * 0.85)
head_height = lo + int(np.argmin(profile[lo:hi]))

side = round(head_height / HEAD_FRACTION)
canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
# PIL clips whatever falls outside, which is the point: the shoulders run off
# the bottom instead of being shrunk to fit.
canvas.paste(result, ((side - result.width) // 2, round(HEAD_TOP * side)), result)
result = canvas
print(
    f"framed to {result.size}: head {head_height}px = {HEAD_FRACTION:.0%} of the disc, "
    f"{HEAD_TOP:.0%} above the hair"
)

# The framed canvas lands around 1114px, so this is a downscale — it never
# invents detail. next/image resizes down from here for the ~200px disc, and the
# headroom is what keeps it sharp on a 3x display.
result.thumbnail((1024, 1024), Image.LANCZOS)

"""
Write under a content-hashed filename and point the content file at it.

`/_next/image` responses are cached hard, keyed on the source URL — so
overwriting `alwin.png` in place leaves every browser that already has it (and
Next's own optimiser cache) serving the previous crop indefinitely. The file
changes, the page doesn't, and it looks like the edit silently did nothing.
Changing the filename is the only thing that reliably invalidates both.
"""
out_path = Path(OUT)

# WebP, not PNG: the subject is a colour photograph now, where lossless costs
# ~8x the bytes for no visible difference at the size this renders. next/image
# re-encodes to WebP for the browser regardless, so this only decides what the
# repository carries.
buffer = io.BytesIO()
if out_path.suffix == ".webp":
    result.save(buffer, format="WEBP", quality=92, method=6)
else:
    result.save(buffer, format="PNG", optimize=True)
data = buffer.getvalue()

hashed = out_path.with_name(
    f"{out_path.stem}.{hashlib.sha256(data).hexdigest()[:8]}{out_path.suffix}"
)

# Drop previous builds so public/ doesn't accumulate orphaned crops. Sweeps
# every avatar extension, not just the current one — otherwise changing output
# format strands the last build under its old suffix, still referenced by
# nothing and still committed.
stale_files = [
    path
    for suffix in AVATAR_SUFFIXES
    for path in (
        *out_path.parent.glob(f"{out_path.stem}.*{suffix}"),
        out_path.with_suffix(suffix),
    )
]
for stale in stale_files:
    if stale != hashed and stale.exists():
        stale.unlink()
        print(f"removed stale {stale.name}")

hashed.write_bytes(data)
print(f"wrote {hashed.name}  {result.size}  {len(data) / 1024:.0f} KB")

profile_ts = ROOT.parent / "shared" / "src" / "content" / "profile.ts"
source = profile_ts.read_text(encoding="utf-8")
updated, count = re.subn(r'avatar: "/[^"]*"', f'avatar: "/{hashed.name}"', source)
if count != 1:
    raise SystemExit(f"expected exactly one avatar line in {profile_ts}, found {count}")
profile_ts.write_text(updated, encoding="utf-8")
print(f"pointed {profile_ts.name} at /{hashed.name}")

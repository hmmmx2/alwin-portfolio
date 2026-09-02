# Alwin's Portfolio

Live at **[alwint.dev](https://www.alwint.dev)**.

A production port of a single-file Claude Design document into a real
application: **Next.js 16 + React 19**, TypeScript throughout, Tailwind v4.
The visual design is preserved; the hero's ASCII wave animation was rebuilt on
canvas and given pointer interaction.

```
portfolio/
  shared/     @portfolio/shared   types, zod schemas, the CV content itself
  web/        @portfolio/web      Next.js App Router — the whole application
  prototype/  the pre-port static build, kept for reference
  scripts/    redact-resume.py — strips the referees from the published CV
```

There used to be a separate Express service. It is gone: of its seven
endpoints, four existed only because the front end was a different origin, and
folding the remaining two into Route Handlers deleted CORS, a dual API-URL
split, and a `frame-ancestors` override along with it. See
[Architecture](#architecture) below.

## Running it

```bash
pnpm install
cp web/.env.example web/.env.local
pnpm dev
```

<http://localhost:3100>. Every value in `.env.example` has a working default,
so the site runs with no configuration — only the contact form and the
analytics beacon read any of it.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next dev server on 3100 |
| `pnpm build` | production build |
| `pnpm test` | contact + analytics handler tests |
| `pnpm typecheck` / `pnpm lint` | across both packages |
| `pnpm db:push` | apply the schema; run once per schema change |

## Deploying

Vercel, from the repository root — `vercel.json` already points the build at the
workspace, which is what lets `@portfolio/shared` resolve.

**Environment variables to set in Vercel:**

| Variable | Notes |
| --- | --- |
| `TURSO_DATABASE_URL` | `libsql://…` from Turso |
| `TURSO_AUTH_TOKEN` | from `turso db tokens create` |
| `ANALYTICS_SALT` | **`openssl rand -hex 24`.** Production refuses to start on the example value |
| `ALLOWED_COUNTRIES` | optional; defaults to the ten below |
| `NEXT_PUBLIC_SITE_URL` | `https://www.alwint.dev` |
| `MAIL_*` | optional; without them a message is stored and logged, not sent |

Then `pnpm db:push` once against the Turso database.

### Capacity

Every page is static and served from the CDN — the content is a TypeScript
module compiled into the bundle, not something fetched at request time. Only
`/api/contact` and `/api/analytics/pageview` invoke a function at all, so a
thousand visitors is a few hundred kilobytes of edge traffic and essentially no
compute.

### Country allowlist

Requests from outside **US, MY, SG, GB, IE, FR, DE, JP, TW, CA** get a 403,
implemented in `web/src/middleware.ts`.

**Be clear about what this is.** An IP allowlist is a traffic filter, not a
security control — one VPN click defeats it. What it definitely does is turn
away real recruiters in Australia, India, the UAE, the Netherlands and
Switzerland. It is a deliberate trade, and `ALLOWED_COUNTRIES` exists so a
country can be added without a deploy.

Two carve-outs keep it from doing damage it was not meant to do:

- **Crawlers are admitted from anywhere**, matched on user-agent. A blocked
  crawler means the site quietly leaves Google's index, and the OG unfurlers
  are how a portfolio link actually gets opened in LinkedIn and Slack. That
  match is spoofable, which is fine — forging a Googlebot header to read a
  public CV achieves nothing a VPN would not.
- **An absent country header means allow.** There is no `x-vercel-ip-country`
  in `next dev`, and failing closed would make the site look broken on the
  machine it is developed on.

### Security

- **CSP with a per-request nonce**, built in the middleware because a static
  header cannot carry one. Locked to `'self'` throughout — achievable only
  because the design self-hosts its fonts and inlines its icons, with no CDN.
  `style-src` keeps `'unsafe-inline'`, which Tailwind and `next/font` require.
- **Static headers** in `next.config.ts`: HSTS with preload, `nosniff`,
  `Referrer-Policy`, `X-Frame-Options: DENY`, and a `Permissions-Policy`
  denying camera, microphone and geolocation.
- **Rate limiting in the database**, not in memory. `express-rate-limit` counted
  per process, which on serverless resets on every cold start — it would have
  looked like it worked while enforcing nothing. Contact is 5/hour, analytics
  60/hour, keyed on a salted daily visitor hash. `@upstash/ratelimit` is the
  upgrade path if volume ever justifies a second service.
- **No raw IP addresses are stored or logged**, anywhere. Rate limiting and
  pageview de-duplication both key off a hash that rotates at midnight UTC.
  Referrers are reduced to their host, because a full referring URL can carry a
  token in its query string. `DNT` and `Sec-GPC` are honoured by writing
  nothing.
- **The published CV is redacted.** `scripts/redact-resume.py` removes the
  referees' names, emails and phone numbers — from the text layer, the content
  streams and the `mailto:` link annotations — and refuses to write a file that
  still contains any of them.

## Architecture

`shared` is the contract and the content. Every shape that crosses the wire is
a zod schema there, and the CV itself lives in `shared/src/content/` as
TypeScript rather than a CMS — it changes with a deploy and is identical for
every visitor, so a database would add a query to every render without making
anything easier to edit.

The web app imports that module directly. It used to fetch it over HTTP from
the Express service and fall back to the bundled copy when that failed; the
fallback was silent by design, which is exactly what made it dangerous — a
build once shipped an entire set of placeholder awards because the service it
fetched from was serving a stale image, and every check passed. Compiling the
content in removes the failure mode rather than guarding against it, and CI
greps the build output for the old placeholder strings regardless.

## The front end

Server Components by default. Only five things are client islands: the wave
field, the nav (scroll spy + mobile menu), the card spotlights, the reveal
observer, and the contact form.

### Routes

| | |
| --- | --- |
| `/` | hero, stack, experience teaser, research, projects teaser, contact |
| `/experience` | the full work history and the resume download |
| `/projects` | one showcase row per project — bullets, tech tags, CTAs, screenshot mosaic |
| `/research` | one split row per paper — metadata badges, abstract, BibTeX, embedded PDF |

Navbar: **Home · Experience · Projects · Research**. Contact is deliberately not
in it — the section, its form and the `POST /api/contact` pipeline all remain,
reachable from the hero CTA, the footer and the nav's mail icon.

Both teasers use the same two props (`limit`, `moreHref`) and render the same
"All …(+N) →" pill, so `ExperienceSection` and `ProjectsSection` behave
identically on the home page.

### The Projects showcase

`ProjectShowcase` renders one large row per project — text one side, screenshot
mosaic the other, alternating down the page — on the existing glass tokens.

`Project.images` is a single array rather than a thumbnail field plus a mosaic
field: the teaser card takes `images[0]`, so a card image and the showcase can't
drift apart. With **no** screenshots the mosaic degrades to one glass panel per
row; three or more assemble the full two-portrait-plus-wide arrangement.

Two things that bit while building it, both grid semantics:

- **`order` drives grid auto-placement, not just visual position.** Setting it on
  only the children that move put the media into the 1px divider column and
  collapsed it to 3×2px. All three children carry an explicit order at `lg`.
- **The column template mirrors with the order.** Swapping order alone left the
  media in the 5fr slot on flipped rows, so every other row was narrower.

This page also opts out of the reveal system — it emits no `data-reveal`, so
`RevealObserver` never sees it and nothing animates on scroll. That is local to
this route; the home page and `/experience` still reveal.

### The Research page and its arXiv embed

Split row per paper: venue / date / peer-review badges, title, authors, abstract
and the actions on the left; the paper itself on the right. Sides are consistent
here, not alternating.

**The viewer embeds `arxiv.org/pdf/<id>`, never `/abs/`.** Checked against the
live site:

| | `X-Frame-Options` | CSP `frame-ancestors` | framable |
| --- | --- | --- | --- |
| `arxiv.org/abs/<id>` | `SAMEORIGIN` | `'none'` | never |
| `arxiv.org/pdf/<id>` | — | — | yes |

Three deliberate choices in that iframe:

- `loading="lazy"`, so a visitor who never scrolls to a paper never fetches its
  PDF. **This is the site's only third-party runtime dependency** — the jsDelivr
  icon CDN was removed earlier for exactly this reason, so it is a trade rather
  than an oversight. When someone does scroll there, arxiv.org sees the request.
- **Not sandboxed** — `sandbox` disables Chrome's built-in PDF viewer.
  `referrerPolicy="no-referrer"` keeps this site's URL off the request.
- **Hidden below `lg` rather than shrunk.** Mobile Safari and Chrome Android
  generally refuse to render a PDF in an iframe and leave a blank rectangle.
  Measured: with the wrapper at `display: none`, a full scroll of the page makes
  **zero** requests to arxiv.org, so phones pay nothing for a frame they could
  not use. They get the placeholder card and the same "Open in arXiv ↗" button.

`arxivId` is `null` on every paper today, so each row shows the placeholder
panel. Set a real identifier in `shared/src/content/research.ts` and the viewer
wires itself up.

`lib/bibtex.ts` renders the Copy BibTeX payload — entry type by `kind` (a
preprint is `@misc`, not `@inproceedings`), authors joined with ` and `, the
title double-braced against BibTeX's capitalisation styles, and TeX
metacharacters escaped. `authors` exists on the schema because a cite button
emitting an entry with no author field is worse than no button.

The nav, footer and reveal observer live in `app/layout.tsx`, not in each page,
so a new route gets the whole chrome for free. Three consequences worth knowing:

- **Internal links must be root-relative.** A bare `#projects` resolves against
  whatever page you are on, so the nav and footer use `/#projects`. The nav mixes
  both kinds — `/experience` matches on pathname, the rest are anchors tracked by
  the scroll spy, and the spy only runs on `/`.
- **`RevealObserver` is keyed on the pathname.** It snapshots `[data-reveal]`
  once on mount, and from the layout it survives client-side navigation — without
  re-running, the second page's elements sit at `opacity: 0` forever. A hard
  refresh hides this completely; it only appears when you navigate in-app.
- **`<html data-scroll-behavior="smooth">`.** `globals.css` sets
  `scroll-behavior: smooth`; without the attribute Next animates the scroll on
  every route change, so navigating crawls to the top instead of landing there.
  The attribute keeps smooth scrolling for in-page anchors only.

The nav's active item resolves as **two separate lookups — scroll spy first,
then route**. A single "route match wins" pass cannot work with Home in the
list: `pathname === "/"` matches everywhere on the home page, so Research could
never highlight. Relatedly, the spy accumulates intersection ratios across
callbacks rather than reading each batch, because an IntersectionObserver only
reports targets whose state *changed* — reading the batch alone left the last
section stuck active once you scrolled above it.

### Mobile menu

Below `md` (768px) the link row is replaced by a hamburger; the collapsed bar
keeps logo, email and resume so both actions stay one tap away. The panel closes
on Escape, on an outside click and on navigation — the last by deriving from the
pathname the menu was opened at rather than resetting state in an effect, which
would be a cascading render and would miss browser back/forward.

The indicator pill re-measures on a `ResizeObserver`, not just when the active
item changes. Below `md` the row is `display: none` and every rect measures zero;
since resizing doesn't change which item is active, without that observer the
pill would come back from a phone width stuck at 0×0.

Tailwind v4, CSS-first — there is no `tailwind.config.ts`. `globals.css` splits
tokens deliberately: `@theme` for compile-time values (colour, type, radii) and
plain `:root` custom properties for anything overridden at runtime
(`--glass-blur`, `--ascii-opacity`, `--cell`). Tailwind inlines `@theme` values
into the utilities it generates, so a scoped override of one would silently do
nothing.

### What changed from the design, and why

- **`style-hover` / `style-focus`** are design-canvas-only attributes; they
  became real `:hover` / `:focus-visible` CSS. The source had **no focus styles
  at all**, which made the page unusable by keyboard — there is now one
  consistent focus ring plus a skip link.
- **Brand icons** were CSS `mask` images fetched from `cdn.jsdelivr.net` — a
  third-party request per icon that flashes empty on a slow connection and shows
  nothing offline. They are inline SVG from the `simple-icons` package now. The
  design's own tuned brand colours (LangChain, FastAPI, PostgreSQL) are kept.
- **Fonts** moved from a blocking `<link>` to `next/font/google`, self-hosted.
- **Contact fields** were placeholder-only, invisible to screen readers, and
  submitted through an `onClick` rather than a form. They have real `<label>`s,
  inline error messages and a proper submit now.
- **Body copy** was `rgba(244,245,246,.46)` — roughly 3.4:1 on `#050506`, under
  WCAG AA. Prose is `.62` (~5.1:1); the low alphas are kept for decorative
  eyebrows only.
- **The hero's `_fitHero()` hack** measured the nav and reflowed the hero twice
  per resize. That's CSS now.
- **All five `<image-slot>`s arrived empty** — the design had no
  `.image-slots.state.json` sidecar, so there was nothing to port. The hero slot
  now holds the real portrait (`profile.avatar` → `web/public/alwin.png`); the
  four project thumbnails still render `MediaSlot`'s honest empty frame. Drop
  files in `web/public/` and set the path in `shared/src/content/projects.ts`
  to fill those.

  The portrait is a transparent PNG in a glass disc — translucent fill, the wave
  field blurred behind it, a light top edge and a drop shadow
  (`--shadow-portrait`), no border ring. Setting `avatar: null` restores the
  placeholder.

  Its diameter is `min(18 × --cell, 200px)`: cell units so it holds its place
  inside the arch as the artwork scales, capped so it stops growing on large
  displays — unbounded it reaches 293px at 1920 and dominates the hero. The cap
  is why the disc is centred by translation rather than negative half-size
  margins; margins would have to repeat the `min()` and would silently go wrong
  the moment it engaged.

  Framing lives in the PNG, not in CSS, and is expressed against the **head**
  rather than the whole silhouette — `HEAD_FRACTION` (64%: the head's share of
  the disc) and `HEAD_TOP` (15%: the space above the hair) in
  `web/scripts/build-portrait.py`. Re-cut from the original to change it;
  scaling the processed file instead just loses detail.

  The script writes a **content-hashed filename** (`alwin.<hash>.png`) and
  rewrites the `avatar:` line in `shared/src/content/profile.ts` to match.
  That is not tidiness: `/_next/image` responses are cached hard and keyed on
  the source URL, so overwriting the file in place leaves browsers and Next's
  own optimiser serving the previous crop indefinitely. The file changes, the
  page doesn't, and it looks exactly like the edit did nothing.

  Those two knobs replaced a single "pad the subject until the top looks right"
  parameter, which was the wrong control: the shoulders take roughly a third of
  the silhouette, so buying headroom kept shrinking the face. At the point the
  top finally looked right the head was **45% of the disc** — illegible at the
  200px it actually renders at. The head's lower bound is found from the alpha's
  width profile (the narrowest row below the head is the neck), so a different
  photo re-frames itself rather than needing the numbers retuned.

  That drop shadow is a `@theme` token, not a `shadow-[…]` arbitrary value:
  multi-layer shadows with commas compile to nothing there, silently. The class
  was present and `box-shadow` computed empty.

  It hangs off a spacer that keeps the design's original 11.2 × 13 cell flow
  box. The wave field is anchored to that row's bottom edge, so growing the
  portrait directly would drag the whole arch down the page with it — and note
  that `inset-0 m-auto` does *not* centre the disc, because it is deliberately
  larger than the spacer and `margin: auto` only centres an element that fits.

## The hero animation

The original rewrote a 6,272-character `<pre>`'s `textContent` every frame,
forcing a full text layout each time, and gave every glyph the same flat colour.

`ascii-field.ts` holds the simulation as pure, DOM-free maths — the constants are
ported verbatim, because they *are* the artwork. That same function renders the
server-side still and drives the client canvas, so the hero is complete in the
initial HTML instead of popping in after hydration.

### Arc sweep

`ARC_SPAN_DEGREES` controls how far the wave wraps, centred on straight up. It
ships at **240°**, so the arc curls past the horizontal into a horseshoe around
the illustration rather than the design's flat 180° dome.

That number was not a parameter in the original — it was baked into the geometry
twice over. The falloff term was `max(0, sin a)`, which is only positive across
the upper half-plane, and the wave origin sat *below* the bottom row, so no cell
could fall past the horizontal even if the maths had allowed it. Both now derive
from the constant: the falloff is a cosine lobe stretched across the span (which
reduces to exactly `sin a` at 180°, so this generalises the design rather than
replacing it), and `ROWS` grows to hold whatever the sweep needs below the
origin. The field's anchor drops by the height of those added rows, so widening
the arc doesn't shove the whole arch up the page.

Two details worth knowing if you change it. The design's 0.16 floor at the
horizon was invisible only because no cells existed beyond it; now that they do,
the whole term is windowed to zero or it would carpet the corners in faint
noise. And that window straddles the boundary rather than ramping inward to it —
ramping inward cost about 10° of visible arc, so a 240° setting measured 230° on
screen. It measures 238.6° now, the remainder being the character grid's
discreteness.

`AsciiWaveField.tsx` renders in three layers:

- a **glyph layer**, repainted at the design's 14fps step so the field keeps its
  stepped, terminal-like cadence;
- a **bloom layer** holding only the densest glyphs, blurred and added back —
  replacing the flat `text-shadow`;
- the **display canvas**, compositing both every animation frame with a smoothly
  interpolated alpha, so the field breathes at 60fps even though the glyphs only
  change fourteen times a second.

Drawing one pass per density level (thirteen `fillText` calls per row instead of
one) is what buys the per-level colour ramp: faint cells recede, dense cells read
hot.

New: the pointer disturbs the wave's **phase** in a decaying gaussian around the
cursor, so the surface reads as being pushed rather than just brightened; and the
field's amplitude falls off as the hero scrolls away.

Fixed along the way: phase now advances with wall-clock time (the original ran
faster on a 144Hz display), the loop stops when the hero is off-screen or the tab
is hidden (the original ran forever), and `prefers-reduced-motion` renders the
still and never schedules a frame at all.

Elsewhere on the page: the nav's active pill glides between sections with a FLIP
transition instead of snapping, one page-level IntersectionObserver drives all
reveal animations with a CSS-custom-property stagger, cards track a
rAF-batched pointer spotlight that never touches React state, and the experience
spine and footer wordmark animate on `animation-timeline: view()` where it's
supported. Every one of those is gated behind the same reduced-motion check.

## The footer signature

`Wordmark.tsx` holds two guarantees at every viewport width: the text spans
**exactly 85% of the viewport**, breaking out of the footer's 1240px column on
wide screens, and the **letterforms are complete**, with the baseline sitting on
the bottom edge of the page. Only what falls below the baseline is trimmed.

Neither is a tuned `vw` value. Both come from measurement, because the name is
content data — a different name has a different width ratio and different font
metrics, and has to re-fit rather than overflow:

- **width** — solve `fontSize = 85vw / (laid-out width in em)`
- **clip** — `height: <baseline offset>em`, from the font's own ascent and
  the half-leading a `line-height: 1` line box produces

The width measurement uses a `Range` over the text node, **not** canvas
`measureText`. Canvas returns the font's advance width and knows nothing about
CSS; this wordmark carries `tracking-[-0.045em]`, which over eighteen characters
removes 0.81em. Sized against the advance it rendered at 76.5% of the viewport
while every number reported 85%. The baseline offset *does* come from canvas
font metrics, which is correct — letter-spacing is purely horizontal.

Two things that must not be absolute lengths here:

- Full-bleed uses `margin-inline`, not `left: 50%` + a transform, because the
  scroll-driven `wordmark-settle` animation owns `transform`.
- The drop-shadows are in `em`. The design's `0 18px 46px` was authored for a
  fixed 124px font; now that the font scales with the viewport, a 46px blur on a
  44px-tall glyph blows out the filter region, and combined with
  `background-clip: text` the wordmark **stops painting entirely** below roughly
  500px wide. It looked fine at every desktop size.

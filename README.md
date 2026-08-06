# Alwin's Portfolio

A production port of the single-file Claude Design document
(`Alwin Portfolio.dc.html`) into a real application: **Next.js 16 + React 19**
on the front end, **Express 5** on the back end, TypeScript throughout,
Tailwind v4 for styling.

The visual design is preserved. The hero's ASCII wave animation was rebuilt on
canvas and given pointer interaction.

```
portfolio/
  shared/   @portfolio/shared  types, zod schemas, canonical content
  api/      @portfolio/api     Express 5 + libsql + Drizzle
  web/      @portfolio/web     Next.js App Router
```

## Running it

```bash
pnpm install
pnpm dev
```

Web on <http://localhost:3100>, API on <http://localhost:4100>. Copy
`api/.env.example` → `api/.env` and `web/.env.example` → `web/.env.local` if you
need to change anything; every value has a working default.

| Command | What it does |
| --- | --- |
| `pnpm dev` | both servers, watched |
| `pnpm build` | API bundle + Next production build |
| `pnpm start` | both, from the built output |
| `pnpm typecheck` | `tsc --noEmit` across all three packages |
| `pnpm lint` | ESLint across all three packages |
| `pnpm test` | API suite (Vitest + supertest) |

## Running it in Docker

```bash
docker compose up --build
```

Web on <http://localhost:3100>, API on <http://localhost:4100>. Copy
`.env.docker.example` → `.env` to change ports, addresses or SMTP; an empty
`.env` changes nothing.

Two images, both built from the workspace root because `@portfolio/shared` is a
`workspace:*` link and pnpm needs the lockfile and sibling manifests to resolve
it. `shared` is not a service — it is TypeScript source compiled into both.

| | |
| --- | --- |
| `api/Dockerfile` | tsup bundle on Node 22 Alpine, ~307MB |
| `web/Dockerfile` | Next standalone output, ~316MB |
| volume `api-data` | the SQLite file, so messages and analytics survive a rebuild |
| `./api/assets` | bind-mounted read-only — drop in `resume.pdf` without rebuilding |

Both run as the unprivileged `node` user, and `web` waits on the API's
`/api/health` rather than merely on the process existing.

### Three things that will bite

**`NEXT_PUBLIC_API_URL` is a build arg, not an environment variable.** Next
inlines it into the client bundle when the image is built, so setting it under
`environment:` does nothing at all — the browser keeps whatever was compiled in.
Changing an address means `docker compose up --build`.

**The browser and the server need different addresses for the same API.**
`localhost:4100` is right for a visitor's machine and wrong inside the web
container, where `localhost` is the web container. So `lib/api.ts` reads two:
`NEXT_PUBLIC_API_URL` for anything the browser issues (contact form, analytics
beacon, resume link) and `API_INTERNAL_URL` — runtime, server-only, never in the
client bundle — for server component fetches, which compose sets to
`http://api:4100`. Get this wrong and nothing breaks loudly: `getContent()`
falls back to the content bundled in `@portfolio/shared`, so the site renders
perfectly while quietly ignoring the API. A warning in the web logs is the only
symptom.

**`HOST` must be `0.0.0.0`.** The API defaults to `127.0.0.1`, which in a
container accepts connections from nothing but itself. Compose sets it; the
Dockerfile defaults it too.

The API is unreachable while the web image builds, so the prerender falls back
to bundled content and logs a warning. That is expected — every page carries
`revalidate`, so the first request after startup refreshes from the live API.

## How the three packages fit together

`shared` is the contract. Every shape that crosses the network is a zod schema
there, and the types are `z.infer`red from those schemas so there is exactly one
definition of each. The Express validator and the React contact form import the
*same* `ContactInputSchema` — they cannot drift.

It also holds the site's content as typed data. The API serves it; the web app
imports it as a **build-time fallback**, so `next build` succeeds and every page
renders even when the API is unreachable. Only live API edits go missing.

> The content is still the design's placeholder copy. Every file under
> `shared/src/content/` opens with a `PLACEHOLDER CONTENT` marker. "Nexus AI
> Labs", "Vertex Analytics", the four papers and the four repos are invented;
> only the email address is real.

## The API

| Route | |
| --- | --- |
| `GET /api/health` | uptime, version, database reachability |
| `GET /api/content` | the whole payload, cached |
| `GET /api/content/:section` | `profile` · `stack` · `experience` · `research` · `projects` |
| `POST /api/contact` | validated, spam-guarded, stored, then mailed |
| `GET /api/resume` · `/api/resume/meta` | streams the PDF, reports availability |
| `POST /api/analytics/pageview` | path + referrer host, no cookies |

Cross-cutting: helmet, a CORS allowlist, compression, three tiers of rate
limiting, request-id correlation on every response and error body, structured
pino logging, and a single error handler that renders `AppError`s as
`{ error: { code, message, requestId, fields? } }`.

**Contact messages are written to the database before the mailer runs.** If SMTP
is down the visitor still gets a 201, the row records `delivered: false` and the
error, and nothing is lost. With `MAIL_ENABLED=false` (the default) the send is
simply logged.

**No IP address is stored or logged anywhere.** Rate limiting and pageview
attribution use `sha256(dailySalt + ip + userAgent)` truncated to 16 bytes, with
the salt rotating at midnight UTC — enough to stop one client flooding the
contact form, not enough to follow anyone across days. Referrers are reduced to
their host, so query strings never land in the table. `DNT: 1` and Global
Privacy Control skip the write entirely, and the client doesn't even make the
request.

**There is no resume PDF in this repo yet.** The Resume button is always in the
navbar, as in the design. What changes is what sits behind it: once a file
exists at `api/assets/resume.pdf` (or wherever `RESUME_PATH` points) the button
gains a `download` attribute and the label "Download resume (PDF)"; until then
it carries a `title` explaining the PDF hasn't been published and `/api/resume`
answers with a clear 404 rather than a broken file. No code changes either way —
drop the file in and it switches on within ~30s.

Below the `sm` breakpoint the button collapses to just its download glyph: at
375px the full pill eats most of the room the section links need.

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

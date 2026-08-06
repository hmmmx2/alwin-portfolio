# Alwin — Portfolio

A single-page personal portfolio. Glassmorphism over a Notion-minimal layout,
dark mode only. No framework, no build step, no external requests — open
`index.html` and it runs.

```
portfolio/
├── index.html   markup + inline SVG (logo, illustration, icons)
├── styles.css   design tokens, glass system, layout, responsive rules
├── main.js      scroll progress, nav, reveals, spotlight, form
└── README.md
```

## Placeholder content to replace

The design is finished; the copy is scaffolding. Search `index.html` for
`EDIT:` comments, and replace:

| What | Where |
| --- | --- |
| Email address (3 occurrences) | `alwin@example.com` — hero social, `#copyMail` `data-mail`, footer social |
| LinkedIn URL (3 occurrences) | `https://www.linkedin.com/in/` |
| GitHub URL (3 occurrences) | `https://github.com/` |
| Work experience | the three `<li class="tl-item">` entries — Machine Learning Engineer, LLM Research Assistant, Software Business Analyst. **Dates and org names are invented.** |
| Publications | the three `<article class="paper">` entries, incl. `href="#"` — titles, venues and abstracts are all invented |
| Projects | the four `<article class="project">` cards, incl. `href="#"` — AI Tutor, LLM Fine-Tuning Pipeline, Interactive Data Dashboard, RAG Retrieval Service |
| Stack chips | four `<article class="card">` groups: Languages, LLM &amp; training, Inference &amp; serving, Data &amp; tooling |

The contact form's recipient is read from the copy button's `data-mail`, so
updating that one attribute covers the form too.

## Contact form

Static hosting has no server, so submitting composes the message in the
visitor's own mail client — they review and send it. Nothing is transmitted by
the page itself.

To use a form backend instead, give the `<form>` an `action` and `method` and
delete the submit handler in `main.js`:

```html
<form class="contact-form glass" id="contactForm" action="https://formspree.io/f/xxxx" method="post">
```

## Design system

Tokens live at the top of `styles.css` under `:root`. The ones worth knowing:

- **Surfaces** — `--ink` `#050506`, `--mild-black` `#0e0e11`, `--space-grey` `#16171a`
- **Glass** — `--glass-bg`, `--glass-brd`, `--glass-inset`, `--blur`; applied via `.glass`
- **Text** — `--text` (crisp white) down through `--text-4` (faint grey)
- **Type** — system sans (Notion's stack) + system mono for labels and tags

Add `data-spotlight` to any glass element to give it a cursor-following
highlight. Add `data-reveal` (and optionally `data-reveal-delay="1..4"`) to
have it fade up on scroll.

## Notes

- **Social links are limited to LinkedIn, GitHub and Email by design.** No
  other networks appear anywhere in the markup.
- Respects `prefers-reduced-motion` — animations and reveals are disabled.
- Falls back to opaque `--space-grey` panels where `backdrop-filter` is
  unsupported, so text never loses its background.
- Content is visible without JavaScript (`.no-js` short-circuits the reveals).

## Deploying

It's three static files. Any host works:

```bash
npx serve portfolio
```

For GitHub Pages, Netlify or Vercel, point the project at this directory with
no build command and no output directory.

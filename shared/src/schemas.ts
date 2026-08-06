import { z } from "zod";

/**
 * Every shape that crosses the network boundary is declared once, here.
 *
 * The Express validator and the React form import the *same* schema, so a
 * change to the contact contract cannot silently drift between client and
 * server -- one of them stops compiling.
 */

/* -------------------------------------------------------------------------- */
/* Content                                                                     */
/* -------------------------------------------------------------------------- */

export const SocialLinkSchema = z.object({
  /** Stable key used to pick the icon. */
  kind: z.enum(["linkedin", "github", "email", "resume", "website"]),
  label: z.string().min(1),
  href: z.string().min(1),
});

export const ProfileSchema = z.object({
  name: z.string().min(1),
  /**
   * What the footer signature says, as in "<shortName>’s Portfolio." The full
   * name belongs in the hero, but the wordmark is sized to span a fixed 85% of
   * the viewport — a longer string just makes it shorter and thinner, so this
   * is a separate field rather than a substring of `name`. Falls back to `name`.
   */
  shortName: z.string().min(1).nullable().default(null),
  /** Small mono eyebrow above the name, e.g. "PORTFOLIO · 2026". */
  eyebrow: z.string().min(1),
  role: z.string().min(1),
  email: z.string().email(),
  // No `location` field, by request: the site publishes no city or timezone.
  /** Short paragraph shown beside the contact form. */
  availability: z.string().min(1),
  /**
   * Path under /public to the hero portrait. Null renders the design's empty
   * media placeholder instead. Should be a transparent PNG — it sits inside
   * the wave field's opening with no frame behind it.
   */
  avatar: z.string().min(1).nullable().default(null),
  socials: z.array(SocialLinkSchema),
});

export const StackItemSchema = z.object({
  name: z.string().min(1),
  /** simple-icons slug; resolved to an inline SVG path at render time. */
  icon: z.string().min(1),
  /** Brand hex, including the leading '#'. */
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "expected a 6-digit hex colour"),
});

export const ExperienceEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  organisation: z.string().min(1),
  summary: z.string().min(1),
  /** e.g. "2024 — PRESENT" */
  period: z.string().min(1),
  /** e.g. "FULL-TIME" */
  kind: z.string().min(1),
  current: z.boolean().default(false),
  /**
   * Achievement bullets. Rendered only on the dedicated /experience page — the
   * home page shows a two-role teaser with summaries alone.
   */
  highlights: z.array(z.string().min(1)).default([]),
  /**
   * Stack item *names* ("PyTorch", "LangChain"), resolved against
   * `content.stack` at render so the icon slug and the design's tuned brand
   * colours live in exactly one place. An unrecognised name degrades to a plain
   * text pill.
   */
  tech: z.array(z.string().min(1)).default([]),
});

export const EducationEntrySchema = z.object({
  id: z.string().min(1),
  degree: z.string().min(1),
  institution: z.string().min(1),
  /** e.g. "2018 — 2021" */
  period: z.string().min(1),
  /** Right-column second line, e.g. "FIRST CLASS HONOURS". */
  note: z.string().default(""),
  summary: z.string().default(""),
  /** Fills the timeline dot, matching `ExperienceEntry.current`. */
  current: z.boolean().default(false),
});

export const AwardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /** Who gave it — university, conference, organiser. */
  issuer: z.string().min(1),
  /** Free-form rather than a date: awards are often just a year. */
  date: z.string().min(1),
  summary: z.string().default(""),
});

export const ResearchPaperSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /**
   * Venue name only — "EMNLP Findings", not "EMNLP FINDINGS · 2025". The year
   * used to be jammed in here, which left nothing to drive a separate date
   * badge on the research page.
   */
  venue: z.string().min(1),
  /** ISO date. Formatted for display at render, never shown raw. */
  publishedAt: z.string().min(1),
  /** Ordered as they appear on the paper. Drives the BibTeX `author` field. */
  authors: z.array(z.string().min(1)).default([]),
  /**
   * Distinguishes peer-reviewed venues from preprints, so the status badge and
   * the BibTeX entry type can't claim more than the paper earned.
   */
  kind: z
    .enum(["conference", "workshop", "journal", "preprint"])
    .default("preprint"),
  /**
   * arXiv identifier, e.g. "2411.01234". Drives the embedded PDF viewer —
   * `arxiv.org/abs/` sends `frame-ancestors 'none'` and can never be framed,
   * but `arxiv.org/pdf/` sends no framing headers at all. Null renders the
   * placeholder panel instead.
   */
  arxivId: z.string().min(1).nullable().default(null),
  abstract: z.string().min(1),
  url: z.string().min(1),
});

export const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Mono category label, e.g. "OPEN SOURCE". */
  category: z.string().min(1),
  summary: z.string().min(1),
  repoUrl: z.string().min(1).nullable(),
  demoUrl: z.string().min(1).nullable(),
  /**
   * Long-form copy for the /projects showcase row. Falls back to `summary`
   * when empty — `summary` stays short because it is what the home page's
   * teaser cards show.
   */
  description: z.string().default(""),
  /** Bullet points on the showcase row. Not shown on the teaser cards. */
  highlights: z.array(z.string().min(1)).default([]),
  /**
   * Screenshots under /public, newest first. One field rather than a separate
   * thumbnail: the teaser card takes `images[0]`, so a card image and a mosaic
   * can never drift apart. Empty renders the showcase's single-panel fallback.
   */
  images: z.array(z.string().min(1)).default([]),
  /**
   * Stack item names, resolved against `content.stack` at render — same
   * arrangement as `ExperienceEntrySchema.tech`, so icon slugs and brand
   * colours stay defined in exactly one place. Shown on /projects only; the
   * home page's teaser cards leave them off.
   */
  tech: z.array(z.string().min(1)).default([]),
});

export const ContentPayloadSchema = z.object({
  profile: ProfileSchema,
  stack: z.array(StackItemSchema),
  experience: z.array(ExperienceEntrySchema),
  research: z.array(ResearchPaperSchema),
  projects: z.array(ProjectSchema),
  education: z.array(EducationEntrySchema).default([]),
  awards: z.array(AwardSchema).default([]),
});

export const CONTENT_SECTIONS = [
  "profile",
  "stack",
  "experience",
  "research",
  "projects",
  "education",
  "awards",
] as const;

export const ContentSectionSchema = z.enum(CONTENT_SECTIONS);

/* -------------------------------------------------------------------------- */
/* Contact                                                                     */
/* -------------------------------------------------------------------------- */

export const ContactInputSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(254),
  subject: z.string().trim().min(3, "Please add a subject.").max(180),
  message: z
    .string()
    .trim()
    .min(20, "Please write at least 20 characters.")
    .max(5000),
  /**
   * Honeypot. Real users never see this field, so anything other than an empty
   * string means a bot filled the form in.
   *
   * Deliberately permissive: the server accepts the value and then discards the
   * submission, rather than returning a validation error that would tell a bot
   * exactly which field gave it away.
   */
  company: z.string().max(200).optional().default(""),
  /**
   * Milliseconds between the form mounting and submission. Bots submit almost
   * instantly; the server rejects anything under `MIN_FILL_MS`.
   */
  elapsedMs: z.number().int().nonnegative().optional(),
});

export const ContactResponseSchema = z.object({
  ok: z.literal(true),
  id: z.string(),
  /** False when the message was stored but the mailer is disabled or failed. */
  delivered: z.boolean(),
});

/* -------------------------------------------------------------------------- */
/* Resume                                                                      */
/* -------------------------------------------------------------------------- */

export const ResumeMetaSchema = z.object({
  available: z.boolean(),
  filename: z.string().nullable(),
  bytes: z.number().int().nonnegative().nullable(),
  updatedAt: z.string().nullable(),
});

/* -------------------------------------------------------------------------- */
/* Analytics                                                                   */
/* -------------------------------------------------------------------------- */

export const PageviewInputSchema = z.object({
  path: z.string().min(1).max(512),
  /** Referrer *host* only -- the API never stores a full referring URL. */
  referrer: z.string().max(255).optional(),
});

export const PageviewResponseSchema = z.object({
  ok: z.literal(true),
  /** False when the request opted out via DNT and nothing was written. */
  recorded: z.boolean(),
});

/* -------------------------------------------------------------------------- */
/* Errors                                                                      */
/* -------------------------------------------------------------------------- */

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    /** Field-level messages, keyed by dotted path, for 422 responses. */
    fields: z.record(z.string(), z.string()).optional(),
  }),
});

export const HealthSchema = z.object({
  ok: z.boolean(),
  version: z.string(),
  uptimeSeconds: z.number(),
  database: z.enum(["up", "down"]),
});

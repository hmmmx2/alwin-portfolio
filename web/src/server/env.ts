import { z } from "zod";

/**
 * Server-side environment, parsed once and never at module scope in a Route
 * Handler -- a throw at import time on Vercel takes down the whole function,
 * including the pages that need none of this.
 *
 * Only the contact form and the analytics beacon read any of it. Everything
 * else on this site is static.
 */

/** The value shipped in .env.example. Fine locally, fatal in production. */
const DEV_SALT = "portfolio-dev-salt";

/**
 * An unset variable in a .env file is written `KEY=`, not omitted -- which is
 * exactly how `.env.example` ships every optional value here.
 *
 * `z.string().min(1).optional()` rejects that: an empty string is present, so
 * `.optional()` never applies and `.min(1)` fails. The result was a 500 on
 * every API request with "String must contain at least 1 character(s)", from a
 * file the project itself hands you. Empty means absent.
 */
const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional(),
);

const optionalPort = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.coerce.number().int().min(1).max(65535).optional(),
);

const EnvSchema = z.object({
  /**
   * libsql. A Turso URL in production (`libsql://…`), or `file:./data/local.db`
   * when running against a local file.
   */
  TURSO_DATABASE_URL: z.string().min(1).default("file:./data/portfolio.db"),
  TURSO_AUTH_TOKEN: optionalText,

  /**
   * Mixed into every visitor hash and rotated daily. Left at the default, every
   * hash in the database is reproducible by anyone who can read this
   * repository -- so production refuses to start on it.
   */
  ANALYTICS_SALT: z.string().min(8).default(DEV_SALT),

  /** Minimum time a human plausibly takes to fill in the contact form. */
  CONTACT_MIN_FILL_MS: z.coerce.number().int().nonnegative().default(2500),

  MAIL_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  MAIL_HOST: optionalText,
  MAIL_PORT: optionalPort,
  MAIL_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  MAIL_USER: optionalText,
  MAIL_PASSWORD: optionalText,
  MAIL_FROM: optionalText,
  MAIL_TO: optionalText,
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;

  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const report = result.error.issues
      .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${report}`);
  }

  if (process.env.NODE_ENV === "production" && result.data.ANALYTICS_SALT === DEV_SALT) {
    throw new Error(
      "ANALYTICS_SALT is still the example value. Set a real secret before deploying — " +
        "every visitor hash is otherwise reproducible from this repository.",
    );
  }

  cached = result.data;
  return cached;
}

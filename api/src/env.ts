import { z } from "zod";

/**
 * Environment is parsed once, at import time, and the process refuses to start
 * on a bad value. A typo in CORS_ORIGINS should fail loudly at boot, not as a
 * mystery 403 in production.
 */

const csv = (value: string) =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4100),
  HOST: z.string().default("127.0.0.1"),

  /** libsql URL. `:memory:` is used by the test suite. */
  DATABASE_URL: z.string().default("file:./data/portfolio.db"),

  /** Comma-separated list of allowed browser origins. */
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3100")
    .transform(csv),

  /** Where the resume PDF lives. Absent file => /api/resume 404s cleanly. */
  RESUME_PATH: z.string().default("./assets/resume.pdf"),

  /** Rotated daily and mixed into every IP hash. Set this in production. */
  ANALYTICS_SALT: z.string().min(8).default("portfolio-dev-salt"),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),

  /** Minimum time a human plausibly takes to fill the contact form. */
  CONTACT_MIN_FILL_MS: z.coerce.number().int().nonnegative().default(2500),

  MAIL_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  MAIL_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  MAIL_USER: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  MAIL_TO: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = EnvSchema.safeParse(source);
  if (result.success) return result.data;

  const report = result.error.issues
    .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${report}`);
}

export const env: Env = parseEnv(process.env);

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

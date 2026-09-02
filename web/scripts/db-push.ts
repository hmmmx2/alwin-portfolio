/**
 * Apply the schema. Run once per schema change:
 *
 *     pnpm db:push
 *
 * Reads `web/.env.local` -- the same file you can drag into Vercel's
 * environment-variable importer -- so the connection details live in one place
 * and never have to be typed into a shell. Shell variables still win if set,
 * which is what CI uses.
 *
 * Deliberately not run at boot. On serverless "boot" is every cold start, so
 * boot-time DDL would issue six statements before serving a contact form. The
 * statements are idempotent, so running this twice is harmless.
 */
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { createClient } from "@libsql/client";
import { config as loadEnv } from "dotenv";

import { migrate } from "../src/server/migrate";

/** `.env.local` first, so a local override beats a committed default. */
function loadEnvFiles(): string[] {
  const loaded: string[] = [];
  for (const name of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), name);
    if (!existsSync(path)) continue;
    // `override: false` -- a variable already set in the shell wins, which is
    // how CI and one-off runs pass different values.
    loadEnv({ path, override: false });
    loaded.push(name);
  }
  return loaded;
}

/*
 * Say plainly which database is being written to.
 *
 * Without this the script falls back to a local SQLite file and reports
 * success, so a deploy looks finished while Turso was never touched and the
 * contact form 500s in production.
 */
function describeTarget(url: string, authToken: string | undefined, files: string[]): boolean {
  const local = url.startsWith("file:");

  console.log(files.length ? `  env: ${files.join(", ")}` : "  env: no .env file found");

  if (local) {
    console.warn("");
    console.warn("  ! Writing to a LOCAL FILE, not Turso.");
    console.warn("");
    console.warn("    TURSO_DATABASE_URL is not set. Fine for development, wrong");
    console.warn("    before a deploy. Put it in web/.env.local:");
    console.warn("");
    console.warn("      TURSO_DATABASE_URL=libsql://your-db.turso.io");
    console.warn("      TURSO_AUTH_TOKEN=your-token");
    console.warn("");
  } else if (!authToken) {
    // A Turso URL without a token fails at connect time with a bare auth
    // error; naming the cause here is cheaper than decoding that.
    console.warn("");
    console.warn("  ! TURSO_DATABASE_URL is set but TURSO_AUTH_TOKEN is not.");
    console.warn("");
  }

  return local;
}

async function main(): Promise<void> {
  const files = loadEnvFiles();
  const url = process.env.TURSO_DATABASE_URL ?? "file:./data/portfolio.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const local = describeTarget(url, authToken, files);

  // A file: URL needs its directory to exist before libsql will open it.
  if (local) {
    const path = url.slice("file:".length);
    if (path && path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  }

  const client = createClient({ url, ...(authToken ? { authToken } : {}) });
  await migrate(client);
  client.close();

  console.log(local ? `  schema applied to local file ${url}` : `  schema applied to Turso: ${url}`);
}

// Not top-level await: tsx transforms this file as CJS, where it is a syntax
// error rather than a slow path.
main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

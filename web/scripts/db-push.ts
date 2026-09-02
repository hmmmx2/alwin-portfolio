/**
 * Apply the schema. Run once per schema change:
 *
 *     pnpm db:push
 *
 * Deliberately not run at boot. On serverless "boot" is every cold start, so
 * boot-time DDL would issue six statements before serving a contact form. The
 * statements are idempotent, so running this twice is harmless.
 */
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { createClient } from "@libsql/client";

import { migrate } from "../src/server/migrate";

/*
 * Say plainly which database is being written to.
 *
 * Setting the variables with the wrong shell's syntax -- `$env:X = "..."` in
 * cmd.exe, or `X=... cmd` in PowerShell -- leaves them unset. Without this the
 * script quietly applies the schema to a local file and reports success: the
 * deploy looks done, and the contact form 500s in production because Turso was
 * never touched.
 */
function warnAboutTarget(url: string, authToken: string | undefined): boolean {
  const local = url.startsWith("file:");

  if (local) {
    console.warn("");
    console.warn("  ! Writing to a LOCAL FILE, not Turso.");
    console.warn("");
    console.warn("    TURSO_DATABASE_URL is not set in this shell. That is fine");
    console.warn("    for development, and wrong before a deploy. Set it with:");
    console.warn("");
    console.warn("      PowerShell   $env:TURSO_DATABASE_URL = 'libsql://...'");
    console.warn("      cmd.exe      set TURSO_DATABASE_URL=libsql://...");
    console.warn("      bash         export TURSO_DATABASE_URL=libsql://...");
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
  const url = process.env.TURSO_DATABASE_URL ?? "file:./data/portfolio.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const local = warnAboutTarget(url, authToken);

  // A file: URL needs its directory to exist before libsql will open it.
  if (local) {
    const path = url.slice("file:".length);
    if (path && path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  }

  const client = createClient({ url, ...(authToken ? { authToken } : {}) });
  await migrate(client);
  client.close();

  console.log(local ? `schema applied to local file ${url}` : `schema applied to Turso: ${url}`);
}

// Not top-level await: tsx transforms this file as CJS, where it is a syntax
// error rather than a slow path.
main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

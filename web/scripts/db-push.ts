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

async function main(): Promise<void> {
  const url = process.env.TURSO_DATABASE_URL ?? "file:./data/portfolio.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  // A file: URL needs its directory to exist before libsql will open it.
  if (url.startsWith("file:")) {
    const path = url.slice("file:".length);
    if (path && path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  }

  const client = createClient({ url, ...(authToken ? { authToken } : {}) });
  await migrate(client);
  client.close();

  console.log(`schema applied to ${url.replace(/\/\/.*@/, "//***@")}`);
}

// Not top-level await: tsx transforms this file as CJS, where it is a syntax
// error rather than a slow path.
main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

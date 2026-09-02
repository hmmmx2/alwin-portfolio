import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

import * as schema from "./db/schema";
import { env } from "./env";

export type Database = LibSQLDatabase<typeof schema>;

/**
 * One client per warm function instance.
 *
 * libsql over HTTP holds no long-lived socket, so a module-level client is
 * safe on serverless and saves a connection setup per invocation. Turso is
 * libsql hosted, which is why moving off a local SQLite file was a URL change
 * rather than a driver swap.
 */
let cached: { db: Database; client: Client } | null = null;

export function database(): { db: Database; client: Client } {
  if (cached) return cached;

  const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = env();
  ensureDirectory(TURSO_DATABASE_URL);
  const client = createClient({
    url: TURSO_DATABASE_URL,
    ...(TURSO_AUTH_TOKEN ? { authToken: TURSO_AUTH_TOKEN } : {}),
  });

  cached = { db: drizzle(client, { schema }), client };
  return cached;
}

/**
 * libsql will not create a missing directory for a `file:` URL, and returns a
 * bare CANTOPEN. Production is Turso and never takes this path; local
 * development does, and the Express client this replaced did the same.
 */
function ensureDirectory(url: string): void {
  if (!url.startsWith("file:")) return;
  const path = url.slice("file:".length);
  if (path && path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
}

/** Tests mount their own in-memory database rather than this one. */
export function createDatabase(url: string): { db: Database; client: Client } {
  ensureDirectory(url);
  const client = createClient({ url });
  return { db: drizzle(client, { schema }), client };
}

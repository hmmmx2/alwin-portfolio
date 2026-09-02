import type { Client } from "@libsql/client";

/**
 * Schema as plain idempotent DDL rather than a migration folder. The tables are
 * append-only and additive, so there is nothing here a generated migration
 * would do better.
 *
 * Unlike the Express version this does *not* run at boot. On serverless "boot"
 * is every cold start, so it would issue six statements before serving a
 * contact form. Run `pnpm db:push` once per schema change instead.
 */
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS contact_messages (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     email TEXT NOT NULL,
     subject TEXT NOT NULL,
     message TEXT NOT NULL,
     delivered INTEGER NOT NULL DEFAULT 0,
     delivery_error TEXT,
     created_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
     ON contact_messages (created_at)`,

  `CREATE TABLE IF NOT EXISTS pageviews (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     path TEXT NOT NULL,
     referrer_host TEXT,
     visitor_hash TEXT NOT NULL,
     created_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS pageviews_created_at_idx ON pageviews (created_at)`,
  `CREATE INDEX IF NOT EXISTS pageviews_path_idx ON pageviews (path)`,

  `CREATE TABLE IF NOT EXISTS rate_limits (
     key TEXT PRIMARY KEY,
     count INTEGER NOT NULL,
     window_start INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx ON rate_limits (window_start)`,
];

export async function migrate(client: Client): Promise<void> {
  for (const statement of STATEMENTS) {
    await client.execute(statement);
  }
}

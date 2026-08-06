import type { Client } from "@libsql/client";

/**
 * Schema is applied at boot with plain idempotent DDL rather than a migration
 * folder. The tables are append-only and additive, so there is nothing here a
 * generated migration would do better -- and it keeps `pnpm start` a single
 * step with no pre-deploy hook.
 *
 * `pnpm db:generate` still produces drizzle-kit migrations if this ever needs
 * to become a real migration history.
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

  `CREATE TABLE IF NOT EXISTS resume_downloads (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     visitor_hash TEXT NOT NULL,
     created_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS resume_downloads_created_at_idx
     ON resume_downloads (created_at)`,

  `CREATE TABLE IF NOT EXISTS pageviews (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     path TEXT NOT NULL,
     referrer_host TEXT,
     visitor_hash TEXT NOT NULL,
     created_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS pageviews_created_at_idx ON pageviews (created_at)`,
  `CREATE INDEX IF NOT EXISTS pageviews_path_idx ON pageviews (path)`,
];

export async function migrate(client: Client): Promise<void> {
  for (const sql of STATEMENTS) {
    await client.execute(sql);
  }
}

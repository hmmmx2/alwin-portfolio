import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

import { env } from "../env";
import * as schema from "./schema";

export type Database = LibSQLDatabase<typeof schema>;

/**
 * libsql is used instead of better-sqlite3 because it ships prebuilt binaries
 * on every platform this repo is developed on -- no node-gyp toolchain needed.
 * Moving to Postgres later is a driver swap plus `drizzle-orm/node-postgres`.
 */
export function createDatabase(url: string = env.DATABASE_URL): {
  db: Database;
  client: Client;
} {
  // A file: URL needs its directory to exist before libsql will open it.
  if (url.startsWith("file:")) {
    const filePath = url.slice("file:".length);
    if (filePath && filePath !== ":memory:") {
      mkdirSync(dirname(filePath), { recursive: true });
    }
  }

  const client = createClient({ url });
  return { db: drizzle(client, { schema }), client };
}

import type { Client } from "@libsql/client";

import type { Database } from "./db/client";
import type { Mailer } from "./services/mailer";

/**
 * Everything a route needs that isn't a request. Passed explicitly rather than
 * imported as a module singleton, so tests can mount `buildApp` against an
 * in-memory database and a stub mailer.
 */
export interface AppContext {
  db: Database;
  client: Client;
  mailer: Mailer;
  startedAt: number;
  version: string;
}

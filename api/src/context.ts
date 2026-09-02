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
  /**
   * Absolute path to the resume PDF. Injected rather than read from env inside
   * the service, so a test can point it at a fixture — the availability tests
   * used to depend on the repository simply not containing a PDF, which
   * stopped being true the moment a real one was published.
   */
  resumePath: string;
  startedAt: number;
  version: string;
}

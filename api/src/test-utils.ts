import type { Express } from "express";

import { buildApp } from "./app";
import type { AppContext } from "./context";
import { createDatabase } from "./db/client";
import { migrate } from "./db/migrate";
import type { ContactMail, Mailer } from "./services/mailer";

export interface TestHarness {
  app: Express;
  ctx: AppContext;
  sent: ContactMail[];
  close(): void;
}

/**
 * A throwaway in-memory database plus a mailer that records instead of sending.
 * Each test gets its own, so nothing leaks between cases.
 */
export async function createHarness(
  options: { mailer?: Partial<Mailer> } = {},
): Promise<TestHarness> {
  const { db, client } = createDatabase(":memory:");
  await migrate(client);

  const sent: ContactMail[] = [];
  const mailer: Mailer = {
    enabled: options.mailer?.enabled ?? true,
    send:
      options.mailer?.send ??
      (async (mail) => {
        sent.push(mail);
      }),
  };

  const ctx: AppContext = {
    db,
    client,
    mailer,
    startedAt: Date.now(),
    version: "test",
  };

  return {
    app: buildApp(ctx),
    ctx,
    sent,
    close: () => client.close(),
  };
}

/** A submission that passes every guard, so tests only vary what they care about. */
export function validContact(overrides: Record<string, unknown> = {}) {
  return {
    name: "Ada Lovelace",
    email: "ada@example.com",
    subject: "Collaboration on analytical engines",
    message: "I would like to talk about a long-running research collaboration.",
    elapsedMs: 30_000,
    ...overrides,
  };
}

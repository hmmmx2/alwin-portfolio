import { tmpdir } from "node:os";
import { resolve } from "node:path";

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
  options: { mailer?: Partial<Mailer>; resumePath?: string } = {},
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
    // A path that cannot exist unless a test puts something there, so the
    // "no resume published" case is a property of the test rather than of
    // whatever the repository happens to contain today.
    resumePath: options.resumePath ?? resolve(tmpdir(), "portfolio-test-no-resume.pdf"),
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

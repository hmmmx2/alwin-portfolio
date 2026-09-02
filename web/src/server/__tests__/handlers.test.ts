import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabase, type Database } from "../db";
import { contactMessages, pageviews } from "../db/schema";
import { handleContact, handlePageview } from "../handlers";
import type { ContactMail, Mailer } from "../mailer";
import { migrate } from "../migrate";

/**
 * Ported from the Express suite when the API folded into Route Handlers.
 *
 * These call the handlers directly rather than going through `next start`, for
 * the same reason the old tests mounted `buildApp` instead of booting a server:
 * what is being tested is the validation, the honeypot, the fill-time floor and
 * the opt-out, none of which need HTTP.
 */

let db: Database;
let close: () => void;
let sent: ContactMail[];
let mailer: Mailer;

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://example.test/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const validContact = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "Analytical engine",
  message: "This message is comfortably longer than the twenty character floor.",
};

beforeEach(async () => {
  const created = createDatabase(":memory:");
  db = created.db;
  close = () => created.client.close();
  await migrate(created.client);

  sent = [];
  mailer = {
    enabled: true,
    send: async (mail) => {
      sent.push(mail);
    },
  };
});

afterEach(() => close());

describe("contact", () => {
  it("stores the message and reports delivery", async () => {
    const res = await handleContact(post(validContact), { db, mailer });
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({ ok: true, delivered: true });

    const rows = await db.select().from(contactMessages);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ email: "ada@example.com", delivered: true });
    expect(sent).toHaveLength(1);
  });

  it("keeps the message when the mailer throws", async () => {
    const failing: Mailer = {
      enabled: true,
      send: async () => {
        throw new Error("smtp is down");
      },
    };

    const res = await handleContact(post(validContact), { db, mailer: failing });
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({ delivered: false });

    // The point of persisting before sending: a dead SMTP server must not cost
    // the message.
    const rows = await db.select().from(contactMessages);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.deliveryError).toContain("smtp is down");
  });

  it("rejects invalid input with per-field messages", async () => {
    const res = await handleContact(
      post({ name: "A", email: "nope", subject: "x", message: "short" }),
      { db, mailer },
    );
    expect(res.status).toBe(422);
    const body = (await res.json()) as { details: { path: string }[] };
    expect(body.details.map((d) => d.path).sort()).toEqual([
      "email",
      "message",
      "name",
      "subject",
    ]);
    expect(await db.select().from(contactMessages)).toHaveLength(0);
  });

  it("silently discards a honeypot submission", async () => {
    const res = await handleContact(post({ ...validContact, company: "Acme" }), { db, mailer });

    // 202 rather than an error, so a bot has nothing to tune against.
    expect(res.status).toBe(202);
    expect(await db.select().from(contactMessages)).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });

  it("rejects a submission filled in faster than a human could", async () => {
    const res = await handleContact(post({ ...validContact, elapsedMs: 200 }), { db, mailer });
    expect(res.status).toBe(422);
    expect(await db.select().from(contactMessages)).toHaveLength(0);
  });

  it("refuses a sixth message within the hour", async () => {
    for (let i = 0; i < 5; i += 1) {
      const ok = await handleContact(post(validContact), { db, mailer });
      expect(ok.status).toBe(201);
    }

    // The limiter counts in the database, not in memory -- on serverless a
    // process-local counter would reset on every cold start.
    const refused = await handleContact(post(validContact), { db, mailer });
    expect(refused.status).toBe(429);
    expect(await db.select().from(contactMessages)).toHaveLength(5);
  });
});

describe("pageview", () => {
  it("records a pageview without storing an address", async () => {
    const request = new Request("https://example.test/api/analytics/pageview", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9" },
      body: JSON.stringify({ path: "/", referrer: "https://news.example.com/a?token=secret" }),
    });

    const res = await handlePageview(request, { db });
    expect(res.status).toBe(201);

    const rows = await db.select().from(pageviews);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.visitorHash).not.toContain("203.0.113.9");
    // Host only: a full referrer can carry a token in its query string.
    expect(rows[0]?.referrerHost).toBe("news.example.com");
  });

  it("writes nothing when the client sends DNT", async () => {
    const request = new Request("https://example.test/api/analytics/pageview", {
      method: "POST",
      headers: { "content-type": "application/json", dnt: "1" },
      body: JSON.stringify({ path: "/" }),
    });

    const res = await handlePageview(request, { db });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ recorded: false });
    expect(await db.select().from(pageviews)).toHaveLength(0);
  });
});

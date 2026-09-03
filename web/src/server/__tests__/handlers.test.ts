import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabase, type Database } from "../db";
import { contactMessages, pageviews } from "../db/schema";
import { handleContact, handlePageview } from "../handlers";
import type { ContactMail, Mailer } from "../mailer";
import { migrate } from "../migrate";
import type { Verifier } from "../turnstile";

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
let verifier: Verifier;
let deps: { db: Database; mailer: Mailer; verifier: Verifier };

/** Verification that always passes, so the other cases test one thing each. */
const passing: Verifier = { verify: async () => true };
const failing: Verifier = { verify: async () => false };

const ORIGIN = "https://example.test";

/**
 * Browsers send `Origin` on every POST, so the default here mirrors a real
 * submission; the cross-origin case passes its own.
 */
function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`${ORIGIN}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, ...headers },
    body: JSON.stringify(body),
  });
}

const validContact = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "Analytical engine",
  message: "This message is comfortably longer than the twenty character floor.",
  // Both are required by ContactRequestSchema. Each used to be omissible, and
  // each omission was a way past a check.
  turnstileToken: "token-from-the-widget",
  elapsedMs: 8000,
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
  verifier = passing;
  deps = { db, mailer, verifier };
});

afterEach(() => close());

describe("contact", () => {
  it("stores the message and reports delivery", async () => {
    const res = await handleContact(post(validContact), deps);
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({ ok: true, delivered: true });

    const rows = await db.select().from(contactMessages);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ email: "ada@example.com", delivered: true });
    expect(sent).toHaveLength(1);
  });

  it("keeps the message when the mailer throws", async () => {
    const deadMailer: Mailer = {
      enabled: true,
      send: async () => {
        throw new Error("smtp is down");
      },
    };

    const res = await handleContact(post(validContact), { ...deps, mailer: deadMailer });
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
      deps,
    );
    expect(res.status).toBe(422);
    const body = (await res.json()) as { details: { path: string }[] };
    expect(body.details.map((d) => d.path).sort()).toEqual([
      // elapsedMs and turnstileToken are required now, and this body has
      // neither -- the two omissions that used to slip past the checks.
      "elapsedMs",
      "email",
      "message",
      "name",
      "subject",
      "turnstileToken",
    ]);
    expect(await db.select().from(contactMessages)).toHaveLength(0);
  });

  it("silently discards a honeypot submission", async () => {
    const res = await handleContact(post({ ...validContact, company: "Acme" }), deps);

    // 202 rather than an error, so a bot has nothing to tune against.
    expect(res.status).toBe(202);
    expect(await db.select().from(contactMessages)).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });

  it("rejects a submission filled in faster than a human could", async () => {
    const res = await handleContact(post({ ...validContact, elapsedMs: 200 }), deps);
    expect(res.status).toBe(422);
    expect(await db.select().from(contactMessages)).toHaveLength(0);
  });

  it("refuses a submission with no verification token", async () => {
    const { turnstileToken: _omitted, ...noToken } = validContact;
    const res = await handleContact(post(noToken), deps);

    expect(res.status).toBe(422);
    const body = (await res.json()) as { details: { path: string }[] };
    expect(body.details.map((d) => d.path)).toContain("turnstileToken");
    expect(await db.select().from(contactMessages)).toHaveLength(0);
  });

  it("refuses a submission Cloudflare will not vouch for", async () => {
    const res = await handleContact(post(validContact), { ...deps, verifier: failing });

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({ error: "verification_failed" });
    expect(await db.select().from(contactMessages)).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });

  it("fails closed, not 500, when verification is unreachable", async () => {
    const unreachable: Verifier = {
      verify: async () => {
        throw new Error("getaddrinfo ENOTFOUND challenges.cloudflare.com");
      },
    };

    // The real verifier catches its own network errors and returns false. This
    // asserts the handler survives one that does not: a thrown verifier must
    // not turn into a 500 that tells a bot the check is broken.
    const res = await handleContact(post(validContact), { ...deps, verifier: unreachable });

    expect(res.status).toBe(422);
    expect(await db.select().from(contactMessages)).toHaveLength(0);
  });

  it("refuses a submission with no elapsedMs at all", async () => {
    // The bypass this closes: the timing floor was guarded by
    // `typeof … === "number"`, so omitting the field skipped it entirely.
    const { elapsedMs: _omitted, ...noTiming } = validContact;
    const res = await handleContact(post(noTiming), deps);

    expect(res.status).toBe(422);
    expect(await db.select().from(contactMessages)).toHaveLength(0);
  });

  it("refuses a post from another origin, and one with none", async () => {
    const foreign = await handleContact(
      post(validContact, { origin: "https://evil.example" }),
      deps,
    );
    expect(foreign.status).toBe(403);

    const bare = new Request(`${ORIGIN}/api/contact`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validContact),
    });
    expect((await handleContact(bare, deps)).status).toBe(403);

    expect(await db.select().from(contactMessages)).toHaveLength(0);
  });

  it("counts the rate limit per address, not per user-agent", async () => {
    // The bypass this closes: the limiter keyed on visitorHash, which mixes the
    // user-agent in, so rotating it gave a bot a fresh budget every request.
    for (let i = 0; i < 5; i += 1) {
      const ok = await handleContact(
        post(validContact, { "x-forwarded-for": "203.0.113.7", "user-agent": `agent-${i}` }),
        deps,
      );
      expect(ok.status).toBe(201);
    }

    const refused = await handleContact(
      post(validContact, { "x-forwarded-for": "203.0.113.7", "user-agent": "agent-different" }),
      deps,
    );
    expect(refused.status).toBe(429);
  });

  it("keys the limit on the Cloudflare client address, not the proxy's", async () => {
    /*
     * The regression this guards: once alwint.dev is proxied through
     * Cloudflare, x-forwarded-for can carry a Cloudflare edge address. If that
     * were the limiter key, every visitor on earth would share one bucket and
     * the sixth message sent from anywhere would be refused.
     *
     * Same edge address on every request, five different real visitors behind
     * it -- all five must get through.
     */
    const EDGE = "172.71.0.1";

    /*
     * Six, not five. The budget is five per hour, so five requests sharing one
     * bucket would all still be accepted and the test would pass against the
     * very bug it exists to catch. The sixth distinct visitor is the only
     * request that tells the two behaviours apart.
     */
    for (let i = 0; i < 6; i += 1) {
      const res = await handleContact(
        post(validContact, {
          "cf-connecting-ip": `198.51.100.${i}`,
          "x-forwarded-for": EDGE,
        }),
        deps,
      );
      expect(res.status).toBe(201);
    }

    // One of those visitors sending repeatedly is still cut off, so the
    // limiter has not simply been switched off for everyone.
    let last = 201;
    for (let i = 0; i < 6; i += 1) {
      const res = await handleContact(
        post(validContact, { "cf-connecting-ip": "198.51.100.0", "x-forwarded-for": EDGE }),
        deps,
      );
      last = res.status;
    }
    expect(last).toBe(429);
  });

  it("refuses a sixth message within the hour", async () => {
    for (let i = 0; i < 5; i += 1) {
      const ok = await handleContact(post(validContact), deps);
      expect(ok.status).toBe(201);
    }

    // The limiter counts in the database, not in memory -- on serverless a
    // process-local counter would reset on every cold start.
    const refused = await handleContact(post(validContact), deps);
    expect(refused.status).toBe(429);
    expect(await db.select().from(contactMessages)).toHaveLength(5);
  });
});

describe("pageview", () => {
  it("records a pageview without storing an address", async () => {
    const request = new Request(`${ORIGIN}/api/analytics/pageview`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: ORIGIN,
        "x-forwarded-for": "203.0.113.9",
      },
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

  it("tells two visitors behind one Cloudflare edge apart", async () => {
    const pv = (cfIp: string) =>
      new Request(`${ORIGIN}/api/analytics/pageview`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: ORIGIN,
          "cf-connecting-ip": cfIp,
          "x-forwarded-for": "172.71.0.1",
        },
        body: JSON.stringify({ path: "/" }),
      });

    await handlePageview(pv("198.51.100.1"), { db });
    await handlePageview(pv("198.51.100.2"), { db });

    const rows = await db.select().from(pageviews);
    expect(rows).toHaveLength(2);
    // Two people, two hashes -- not one shared edge identity.
    expect(new Set(rows.map((r) => r.visitorHash)).size).toBe(2);
    for (const row of rows) expect(row.visitorHash).not.toContain("198.51.100");
  });

  it("writes nothing when the client sends DNT", async () => {
    const request = new Request(`${ORIGIN}/api/analytics/pageview`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN, dnt: "1" },
      body: JSON.stringify({ path: "/" }),
    });

    const res = await handlePageview(request, { db });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ recorded: false });
    expect(await db.select().from(pageviews)).toHaveLength(0);
  });
});

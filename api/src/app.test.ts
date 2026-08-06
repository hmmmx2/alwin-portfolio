import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";

import { ContentPayloadSchema } from "@portfolio/shared";

import { contactMessages, pageviews } from "./db/schema";
import { createHarness, validContact, type TestHarness } from "./test-utils";

let harness: TestHarness;

afterEach(() => {
  harness?.close();
});

describe("GET /api/health", () => {
  it("reports the database as up", async () => {
    harness = await createHarness();
    const res = await request(harness.app).get("/api/health").expect(200);
    expect(res.body).toMatchObject({ ok: true, database: "up", version: "test" });
  });
});

describe("GET /api/content", () => {
  it("returns a payload matching the shared schema", async () => {
    harness = await createHarness();
    const res = await request(harness.app).get("/api/content").expect(200);
    // If a content file drifts from the contract, this fails here rather than
    // as an unexplained blank section in the browser.
    expect(() => ContentPayloadSchema.parse(res.body)).not.toThrow();
  });

  it("serves a single section", async () => {
    harness = await createHarness();
    const res = await request(harness.app).get("/api/content/projects").expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("404s an unknown section", async () => {
    harness = await createHarness();
    const res = await request(harness.app).get("/api/content/salary").expect(404);
    expect(res.body.error.code).toBe("not_found");
  });
});

describe("POST /api/contact", () => {
  it("stores the message and reports delivery", async () => {
    harness = await createHarness();

    const res = await request(harness.app)
      .post("/api/contact")
      .send(validContact())
      .expect(201);

    expect(res.body).toMatchObject({ ok: true, delivered: true });
    expect(harness.sent).toHaveLength(1);

    const rows = await harness.ctx.db.select().from(contactMessages);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ email: "ada@example.com", delivered: true });
  });

  it("keeps the message when the mailer throws", async () => {
    harness = await createHarness({
      mailer: {
        enabled: true,
        send: async () => {
          throw new Error("smtp unreachable");
        },
      },
    });

    const res = await request(harness.app)
      .post("/api/contact")
      .send(validContact())
      .expect(201);

    // The visitor is told it was received; the row records that it wasn't sent.
    expect(res.body.delivered).toBe(false);

    const rows = await harness.ctx.db.select().from(contactMessages);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.delivered).toBe(false);
    expect(rows[0]?.deliveryError).toContain("smtp unreachable");
  });

  it("rejects invalid input with per-field messages", async () => {
    harness = await createHarness();

    const res = await request(harness.app)
      .post("/api/contact")
      .send(validContact({ email: "not-an-email", message: "too short" }))
      .expect(422);

    expect(res.body.error.code).toBe("unprocessable_entity");
    expect(res.body.error.fields).toHaveProperty("email");
    expect(res.body.error.fields).toHaveProperty("message");
    expect(await harness.ctx.db.select().from(contactMessages)).toHaveLength(0);
  });

  it("silently discards a honeypot submission", async () => {
    harness = await createHarness();

    const res = await request(harness.app)
      .post("/api/contact")
      .send(validContact({ company: "Acme Corp" }))
      .expect(202);

    // Looks like success to the bot, but nothing is stored and nothing is sent.
    expect(res.body).toMatchObject({ ok: true, delivered: false });
    expect(harness.sent).toHaveLength(0);
    expect(await harness.ctx.db.select().from(contactMessages)).toHaveLength(0);
  });

  it("rejects a submission filled in faster than a human could", async () => {
    harness = await createHarness();

    await request(harness.app)
      .post("/api/contact")
      .send(validContact({ elapsedMs: 200 }))
      .expect(422);

    expect(await harness.ctx.db.select().from(contactMessages)).toHaveLength(0);
  });
});

describe("resume", () => {
  it("reports unavailable and 404s when no PDF is published", async () => {
    harness = await createHarness();

    const meta = await request(harness.app).get("/api/resume/meta").expect(200);
    expect(meta.body).toEqual({
      available: false,
      filename: null,
      bytes: null,
      updatedAt: null,
    });

    await request(harness.app).get("/api/resume").expect(404);
  });
});

describe("POST /api/analytics/pageview", () => {
  it("records a pageview without storing an address", async () => {
    harness = await createHarness();

    await request(harness.app)
      .post("/api/analytics/pageview")
      .send({ path: "/", referrer: "https://news.example.com/some/article?utm=x" })
      .expect(201);

    const rows = await harness.ctx.db.select().from(pageviews);
    expect(rows).toHaveLength(1);
    // Host only — the path and query of the referrer are dropped.
    expect(rows[0]?.referrerHost).toBe("news.example.com");
    expect(rows[0]?.visitorHash).toMatch(/^[0-9a-f]{32}$/);
  });

  it("writes nothing when the client sends DNT", async () => {
    harness = await createHarness();

    const res = await request(harness.app)
      .post("/api/analytics/pageview")
      .set("DNT", "1")
      .send({ path: "/" })
      .expect(200);

    expect(res.body).toEqual({ ok: true, recorded: false });
    expect(await harness.ctx.db.select().from(pageviews)).toHaveLength(0);
  });
});

describe("unknown routes", () => {
  it("404s with a structured body carrying the request id", async () => {
    harness = await createHarness();
    const res = await request(harness.app).get("/api/nope").expect(404);
    expect(res.body.error.code).toBe("not_found");
    expect(res.body.error.requestId).toEqual(expect.any(String));
    expect(res.headers["x-request-id"]).toEqual(res.body.error.requestId);
  });
});

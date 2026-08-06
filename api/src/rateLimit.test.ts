// The limiters are module singletons, so their counters are shared by every
// test in a file. Vitest isolates modules per file, which is why this lives
// apart from app.test.ts — enabling limits here cannot leak into those cases.
process.env.RATE_LIMIT_IN_TESTS = "true";

import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";

import { createHarness, validContact, type TestHarness } from "./test-utils";

let harness: TestHarness;

afterEach(() => {
  harness?.close();
});

describe("contact rate limiting", () => {
  it("rejects the sixth submission within the window", async () => {
    harness = await createHarness();

    for (let i = 0; i < 5; i += 1) {
      await request(harness.app)
        .post("/api/contact")
        .send(validContact({ subject: `Message ${i}` }))
        .expect(201);
    }

    const res = await request(harness.app)
      .post("/api/contact")
      .send(validContact({ subject: "One too many" }))
      .expect(429);

    expect(res.body.error.code).toBe("rate_limited");
  });
});

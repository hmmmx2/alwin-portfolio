import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `.env.example` ships every optional value as `KEY=`, so these are the exact
 * shapes a first-time setup produces -- not hypotheticals.
 */
describe("env", () => {
  const original = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...original, NODE_ENV: "test", ANALYTICS_SALT: "test-salt-long-enough" };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = original;
  });

  it("treats an empty optional value as absent rather than invalid", async () => {
    // Straight from .env.example. This used to throw "String must contain at
    // least 1 character(s)" and 500 every API request.
    process.env.TURSO_AUTH_TOKEN = "";
    process.env.MAIL_HOST = "";
    process.env.MAIL_PORT = "";
    process.env.MAIL_USER = "";

    const { env } = await import("../env");
    expect(() => env()).not.toThrow();
    expect(env().TURSO_AUTH_TOKEN).toBeUndefined();
    expect(env().MAIL_HOST).toBeUndefined();
    expect(env().MAIL_PORT).toBeUndefined();
  });

  it("keeps a real value", async () => {
    process.env.TURSO_AUTH_TOKEN = "a-real-token";
    process.env.MAIL_PORT = "587";

    const { env } = await import("../env");
    expect(env().TURSO_AUTH_TOKEN).toBe("a-real-token");
    expect(env().MAIL_PORT).toBe(587);
  });

  it("refuses to start production on the example salt", async () => {
    // NODE_ENV is typed readonly; the guard reads it at runtime.
    vi.stubEnv("NODE_ENV", "production");
    process.env.ANALYTICS_SALT = "portfolio-dev-salt";

    const { env } = await import("../env");
    expect(() => env()).toThrow(/ANALYTICS_SALT is still the example value/);
  });
})

import rateLimit, { type Options } from "express-rate-limit";
import type { Request } from "express";

import { isTest } from "../env";
import { AppError } from "../lib/errors";
import { visitorHash } from "../lib/privacy";

/**
 * All limiters key off the daily salted visitor hash rather than the raw IP,
 * so the limiter's own store never holds an address either.
 */
function limiter(options: Pick<Options, "windowMs" | "limit"> & { message: string }) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req: Request) => visitorHash(req),
    // Tests assert on the limiter explicitly; leaving it live everywhere else
    // would make every other test flaky as counters carry across cases.
    skip: () => isTest && process.env.RATE_LIMIT_IN_TESTS !== "true",
    handler: (_req, _res, next) => {
      next(AppError.tooManyRequests(options.message));
    },
  });
}

export const globalLimiter = limiter({
  windowMs: 15 * 60_000,
  limit: 300,
  message: "Too many requests. Try again in a few minutes.",
});

export const contactLimiter = limiter({
  windowMs: 60 * 60_000,
  limit: 5,
  message: "You've sent several messages already. Try again in an hour.",
});

export const analyticsLimiter = limiter({
  windowMs: 60_000,
  limit: 60,
  message: "Too many requests.",
});

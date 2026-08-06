import { createHash } from "node:crypto";
import type { Request } from "express";

import { env } from "../env";

/**
 * Raw IP addresses are never stored or logged.
 *
 * Rate limiting and pageview de-duplication both need a stable-per-day visitor
 * key, so they use a salted hash that rotates at midnight UTC: enough to stop
 * one client flooding the contact form, not enough to track anyone across days.
 */
export function visitorHash(req: Request): string {
  const day = new Date().toISOString().slice(0, 10);
  const ip = req.ip ?? "unknown";
  const ua = req.get("user-agent") ?? "";
  return createHash("sha256")
    .update(`${env.ANALYTICS_SALT}:${day}:${ip}:${ua}`)
    .digest("hex")
    .slice(0, 32);
}

/** True when the client asked not to be measured. */
export function optedOut(req: Request): boolean {
  return req.get("dnt") === "1" || req.get("sec-gpc") === "1";
}

/**
 * Reduce a referrer to its host. A full referring URL can carry query strings
 * with personal data in them, and the host is all the analytics needs.
 */
export function referrerHost(referrer: string | undefined): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).host || null;
  } catch {
    return null;
  }
}

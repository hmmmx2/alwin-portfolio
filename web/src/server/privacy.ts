import { createHash } from "node:crypto";

import { env } from "./env";

/**
 * Raw IP addresses are never stored or logged.
 *
 * Rate limiting and pageview de-duplication both need a stable-per-day visitor
 * key, so they use a salted hash that rotates at midnight UTC: enough to stop
 * one client flooding the contact form, not enough to track anyone across days.
 *
 * Ported from the Express API unchanged in substance -- it now reads `Headers`
 * instead of a `Request`, and takes the client address from Vercel's forwarding
 * headers rather than `req.ip`.
 */
export function clientAddress(headers: Headers): string {
  // Vercel sets both; the first entry of x-forwarded-for is the real client.
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

export function visitorHash(headers: Headers): string {
  const day = new Date().toISOString().slice(0, 10);
  const ip = clientAddress(headers);
  const ua = headers.get("user-agent") ?? "";
  return createHash("sha256")
    .update(`${env().ANALYTICS_SALT}:${day}:${ip}:${ua}`)
    .digest("hex")
    .slice(0, 32);
}

/** True when the client asked not to be measured. */
export function optedOut(headers: Headers): boolean {
  return headers.get("dnt") === "1" || headers.get("sec-gpc") === "1";
}

/**
 * Reduce a referrer to its host. A full referring URL can carry query strings
 * with personal data in them, and the host is all the analytics needs.
 */
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).host || null;
  } catch {
    return null;
  }
}

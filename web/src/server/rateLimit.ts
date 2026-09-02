import { sql } from "drizzle-orm";

import type { Database } from "./db";
import { rateLimits } from "./db/schema";

/**
 * A fixed-window limiter backed by the database.
 *
 * The Express version counted in process memory, which is meaningless on
 * serverless: each cold start would begin at zero and the limit would never be
 * reached. Keyed on the daily visitor hash rather than an address, so the
 * limiter's own table holds no more personal data than the rest of the schema.
 *
 * Fixed window rather than sliding: at these budgets the worst case is a
 * visitor sending 2x the limit across a window boundary, which for a contact
 * form is not worth a second table and a range scan.
 */
export interface Budget {
  bucket: string;
  windowMs: number;
  limit: number;
}

export const CONTACT: Budget = { bucket: "contact", windowMs: 60 * 60_000, limit: 5 };
export const ANALYTICS: Budget = { bucket: "pageview", windowMs: 60 * 60_000, limit: 60 };

/** True when the caller is within budget; false when it should be refused. */
export async function withinBudget(
  db: Database,
  budget: Budget,
  visitor: string,
): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - (now % budget.windowMs);
  const key = `${budget.bucket}:${visitor}:${windowStart}`;

  // One statement, so two concurrent requests cannot both read 4 and write 5.
  const rows = await db
    .insert(rateLimits)
    .values({ key, count: 1, windowStart })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  const count = rows[0]?.count ?? 1;

  // Opportunistic pruning: expired windows are dead weight, and this avoids
  // needing a scheduled job on a site with no scheduler.
  if (count === 1) {
    await db
      .delete(rateLimits)
      .where(sql`${rateLimits.windowStart} < ${windowStart - budget.windowMs}`);
  }

  return count <= budget.limit;
}

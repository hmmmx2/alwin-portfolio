import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Three small tables. Note what is *not* here: no IP addresses, no user agents,
 * no full referrer URLs. See lib/privacy.ts.
 */

export const contactMessages = sqliteTable(
  "contact_messages",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    /** Whether the mailer accepted it. A false here means "stored, not sent". */
    delivered: integer("delivered", { mode: "boolean" }).notNull().default(false),
    deliveryError: text("delivery_error"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("contact_messages_created_at_idx").on(table.createdAt)],
);

export const pageviews = sqliteTable(
  "pageviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    path: text("path").notNull(),
    /** Host only, never a full URL. */
    referrerHost: text("referrer_host"),
    visitorHash: text("visitor_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("pageviews_created_at_idx").on(table.createdAt),
    index("pageviews_path_idx").on(table.path),
  ],
);

export type ContactMessageRow = typeof contactMessages.$inferSelect;
export type PageviewRow = typeof pageviews.$inferSelect;

/**
 * Fixed-window rate limiter state.
 *
 * express-rate-limit kept its counters in process memory, which on serverless
 * means every cold start begins at zero -- it would have looked like it was
 * working while enforcing nothing. Keyed on the daily visitor hash, so this
 * table never holds an address either.
 */
export const rateLimits = sqliteTable("rate_limits", {
  /** `${bucket}:${visitorHash}:${windowStart}` */
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  /** Unix ms of the window's start, for pruning. */
  windowStart: integer("window_start").notNull(),
});

export type RateLimitRow = typeof rateLimits.$inferSelect;

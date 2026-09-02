import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import {
  ContactInputSchema,
  PageviewInputSchema,
  type ContactResponse,
  type PageviewResponse,
} from "@portfolio/shared";

import type { Database } from "./db";
import { contactMessages, pageviews } from "./db/schema";
import { env } from "./env";
import type { Mailer } from "./mailer";
import { optedOut, referrerHost, visitorHash } from "./privacy";
import { ANALYTICS, CONTACT, withinBudget } from "./rateLimit";

/**
 * The handlers, separated from the Route Handler entry points so tests can call
 * them with an in-memory database and a recording mailer -- the same seam the
 * Express `AppContext` provided.
 */
export interface Deps {
  db: Database;
  mailer: Mailer;
}

const json = (body: unknown, status: number) =>
  Response.json(body, {
    status,
    // Nothing here is cacheable and some of it is a mutation.
    headers: { "Cache-Control": "no-store" },
  });

function invalid(issues: { path: PropertyKey[]; message: string }[]) {
  return json(
    {
      error: "validation_failed",
      message: "Some fields need attention.",
      details: issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    },
    422,
  );
}

export async function handleContact(request: Request, { db, mailer }: Deps): Promise<Response> {
  const visitor = visitorHash(request.headers);

  if (!(await withinBudget(db, CONTACT, visitor))) {
    return json(
      { error: "rate_limited", message: "You've sent several messages already. Try again in an hour." },
      429,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "bad_request", message: "Expected a JSON body." }, 400);
  }

  const parsed = ContactInputSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error.issues);
  const input = parsed.data;

  // Honeypot: a hidden field only an autofilling bot would populate. Answer 202
  // rather than an error, so the bot has nothing to tune against.
  if (input.company) {
    return json({ ok: true, id: "discarded", delivered: false } satisfies ContactResponse, 202);
  }

  // A human cannot read the form and type 20+ characters in under a couple of
  // seconds.
  if (typeof input.elapsedMs === "number" && input.elapsedMs < env().CONTACT_MIN_FILL_MS) {
    return json(
      { error: "unprocessable", message: "That was too quick — please try again." },
      422,
    );
  }

  const id = randomUUID();

  // Persist first. If the mailer is down the message still exists; the other
  // order loses it on an SMTP failure.
  await db.insert(contactMessages).values({
    id,
    name: input.name,
    email: input.email,
    subject: input.subject,
    message: input.message,
    delivered: false,
    createdAt: new Date(),
  });

  let delivered = false;
  let deliveryError: string | null = null;

  try {
    await mailer.send({
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
    });
    delivered = mailer.enabled;
  } catch (error) {
    deliveryError = error instanceof Error ? error.message : String(error);
    console.error("[contact] delivery failed", { id, error: deliveryError });
  }

  if (delivered || deliveryError) {
    await db
      .update(contactMessages)
      .set({ delivered, deliveryError })
      .where(eq(contactMessages.id, id));
  }

  return json({ ok: true, id, delivered } satisfies ContactResponse, 201);
}

export async function handlePageview(
  request: Request,
  { db }: Pick<Deps, "db">,
): Promise<Response> {
  // Honour Do-Not-Track / Global Privacy Control by writing nothing at all, and
  // say so in the response rather than pretending it was recorded.
  if (optedOut(request.headers)) {
    return json({ ok: true, recorded: false } satisfies PageviewResponse, 200);
  }

  const visitor = visitorHash(request.headers);
  if (!(await withinBudget(db, ANALYTICS, visitor))) {
    return json({ error: "rate_limited", message: "Too many requests." }, 429);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "bad_request", message: "Expected a JSON body." }, 400);
  }

  const parsed = PageviewInputSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error.issues);

  await db.insert(pageviews).values({
    path: parsed.data.path,
    referrerHost: referrerHost(parsed.data.referrer ?? request.headers.get("referer")),
    visitorHash: visitor,
    createdAt: new Date(),
  });

  return json({ ok: true, recorded: true } satisfies PageviewResponse, 201);
}

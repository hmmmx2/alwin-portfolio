import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import {
  ContactRequestSchema,
  PageviewInputSchema,
  type ContactResponse,
  type PageviewResponse,
} from "@portfolio/shared";

import type { Database } from "./db";
import { contactMessages, pageviews } from "./db/schema";
import { env } from "./env";
import type { Mailer } from "./mailer";
import { clientAddress, limiterKey, optedOut, referrerHost, visitorHash } from "./privacy";
import { ANALYTICS, CONTACT, withinBudget } from "./rateLimit";
import type { Verifier } from "./turnstile";

/**
 * The handlers, separated from the Route Handler entry points so tests can call
 * them with an in-memory database and a recording mailer -- the same seam the
 * Express `AppContext` provided.
 */
export interface Deps {
  db: Database;
  mailer: Mailer;
  verifier: Verifier;
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

/**
 * Reject a POST that did not come from a page on this site.
 *
 * Browsers always send `Origin` on a cross-origin POST and on same-origin ones
 * too, so this costs a real visitor nothing while turning away both a form
 * posted from someone else's page and a bare `curl` that sends no origin at all.
 *
 * Compared against the request's own origin rather than a configured URL, so
 * Vercel preview deployments -- which serve from a different hostname on every
 * push -- keep working; NEXT_PUBLIC_SITE_URL is accepted as well for the case
 * where a proxy rewrites the host.
 */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const allowed = new Set([new URL(request.url).origin]);
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try {
      allowed.add(new URL(configured).origin);
    } catch {
      // A malformed site URL should not take the contact form down.
    }
  }

  return allowed.has(origin);
}

const forbidden = () =>
  json({ error: "forbidden", message: "This request did not come from the site." }, 403);

export async function handleContact(
  request: Request,
  { db, mailer, verifier }: Deps,
): Promise<Response> {
  if (!sameOrigin(request)) return forbidden();

  if (!(await withinBudget(db, CONTACT, limiterKey(request.headers)))) {
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

  const parsed = ContactRequestSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error.issues);
  const input = parsed.data;

  // Honeypot: a hidden field only an autofilling bot would populate. Answer 202
  // rather than an error, so the bot has nothing to tune against.
  if (input.company) {
    return json({ ok: true, id: "discarded", delivered: false } satisfies ContactResponse, 202);
  }

  // A human cannot read the form and type 20+ characters in under a couple of
  // seconds. `elapsedMs` is required by the schema, so this can no longer be
  // skipped by leaving the field out.
  if (input.elapsedMs < env().CONTACT_MIN_FILL_MS) {
    return json(
      { error: "unprocessable", message: "That was too quick — please try again." },
      422,
    );
  }

  /*
   * Turnstile last among the checks, because it is the only one that costs a
   * network round trip: a honeypot hit or a malformed body must never spend a
   * siteverify call. The rate limiter stays first for the same reason.
   *
   * Fails closed, so the copy names the alternative -- the Gmail link beside
   * the form depends on none of this.
   */
  // clientAddress falls back to the literal "unknown"; Cloudflare wants a real
  // address or none at all.
  const address = clientAddress(request.headers);

  /*
   * Belt and braces around a throw. `createVerifier` catches its own network
   * errors, but `Verifier` is an interface and an exception escaping here would
   * become a 500 -- which both loses the message and tells a bot the check is
   * broken. Treat any failure to answer as a refusal.
   */
  let verified = false;
  try {
    verified = await verifier.verify(
      input.turnstileToken,
      address === "unknown" ? null : address,
    );
  } catch (error) {
    console.error("[contact] verification threw", error);
  }

  if (!verified) {
    return json(
      {
        error: "verification_failed",
        message: "Couldn't verify that request. Please retry, or email me directly.",
      },
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

  if (!sameOrigin(request)) return forbidden();

  const visitor = visitorHash(request.headers);
  if (!(await withinBudget(db, ANALYTICS, limiterKey(request.headers)))) {
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

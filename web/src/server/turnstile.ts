import { env } from "./env";

/**
 * Cloudflare Turnstile verification.
 *
 * This is the first control on the contact form that a script cannot simply
 * choose not to trigger. The honeypot is skipped by not filling a field, the
 * timing floor by sending a plausible number, the user-agent block by sending a
 * browser's string -- all of them are the absence of a mistake. A Turnstile
 * token has to be obtained from Cloudflare, is single-use, and expires after
 * about five minutes, so it also gives the endpoint the replay protection it
 * previously had none of.
 *
 * Behind an interface for the same reason `Mailer` is: the handler tests need a
 * seam that does not reach the network.
 */
export interface Verifier {
  /** True when Cloudflare vouches for the token. */
  verify(token: string, ip: string | null): Promise<boolean>;
}

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Cloudflare's always-passing test secret, and the default in `.env.example`.
 *
 * It makes development run the real code path against the real endpoint rather
 * than a "skip when unset" branch -- and a branch that only runs in production
 * is a branch first exercised in production. What it does *not* do is verify
 * anything: measured against the live endpoint, this secret returns success for
 * a forged token as readily as a real one. Local development therefore has no
 * bot protection, only the plumbing for it, and the site is only actually
 * defended once the real secret is set. `env()` refuses to boot on this value
 * when NODE_ENV is production, which is what keeps that from going unnoticed.
 */
export const TEST_SECRET = "1x0000000000000000000000000000000AA";

interface SiteverifyResponse {
  success?: boolean;
  "error-codes"?: string[];
}

export function createVerifier(): Verifier {
  return {
    async verify(token, ip) {
      const body = new URLSearchParams({
        secret: env().TURNSTILE_SECRET_KEY,
        response: token,
      });
      // Cloudflare uses this to catch a token minted for one client and
      // replayed from another. Omitted when we have no address rather than
      // sent as the literal "unknown", which would fail parsing at their end.
      if (ip) body.set("remoteip", ip);

      try {
        const res = await fetch(SITEVERIFY, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body,
          // Without a deadline a hung connection holds the serverless function
          // open until the platform kills it, and the visitor watches a
          // spinner for the whole time.
          signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) {
          console.error("[turnstile] siteverify returned", res.status);
          return false;
        }

        const data = (await res.json()) as SiteverifyResponse;
        if (data.success !== true) {
          console.error("[turnstile] rejected", data["error-codes"] ?? []);
          return false;
        }
        return true;
      } catch (error) {
        /*
         * Fail closed, by explicit decision: a message that cannot be verified
         * is not delivered. The cost is that a Cloudflare outage silences the
         * form, which is survivable only because the Gmail link beside it needs
         * none of this -- so the rejection copy has to point at that link, and
         * this line has to be loud enough to find in the Vercel logs.
         */
        console.error("[turnstile] verification unreachable", error);
        return false;
      }
    },
  };
}

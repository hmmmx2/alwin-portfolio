import { NextResponse, type NextRequest } from "next/server";

/**
 * The country allowlist.
 *
 * The CSP is deliberately *not* here. It was, carrying a per-request nonce,
 * until measuring the rendered HTML showed zero `nonce=` attributes: Next 16
 * under Turbopack does not propagate a nonce from the request header onto its
 * own script tags, so `strict-dynamic` blocked every chunk the app needs to
 * boot. A policy that breaks the site it protects is worse than a weaker one
 * that works, so the CSP is a static header in next.config.ts instead.
 */

/**
 * ISO-3166-1 alpha-2. Overridable through `ALLOWED_COUNTRIES` so a country can
 * be added by editing an environment variable rather than shipping a commit --
 * which matters, because the cost of this feature is turning people away.
 *
 * Worth being honest about what it is: an IP allowlist is a traffic filter, not
 * a security control. One VPN click defeats it, and it blocks genuine
 * recruiters everywhere outside this list.
 */
const DEFAULT_ALLOWED = ["US", "MY", "SG", "GB", "IE", "FR", "DE", "JP", "TW", "CA"];

const ALLOWED = new Set(
  (process.env.ALLOWED_COUNTRIES ?? DEFAULT_ALLOWED.join(","))
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean),
);

/**
 * Crawlers are admitted from anywhere.
 *
 * A blocked crawler means the site quietly leaves Google's index, and the
 * unfurlers are how a portfolio link actually gets opened in LinkedIn or Slack.
 * A user-agent is trivially spoofed, which is acceptable precisely because this
 * is not a security boundary -- forging a Googlebot header to read a public CV
 * achieves nothing a VPN would not.
 */
const CRAWLERS =
  /(googlebot|google-inspectiontool|bingbot|duckduckbot|applebot|yandexbot|baiduspider|slurp|linkedinbot|twitterbot|slackbot|facebookexternalhit|discordbot|whatsapp|telegrambot)/i;

/** Served regardless of country, or the block page renders unstyled. */
function alwaysAllowed(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/icon" ||
    pathname === "/apple-icon.png" ||
    pathname === "/favicon.ico"
  );
}

function blocked(country: string): NextResponse {
  // A real page, not a bare error: someone hitting this is far more likely to
  // be a recruiter abroad than an attacker.
  const body = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Not available in your region</title>
<style>
  :root { color-scheme: dark }
  body { margin:0; min-height:100vh; display:grid; place-items:center;
         background:#050506; color:#f4f5f6; padding:24px;
         font:400 15px/1.6 ui-sans-serif,system-ui,-apple-system,sans-serif }
  main { max-width:46ch; text-align:center }
  h1 { font-size:20px; font-weight:600; letter-spacing:-.02em; margin:0 0 12px }
  p { margin:0 0 10px; color:rgb(244 245 246/.62) }
  a { color:#f4f5f6 }
  code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12px;
         color:rgb(244 245 246/.4) }
</style></head>
<body><main>
  <h1>Not available in your region</h1>
  <p>This site is currently limited to a small number of countries. If you were
     looking for my work, email me and I'll send everything directly.</p>
  <p><a href="mailto:alwin.tayjx.work@gmail.com">alwin.tayjx.work@gmail.com</a></p>
  <p><code>${country}</code></p>
</main></body></html>`;

  return new NextResponse(body, {
    status: 403,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

export function middleware(request: NextRequest): NextResponse {
  if (alwaysAllowed(request.nextUrl.pathname)) return NextResponse.next();

  /*
   * Vercel's geolocation header. `NextRequest.geo` was removed in Next 15.
   *
   * Absent means allow: there is no such header in `next dev` or a self-hosted
   * container, and failing closed would make the site look broken on the
   * machine it is developed on.
   */
  const country = request.headers.get("x-vercel-ip-country");
  const agent = request.headers.get("user-agent") ?? "";

  if (country && !ALLOWED.has(country) && !CRAWLERS.test(agent)) {
    return blocked(country);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Everything except Next's static output and the image optimiser: those are
   * high-volume, carry no country-specific content, and running middleware on
   * them would multiply invocations for nothing.
   */
  matcher: ["/((?!_next/static|_next/image).*)"],
};

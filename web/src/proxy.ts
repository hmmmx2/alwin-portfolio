import { NextResponse, type NextRequest } from "next/server";

/**
 * The country allowlist, plus the bot and scanner filter.
 *
 * `src/proxy.ts`, not `src/middleware.ts`: Next 16 renamed the convention and
 * warns on the old filename. Same execution model -- it runs on the edge,
 * before every matched request.
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
const DEFAULT_ALLOWED = [
  "US", "MY", "SG", "GB", "IE", "FR", "DE", "JP",
  "TW", "CA", "AU", "NL", "CH", "NZ",
];

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

/**
 * Bots that are refused everywhere, regardless of country.
 *
 * Three groups, and the reason differs for each:
 *
 *   - **Vulnerability scanners.** These are probing for an admin panel or a
 *     leaked `.env`. There is nothing here for them, but refusing early keeps
 *     them out of the logs and off the function budget.
 *   - **SEO and contact scrapers.** Ahrefs, Semrush, ZoomInfo and friends crawl
 *     hard, obey nothing useful, and exist to resell what they find. A CV page
 *     is exactly the sort of thing ZoomInfo sells.
 *   - **AI training crawlers.** A judgement call rather than a security one:
 *     the CV and the photograph are not offered for model training. robots.txt
 *     asks; this enforces, since several of these ignore the file.
 *
 * Not here on purpose: Googlebot, Bingbot and the social unfurlers. Blocking
 * those would deindex the site and break every LinkedIn preview, which is most
 * of the point of having it.
 */
const BLOCKED_AGENTS =
  /(sqlmap|nikto|nmap|masscan|zgrab|nuclei|wpscan|dirbuster|gobuster|acunetix|nessus|havij|arachni|censys|internetmeasurement|expanse|paloaltonetworks)|(ahrefsbot|semrushbot|mj12bot|dotbot|blexbot|seokicks|serpstatbot|dataforseobot|zoominfobot|megaindex|rogerbot|screaming ?frog)|(gptbot|oai-searchbot|chatgpt-user|ccbot|anthropic-ai|claude-web|cohere-ai|bytespider|petalbot|amazonbot|diffbot|omgili|imagesiftbot|timpibot|webzio)/i;

/**
 * Paths nothing on this site has ever served. Every request for one is a
 * scanner sweeping for a WordPress install or a committed secret.
 *
 * Answered with 404 rather than 403: a 403 confirms something is there to be
 * forbidden, and there is no reason to tell a scanner anything.
 */
const SCANNER_PATHS =
  /^\/(wp-admin|wp-login|wp-content|wp-includes|xmlrpc\.php|phpmyadmin|administrator|\.env|\.git|\.aws|\.ssh|config\.(json|php|yml)|vendor\/|cgi-bin|autodiscover|owa\/|actuator|telescope|\.well-known\/traffic-advice)/i;

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

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const agent = request.headers.get("user-agent") ?? "";

  // Scanners and hostile crawlers are refused before anything else, so they
  // never reach the geo check or a route handler.
  if (SCANNER_PATHS.test(pathname)) {
    return new NextResponse(null, { status: 404, headers: { "cache-control": "no-store" } });
  }

  if (BLOCKED_AGENTS.test(agent)) {
    return new NextResponse(null, { status: 403, headers: { "cache-control": "no-store" } });
  }

  /*
   * An empty user-agent on a page request is not a browser. Restricted to
   * document requests: `fetch` from the site's own client code sends
   * `sec-fetch-mode: cors` and a real agent, and some corporate proxies strip
   * the header on subresources.
   */
  if (!agent && request.headers.get("sec-fetch-dest") === "document") {
    return new NextResponse(null, { status: 403, headers: { "cache-control": "no-store" } });
  }

  if (alwaysAllowed(pathname)) return NextResponse.next();

  /*
   * Vercel's geolocation header. `NextRequest.geo` was removed in Next 15.
   *
   * Absent means allow: there is no such header in `next dev` or a self-hosted
   * container, and failing closed would make the site look broken on the
   * machine it is developed on.
   */
  const country = request.headers.get("x-vercel-ip-country");

  if (country && !ALLOWED.has(country) && !CRAWLERS.test(agent)) {
    return blocked(country);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Everything except Next's static output and the image optimiser: those are
   * high-volume, carry no country-specific content, and running this on
   * them would multiply invocations for nothing.
   */
  matcher: ["/((?!_next/static|_next/image).*)"],
};

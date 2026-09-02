import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100";

/**
 * robots.txt asks; `middleware.ts` enforces.
 *
 * Both exist because several of the crawlers named here have been observed
 * ignoring the file entirely. Stating it anyway matters: it is the difference
 * between "they took it" and "they took it after being told not to", and the
 * well-behaved ones do honour it.
 *
 * Search engines and the social unfurlers are deliberately not listed --
 * blocking those would deindex the site and break link previews, which is most
 * of the point of publishing it.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "CCBot",
  "anthropic-ai",
  "Claude-Web",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "cohere-ai",
  "Bytespider",
  "PetalBot",
  "Amazonbot",
  "Diffbot",
  "omgili",
  "ImagesiftBot",
  "Timpibot",
];

const SCRAPERS = [
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "BLEXBot",
  "DataForSeoBot",
  "ZoominfoBot",
  "SerpstatBot",
  "MegaIndex",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      // The CV and the photograph are not offered for model training, and the
      // contact scrapers exist to resell exactly this kind of page.
      { userAgent: [...AI_CRAWLERS, ...SCRAPERS], disallow: "/" },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

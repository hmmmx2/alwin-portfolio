import path from "node:path";

import type { NextConfig } from "next";

/**
 * The portfolio workspace root — one level up from this package.
 *
 * It has to be stated explicitly. This app lives inside a much larger
 * repository, and left to itself Next walks up looking for a lockfile and
 * picks the outer project's root, which pulls unrelated files into the build
 * graph. Pointing both Turbopack and output tracing here keeps the build
 * scoped to `portfolio/` while still resolving `next` and `@portfolio/shared`
 * from the workspace's node_modules.
 */
const workspaceRoot = path.resolve(process.cwd(), "..");

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /*
   * Emits `.next/standalone` — a server plus only the node_modules it actually
   * traced — so the Docker runtime stage needs no package manager and no
   * install step. Combined with `outputFileTracingRoot` below, the workspace
   * link to @portfolio/shared is traced correctly rather than left dangling.
   */
  output: "standalone",
  // @portfolio/shared ships TypeScript source rather than a build artifact, so
  // Next has to compile it like first-party code.
  transpilePackages: ["@portfolio/shared"],
  turbopack: { root: workspaceRoot },
  outputFileTracingRoot: workspaceRoot,
  /*
   * Static headers only. The CSP is not here -- it carries a per-request nonce
   * and so has to come from middleware.ts.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Two years with preload, which is what hstspreload.org requires.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // SAMEORIGIN rather than DENY, matching frame-ancestors 'self':
          // DENY would block the resume preview embedding /resume.pdf from
          // this very origin. Browsers that support CSP ignore this anyway.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          /*
           * Static, and without a nonce.
           *
           * A nonce-based policy with 'strict-dynamic' was tried first and
           * measured: Next 16 under Turbopack emits no `nonce=` attribute on
           * its script tags, so every chunk the app needs was blocked. The
           * honest trade is 'unsafe-inline' here rather than a stricter policy
           * that only works on paper.
           *
           * What that costs is narrow on this particular site: nothing renders
           * user input as HTML. The contact form posts JSON and its contents
           * are never echoed back into a page, so there is no reflected-XSS
           * surface for an inline script to be injected through. Everything
           * else stays locked to same-origin, which is achievable only because
           * the design self-hosts its fonts and inlines its icons — no CDN to
           * allow.
           */
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              // Tailwind and next/font both inject inline styles.
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              // 'self', not 'none': the experience page embeds /resume.pdf.
              "frame-src 'self'",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'none'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          /*
           * Nothing here is meant to be embedded by another site. The resume
           * preview is same-origin, so same-origin is the correct value rather
           * than cross-origin -- which is what the API had to send when it was
           * on a different port.
           */
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
      {
        // Immutable content-hashed asset; the resume is not, so it is excluded.
        source: "/alwin.:hash.webp",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  images: {
    /*
     * Next allows only the qualities listed here and silently serves 75 for
     * anything else — a `quality` prop alone does nothing. 90 is for the hero
     * portrait, where 75 leaves compression mush around the eyes and hairline.
     */
    qualities: [75, 90],
  },
  experimental: {
    optimizePackageImports: ["simple-icons"],
  },
};

export default config;

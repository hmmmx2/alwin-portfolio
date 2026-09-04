import path from "node:path";

import type { NextConfig } from "next";

/**
 * The pnpm workspace root — one level up from this package.
 *
 * Stated explicitly rather than inferred. `@portfolio/shared` is a workspace
 * link, so both Turbopack and output tracing have to be rooted where its
 * source and the shared node_modules actually live; rooted at `web/` they
 * would miss it.
 *
 * (This used to guard against something else: the app lived inside a much
 * larger repository, and Next walked up to the wrong lockfile. That repository
 * is no longer in the picture, but the workspace reason still stands.)
 */
const workspaceRoot = path.resolve(process.cwd(), "..");

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /*
   * No `output: "standalone"`.
   *
   * It existed for the Docker image, which is gone, and Vercel manages its own
   * output format: with standalone set, Vercel's post-build step looked for
   * `.next/next-server.js.nft.json` and the build failed with ENOENT. The file
   * is written on a normal build.
   */
  // @portfolio/shared ships TypeScript source rather than a build artifact, so
  // Next has to compile it like first-party code.
  transpilePackages: ["@portfolio/shared"],
  turbopack: { root: workspaceRoot },
  outputFileTracingRoot: workspaceRoot,
  /*
   * All security headers, including the CSP. See the note on the CSP entry
   * below for why it is static rather than nonce-based.
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
              // challenges.cloudflare.com is the only third party this site
              // trusts, and it is here because Turnstile is the one bot
              // control a script cannot simply decline to trigger. It needs a
              // script and an iframe; the token is checked server-to-server
              // from the Node runtime, so connect-src stays 'self'.
              "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
              // Tailwind and next/font both inject inline styles.
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              // 'self', not 'none': the experience page embeds /resume.pdf.
              "frame-src 'self' https://challenges.cloudflare.com",
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
        /*
         * Name the PDF for downloads without forcing one.
         *
         * The static handler sends `Content-Disposition: inline;
         * filename="resume.pdf"` from the name on disk, and a server-supplied
         * filename *overrides* the `download` attribute on the link -- so the
         * saved file was "resume.pdf" no matter what the anchor asked for.
         *
         * `inline` is kept, so the preview iframe still renders it in place
         * rather than triggering a download; only the suggested name changes.
         * This also fixes the save button inside the browser's own PDF viewer,
         * which never saw the anchor's attribute at all.
         */
        source: "/resume.pdf",
        headers: [
          {
            key: "Content-Disposition",
            value: 'inline; filename="Alwin_ML_Engineer_CV.pdf"',
            // Kept in step with RESUME_DOWNLOAD_NAME in src/server/resume.ts.
            // The header wins over the link's download attribute, so a mismatch
            // would silently apply this one.
          },
          {
            /*
             * Without this the file inherits Vercel's `max-age=0`, and behind
             * Cloudflare that measured as `cf-cache-status: REVALIDATED` --
             * every single request for the resume reaching the origin. It was
             * the only asset on the site doing so.
             *
             * An hour, not a year, and no `immutable`: the filename is not
             * content-hashed, unlike the portrait and the demo recordings, so
             * a long cache would pin an outdated CV to a URL that cannot
             * change. An hour absorbs a flood at Cloudflare's edge while
             * keeping a replacement live within the hour.
             *
             * This is deliberately a cache header rather than a rate limit: it
             * prevents the load instead of refusing it, and a real recruiter
             * downloading the CV twice is not abuse.
             */
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
      {
        // Immutable content-hashed asset; the resume is not, so it is excluded.
        source: "/alwin.:hash.webp",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        /*
         * Every demo recording and poster, on the same content-hashed
         * convention as the portrait above. One rule rather than a pair per
         * project, but deliberately not a blanket `*.mp4`: the hash is matched
         * explicitly as eight hex digits, so an unhashed file dropped into
         * /public cannot inherit a year of immutable caching and become
         * impossible to replace.
         *
         * The hash is what makes `immutable` safe: Next serves /public with
         * `max-age=0`, so a 6.7 MB video that loops on two pages would be
         * revalidated on every visit. Caching it for a year is only correct
         * because a re-encode changes the filename -- overwriting in place
         * ships nothing, which is exactly how the portrait went stale once.
         */
        source: "/:slug(.+-demo).:hash([0-9a-f]{8}).mp4",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:slug(award-.+).:hash([0-9a-f]{8}).jpg",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:slug(.+-demo-poster).:hash([0-9a-f]{8}).jpg",
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

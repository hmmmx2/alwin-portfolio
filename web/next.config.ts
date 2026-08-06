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

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  outDir: "dist",
  sourcemap: true,
  clean: true,
  // @portfolio/shared ships TypeScript source, so it has to be bundled in
  // rather than left as a runtime import.
  noExternal: ["@portfolio/shared"],
});

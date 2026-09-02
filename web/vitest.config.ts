import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  // This app lives inside a much larger repository whose ancestor configs would
  // otherwise be picked up; the API package needed the same guard.
  css: { postcss: { plugins: [] } },
  esbuild: { tsconfigRaw: {} },
});

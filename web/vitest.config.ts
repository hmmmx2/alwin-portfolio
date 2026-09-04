import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  // This app lives inside a much larger repository whose ancestor configs would
  // otherwise be picked up; the API package needed the same guard.
  css: { postcss: { plugins: [] } },
  /*
   * The automatic JSX runtime, matching what Next compiles with. esbuild
   * defaults to the classic transform, which emits React.createElement and
   * fails with "React is not defined" in a file that never imports React --
   * correct code, wrong transform.
   */
  esbuild: { tsconfigRaw: {}, jsx: "automatic" },
});

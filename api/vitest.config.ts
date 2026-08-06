import { defineConfig } from "vitest/config";

export default defineConfig({
  // Vite walks up the filesystem looking for postcss/tsconfig, and this package
  // lives inside a larger repo that has both. Pinning them inline stops it
  // adopting an unrelated Tailwind/Expo config from an ancestor directory.
  css: { postcss: { plugins: [] } },
  esbuild: { tsconfigRaw: {} },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    restoreMocks: true,
  },
});

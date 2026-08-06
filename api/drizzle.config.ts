import { defineConfig } from "drizzle-kit";

/**
 * Only used by `pnpm db:generate`, if this project ever outgrows the idempotent
 * DDL applied at boot in src/db/migrate.ts.
 */
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});

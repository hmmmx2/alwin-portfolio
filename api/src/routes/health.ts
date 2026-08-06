import { Router } from "express";
import type { Health } from "@portfolio/shared";

import type { AppContext } from "../context";

export function healthRoutes(ctx: AppContext): Router {
  const router = Router();

  router.get("/health", async (_req, res) => {
    let database: Health["database"] = "up";
    try {
      await ctx.client.execute("SELECT 1");
    } catch {
      database = "down";
    }

    const body: Health = {
      ok: database === "up",
      version: ctx.version,
      uptimeSeconds: Math.round((Date.now() - ctx.startedAt) / 1000),
      database,
    };

    res.status(body.ok ? 200 : 503).json(body);
  });

  return router;
}

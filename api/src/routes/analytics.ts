import { Router } from "express";
import { PageviewInputSchema, type PageviewInput, type PageviewResponse } from "@portfolio/shared";

import type { AppContext } from "../context";
import { pageviews } from "../db/schema";
import { optedOut, referrerHost, visitorHash } from "../lib/privacy";
import { analyticsLimiter } from "../middleware/rateLimit";
import { validateBody } from "../middleware/validate";

export function analyticsRoutes(ctx: AppContext): Router {
  const router = Router();

  router.post(
    "/analytics/pageview",
    analyticsLimiter,
    validateBody(PageviewInputSchema),
    async (req, res) => {
      // Honour Do-Not-Track / Global Privacy Control by writing nothing at all,
      // and say so in the response rather than pretending it was recorded.
      if (optedOut(req)) {
        const body: PageviewResponse = { ok: true, recorded: false };
        res.status(200).json(body);
        return;
      }

      const input = req.body as PageviewInput;

      await ctx.db.insert(pageviews).values({
        path: input.path,
        referrerHost: referrerHost(input.referrer ?? req.get("referer")),
        visitorHash: visitorHash(req),
        createdAt: new Date(),
      });

      const body: PageviewResponse = { ok: true, recorded: true };
      res.status(201).json(body);
    },
  );

  return router;
}

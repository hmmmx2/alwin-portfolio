import { Router } from "express";
import { content, ContentSectionSchema } from "@portfolio/shared";

import { AppError } from "../lib/errors";

/**
 * Content is served from the shared module rather than the database: it is
 * authored in version control, changes with a deploy, and is identical for
 * every visitor. Backing it with a table would add a query to every render
 * without making anything easier to edit.
 */
export function contentRoutes(): Router {
  const router = Router();

  const cacheable = "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400";

  router.get("/content", (_req, res) => {
    res.setHeader("Cache-Control", cacheable);
    res.json(content);
  });

  router.get("/content/:section", (req, res) => {
    const parsed = ContentSectionSchema.safeParse(req.params.section);
    if (!parsed.success) {
      throw AppError.notFound(`Unknown content section "${req.params.section}".`);
    }
    res.setHeader("Cache-Control", cacheable);
    res.json(content[parsed.data]);
  });

  return router;
}

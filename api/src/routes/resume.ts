import { createReadStream } from "node:fs";

import { Router } from "express";

import type { AppContext } from "../context";
import { resumeDownloads } from "../db/schema";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";
import { visitorHash } from "../lib/privacy";
import { resolveResume, resumeMeta } from "../services/resume";

export function resumeRoutes(ctx: AppContext): Router {
  const router = Router();

  router.get("/resume/meta", async (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(await resumeMeta());
  });

  router.get("/resume", async (req, res) => {
    const resume = await resolveResume();
    if (!resume) {
      throw AppError.notFound(
        "No resume is published yet. Set RESUME_PATH to a PDF to enable this endpoint.",
      );
    }

    // Counting is best-effort: a failed insert must not cost the visitor the
    // download they actually asked for.
    ctx.db
      .insert(resumeDownloads)
      .values({ visitorHash: visitorHash(req), createdAt: new Date() })
      .catch((error: unknown) => {
        logger.warn({ err: error }, "failed to record resume download");
      });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", String(resume.bytes));
    res.setHeader("Content-Disposition", `inline; filename="${resume.filename}"`);
    createReadStream(resume.path).pipe(res);
  });

  return router;
}

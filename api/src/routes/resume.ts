import { createReadStream } from "node:fs";

import { Router } from "express";

import type { AppContext } from "../context";
import { env } from "../env";
import { resumeDownloads } from "../db/schema";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";
import { visitorHash } from "../lib/privacy";
import { resolveResume, resumeMeta } from "../services/resume";

export function resumeRoutes(ctx: AppContext): Router {
  const router = Router();

  router.get("/resume/meta", async (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(await resumeMeta(ctx.resumePath));
  });

  router.get("/resume", async (req, res) => {
    const resume = await resolveResume(ctx.resumePath);
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

    /*
     * helmet sets `X-Frame-Options: SAMEORIGIN` across the API, which is right
     * everywhere except here. The web app is a *different* origin — :3100
     * against this :4100 — so SAMEORIGIN blocks the resume preview outright,
     * and the panel renders as an empty rectangle with no error in the page.
     *
     * Swapped for a `frame-ancestors` allowlist rather than dropped: the
     * origins already trusted to call this API are exactly the ones that should
     * be able to embed the PDF, so it reuses CORS_ORIGINS instead of inventing
     * a second list to keep in sync. Modern browsers prefer frame-ancestors
     * when both are present, but the old header is removed anyway so there is
     * nothing to disagree about.
     */
    res.removeHeader("X-Frame-Options");
    res.setHeader(
      "Content-Security-Policy",
      `frame-ancestors 'self' ${env.CORS_ORIGINS.join(" ")}`,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", String(resume.bytes));
    res.setHeader("Content-Disposition", `inline; filename="${resume.filename}"`);
    createReadStream(resume.path).pipe(res);
  });

  return router;
}

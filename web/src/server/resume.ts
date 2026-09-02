import { stat } from "node:fs/promises";
import { join } from "node:path";

import type { ResumeMeta } from "@portfolio/shared";

/**
 * Size and date, read from the file on disk. Replaces the old
 * `/api/resume/meta` round trip; the pages that call this are static, so the
 * `stat` happens at build time and never per request.
 *
 * Server-only -- see the note on `resumeUrl` in lib/api.ts.
 */
const RESUME_FILE = join(process.cwd(), "public", "resume.pdf");

export async function getResumeMeta(): Promise<ResumeMeta> {
  try {
    const stats = await stat(RESUME_FILE);
    if (!stats.isFile()) throw new Error("not a file");
    return {
      available: true,
      filename: "resume.pdf",
      bytes: stats.size,
      updatedAt: stats.mtime.toISOString(),
    };
  } catch {
    // An absent file reports honestly, so the card shows its unavailable state
    // rather than offering a dead link.
    return { available: false, filename: null, bytes: null, updatedAt: null };
  }
}

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

/**
 * What the file is called when someone saves it.
 *
 * Distinct from the URL on purpose: `/resume.pdf` stays short and stable for
 * links and the preview iframe, while the saved file carries a name that means
 * something in a recruiter's downloads folder. The `download` attribute does
 * the renaming, and works now only because the PDF is same-origin -- browsers
 * ignore it across origins, which is why this was not worth doing while the
 * API served the file from another port.
 */
export const RESUME_DOWNLOAD_NAME = "CV_ Alwin Tay Jing Xue.pdf";

export async function getResumeMeta(): Promise<ResumeMeta> {
  try {
    const stats = await stat(RESUME_FILE);
    if (!stats.isFile()) throw new Error("not a file");
    return {
      available: true,
      filename: RESUME_DOWNLOAD_NAME,
      bytes: stats.size,
      updatedAt: stats.mtime.toISOString(),
    };
  } catch {
    // An absent file reports honestly, so the card shows its unavailable state
    // rather than offering a dead link.
    return { available: false, filename: null, bytes: null, updatedAt: null };
  }
}

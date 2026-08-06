import { stat } from "node:fs/promises";
import { basename, resolve } from "node:path";

import type { ResumeMeta } from "@portfolio/shared";

import { env } from "../env";

export interface ResolvedResume {
  path: string;
  filename: string;
  bytes: number;
  updatedAt: Date;
}

/** Absolute path the resume is read from, resolved against the API's cwd. */
export const resumePath = resolve(process.cwd(), env.RESUME_PATH);

/**
 * There is no resume PDF committed to this repo. Rather than shipping a dead
 * button or a fabricated document, the API reports availability honestly and
 * the web app hides the download affordance when it is false.
 */
export async function resolveResume(): Promise<ResolvedResume | null> {
  try {
    const stats = await stat(resumePath);
    if (!stats.isFile()) return null;
    return {
      path: resumePath,
      filename: basename(resumePath),
      bytes: stats.size,
      updatedAt: stats.mtime,
    };
  } catch {
    return null;
  }
}

export async function resumeMeta(): Promise<ResumeMeta> {
  const resume = await resolveResume();
  if (!resume) {
    return { available: false, filename: null, bytes: null, updatedAt: null };
  }
  return {
    available: true,
    filename: resume.filename,
    bytes: resume.bytes,
    updatedAt: resume.updatedAt.toISOString(),
  };
}

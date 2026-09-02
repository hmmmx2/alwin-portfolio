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

/** Default absolute path, resolved against the API's cwd. */
export const resumePath = resolve(process.cwd(), env.RESUME_PATH);

/**
 * Availability is reported honestly rather than assumed: when no PDF is
 * present the web app hides the download affordance and the preview frame
 * instead of shipping a dead button or an empty viewer.
 */
export async function resolveResume(
  path: string = resumePath,
): Promise<ResolvedResume | null> {
  try {
    const stats = await stat(path);
    if (!stats.isFile()) return null;
    return {
      path,
      filename: basename(path),
      bytes: stats.size,
      updatedAt: stats.mtime,
    };
  } catch {
    return null;
  }
}

export async function resumeMeta(path?: string): Promise<ResumeMeta> {
  const resume = await resolveResume(path);
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

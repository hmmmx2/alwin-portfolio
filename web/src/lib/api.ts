import {
  content as fallbackContent,
  ContentPayloadSchema,
  ResumeMetaSchema,
  type ContentPayload,
  type ResumeMeta,
} from "@portfolio/shared";

/**
 * Where the *browser* reaches the API. Baked into the client bundle at build
 * time, so it has to be the address a visitor's machine can resolve.
 */
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4100"
).replace(/\/+$/, "");

/**
 * Where the *server* reaches the API, which is not always the same address.
 *
 * Under Docker Compose the browser calls `http://localhost:4100` via a
 * published port, while this process has to call `http://api:4100` over the
 * compose network — `localhost` inside the web container is the web container.
 * Read at runtime (no NEXT_PUBLIC_ prefix), so it is set in the environment
 * rather than at build time, and it never reaches the client bundle.
 *
 * Falls back to API_BASE, which is correct whenever both sides share an origin.
 */
const SERVER_API_BASE = (process.env.API_INTERNAL_URL ?? API_BASE).replace(/\/+$/, "");

/**
 * A stale or wrong API URL is the usual reason a deployed site builds cleanly
 * and then shows nothing, so every fetch here degrades to the content bundled
 * from @portfolio/shared rather than throwing. The page always renders; only
 * live edits made through the API go missing — which is quiet enough that the
 * warning below is the only sign, so check it first when content looks frozen.
 */
async function fetchJson(path: string, revalidate: number): Promise<unknown> {
  const res = await fetch(`${SERVER_API_BASE}${path}`, {
    next: { revalidate },
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${path} responded ${res.status}`);
  return res.json();
}

function warn(path: string, error: unknown): void {
  // Visible in the build log so a broken API URL is diagnosable, without
  // failing the build over content that has a perfectly good fallback.
  console.warn(
    `[portfolio] ${path} unavailable, using bundled fallback:`,
    error instanceof Error ? error.message : error,
  );
}

export async function getContent(): Promise<ContentPayload> {
  try {
    const parsed = ContentPayloadSchema.safeParse(await fetchJson("/api/content", 3600));
    if (!parsed.success) throw new Error("response did not match the content schema");
    return parsed.data;
  } catch (error) {
    warn("/api/content", error);
    return fallbackContent;
  }
}

const RESUME_UNAVAILABLE: ResumeMeta = {
  available: false,
  filename: null,
  bytes: null,
  updatedAt: null,
};

export async function getResumeMeta(): Promise<ResumeMeta> {
  try {
    // Short window on purpose. Next's data cache lives on disk and survives a
    // server restart, so a longer revalidate means dropping resume.pdf in place
    // appears to do nothing for minutes — the response is four fields.
    const parsed = ResumeMetaSchema.safeParse(await fetchJson("/api/resume/meta", 30));
    return parsed.success ? parsed.data : RESUME_UNAVAILABLE;
  } catch (error) {
    warn("/api/resume/meta", error);
    return RESUME_UNAVAILABLE;
  }
}

export const resumeUrl = `${API_BASE}/api/resume`;

import { content, type ContentPayload } from "@portfolio/shared";

/**
 * Content, read directly rather than fetched.
 *
 * This used to call a separate Express service over HTTP and fall back to the
 * bundled `@portfolio/shared` module when that failed. The fallback was silent
 * by design -- the page always rendered -- which is exactly what made it
 * dangerous: a build once shipped an entire set of placeholder awards because
 * the API it fetched from was serving a stale image, and every check passed.
 *
 * One origin removes the question. The content is a TypeScript module compiled
 * into the bundle, so it cannot be stale relative to the deploy, and every page
 * that uses it is fully static.
 */
export function getContent(): ContentPayload {
  return content;
}

/**
 * Public URL of the resume: a static asset, so same-origin and CDN-cached.
 *
 * Deliberately in this module and not the server one. `SiteNav` is a client
 * component and imports it, so anything alongside it reaches the browser
 * bundle -- which is how `node:fs/promises` ended up in a browser chunk and
 * failed the build. `getResumeMeta` lives in `server/resume.ts` for that
 * reason.
 */
export const resumeUrl = "/resume.pdf";

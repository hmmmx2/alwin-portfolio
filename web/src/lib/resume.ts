/**
 * The filename a visitor's browser saves the CV as.
 *
 * It lives here, in a module with no imports, rather than beside the `stat`
 * call in server/resume.ts: the nav is a client component, and importing this
 * constant from the server module pulled `node:fs/promises` into the client
 * bundle and failed the build outright. Typecheck was perfectly happy with it.
 *
 * Kept in step with the Content-Disposition header in next.config.ts. The
 * header wins when the two disagree, silently, which is what once produced
 * "resume (1).pdf".
 */
export const RESUME_DOWNLOAD_NAME = "Alwin_ML_Engineer_CV.pdf";

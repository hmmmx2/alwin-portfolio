import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny, z } from "zod";

import { AppError } from "../lib/errors";

/**
 * Validates `req.body` against a schema and replaces it with the parsed value,
 * so handlers receive coerced, defaulted, fully typed input.
 *
 * The schema comes from @portfolio/shared, which the browser form also uses --
 * client and server cannot disagree about what a valid submission looks like.
 */
export function validateBody<S extends ZodTypeAny>(schema: S) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".") || "_";
        fields[key] ??= issue.message;
      }
      next(AppError.unprocessable("Some fields need attention.", fields));
      return;
    }

    req.body = result.data as z.infer<S>;
    next();
  };
}

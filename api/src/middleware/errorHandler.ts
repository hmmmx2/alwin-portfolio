import type { NextFunction, Request, Response } from "express";

import { isProduction } from "../env";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";

/** Terminal 404 — mounted after every route. */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`No route for ${req.method} ${req.path}`));
}

/**
 * The one place an error becomes a response body. Express 5 forwards rejected
 * promises from async handlers here automatically, so routes need no wrapper.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  const known = err instanceof AppError;
  const status = known ? err.status : 500;
  const code = known ? err.code : "internal_error";
  const message = known
    ? err.message
    : isProduction
      ? "Something went wrong on our end."
      : err instanceof Error
        ? err.message
        : String(err);

  if (status >= 500) {
    logger.error({ err, requestId: req.id, path: req.path }, "request failed");
  } else {
    logger.warn({ code, requestId: req.id, path: req.path, message }, "request rejected");
  }

  res.status(status).json({
    error: {
      code,
      message,
      requestId: req.id,
      ...(known && err.fields ? { fields: err.fields } : {}),
    },
  });
}

import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

/**
 * Every response carries an `x-request-id`, and every error body repeats it, so
 * a user-reported failure can be found in the logs from the value alone.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.get("x-request-id");
  req.id = incoming && incoming.length <= 128 ? incoming : randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
}

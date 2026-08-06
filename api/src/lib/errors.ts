/**
 * The single error type routes throw. Everything else that escapes a handler
 * is treated as a 500 by the error middleware.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string> | undefined;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  static badRequest(message: string, fields?: Record<string, string>) {
    return new AppError(400, "bad_request", message, fields);
  }

  static notFound(message = "Not found") {
    return new AppError(404, "not_found", message);
  }

  static unprocessable(message: string, fields?: Record<string, string>) {
    return new AppError(422, "unprocessable_entity", message, fields);
  }

  static tooManyRequests(message = "Too many requests. Try again later.") {
    return new AppError(429, "rate_limited", message);
  }
}

import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import type { AppContext } from "./context";
import { env, isTest } from "./env";
import { logger } from "./lib/logger";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { globalLimiter } from "./middleware/rateLimit";
import { requestId } from "./middleware/requestId";
import { analyticsRoutes } from "./routes/analytics";
import { contactRoutes } from "./routes/contact";
import { contentRoutes } from "./routes/content";
import { healthRoutes } from "./routes/health";
import { resumeRoutes } from "./routes/resume";

/**
 * Builds the app without listening, so the test suite can mount it directly
 * with supertest against an in-memory database.
 */
export function buildApp(ctx: AppContext): Express {
  const app = express();

  // Behind a reverse proxy req.ip must come from X-Forwarded-For, otherwise
  // every visitor shares the proxy's address and rate limiting collapses.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(requestId);

  if (!isTest) {
    app.use(
      pinoHttp({
        logger,
        genReqId: (req) => (req as { id?: string }).id ?? "unknown",
        autoLogging: { ignore: (req) => req.url === "/api/health" },
      }),
    );
  }

  // This API serves JSON to a separate origin and never renders HTML, so the
  // HTML-oriented parts of helmet's defaults are off.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin and non-browser callers (curl, server-side fetch during
        // a Next build) send no Origin header at all.
        if (!origin || env.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed`));
      },
      methods: ["GET", "POST", "OPTIONS"],
      maxAge: 86400,
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: "64kb" }));
  app.use(globalLimiter);

  app.use("/api", healthRoutes(ctx));
  app.use("/api", contentRoutes());
  app.use("/api", contactRoutes(ctx));
  app.use("/api", resumeRoutes(ctx));
  app.use("/api", analyticsRoutes(ctx));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

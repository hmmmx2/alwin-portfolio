import { pino } from "pino";

import { env, isProduction, isTest } from "../env";

export const logger = pino({
  level: isTest ? "silent" : env.LOG_LEVEL,
  // Pretty output is a dev-only convenience; production emits newline JSON so
  // a log shipper can parse it.
  transport: isProduction || isTest ? undefined : { target: "pino/file", options: { destination: 1 } },
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", 'req.headers["x-forwarded-for"]'],
    remove: true,
  },
});

export type Logger = typeof logger;

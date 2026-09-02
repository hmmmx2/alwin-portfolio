import { buildApp } from "./app";
import type { AppContext } from "./context";
import { createDatabase } from "./db/client";
import { migrate } from "./db/migrate";
import { env } from "./env";
import { logger } from "./lib/logger";
import { createMailer } from "./services/mailer";
import { resumePath } from "./services/resume";

async function main(): Promise<void> {
  const { db, client } = createDatabase();
  await migrate(client);

  const ctx: AppContext = {
    db,
    client,
    mailer: createMailer(),
    resumePath,
    startedAt: Date.now(),
    version: process.env.npm_package_version ?? "1.0.0",
  };

  const server = buildApp(ctx).listen(env.PORT, env.HOST, () => {
    logger.info(
      {
        url: `http://${env.HOST}:${env.PORT}`,
        cors: env.CORS_ORIGINS,
        database: env.DATABASE_URL,
        mail: ctx.mailer.enabled ? "smtp" : "disabled (messages stored only)",
        resume: resumePath,
      },
      "portfolio api listening",
    );
  });

  // Finish in-flight requests before exiting, then close the db handle.
  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "shutting down");

    server.close((error) => {
      if (error) logger.error({ err: error }, "error while closing server");
      client.close();
      process.exit(error ? 1 : 0);
    });

    // Don't hang forever on a stuck keep-alive connection.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((error: unknown) => {
  logger.fatal({ err: error }, "failed to start");
  process.exit(1);
});

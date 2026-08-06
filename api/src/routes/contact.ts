import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { Router } from "express";
import { ContactInputSchema, type ContactInput, type ContactResponse } from "@portfolio/shared";

import type { AppContext } from "../context";
import { contactMessages } from "../db/schema";
import { env } from "../env";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";
import { contactLimiter } from "../middleware/rateLimit";
import { validateBody } from "../middleware/validate";

export function contactRoutes(ctx: AppContext): Router {
  const router = Router();

  router.post(
    "/contact",
    contactLimiter,
    validateBody(ContactInputSchema),
    async (req, res) => {
      const input = req.body as ContactInput;

      // Honeypot: a hidden field only an autofilling bot would populate.
      // Answer 202 rather than an error so the bot has nothing to tune against.
      if (input.company) {
        logger.info({ requestId: req.id }, "contact honeypot triggered");
        res.status(202).json({ ok: true, id: "discarded", delivered: false });
        return;
      }

      // Timing check: a human cannot read the form and type 20+ characters in
      // under a couple of seconds.
      if (typeof input.elapsedMs === "number" && input.elapsedMs < env.CONTACT_MIN_FILL_MS) {
        throw AppError.unprocessable("That was too quick — please try again.");
      }

      const id = randomUUID();

      // Persist first. If the mailer is down the message still exists; doing it
      // the other way round would lose the message on an SMTP failure.
      await ctx.db.insert(contactMessages).values({
        id,
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
        delivered: false,
        createdAt: new Date(),
      });

      let delivered = false;
      let deliveryError: string | null = null;

      try {
        await ctx.mailer.send({
          name: input.name,
          email: input.email,
          subject: input.subject,
          message: input.message,
        });
        delivered = ctx.mailer.enabled;
      } catch (error) {
        deliveryError = error instanceof Error ? error.message : String(error);
        logger.error({ err: error, requestId: req.id, id }, "contact mail delivery failed");
      }

      if (delivered || deliveryError) {
        await ctx.db
          .update(contactMessages)
          .set({ delivered, deliveryError })
          .where(eq(contactMessages.id, id));
      }

      const body: ContactResponse = { ok: true, id, delivered };
      res.status(201).json(body);
    },
  );

  return router;
}

import nodemailer, { type Transporter } from "nodemailer";

import { env } from "./env";

/*
 * pino went with the Express app. Vercel collects stdout/stderr, so plain
 * console calls land in the same place a structured logger would have.
 */
const consoleInfo = (detail: unknown, message?: string) => console.log(message ?? "", detail);
const consoleWarn = (detail: unknown, message?: string) => console.warn(message ?? "", detail);

export interface ContactMail {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface Mailer {
  readonly enabled: boolean;
  send(mail: ContactMail): Promise<void>;
}

/** Dev/test default: log and move on, so no SMTP config is needed to work locally. */
const noopMailer: Mailer = {
  enabled: false,
  async send(mail) {
    consoleInfo(
      { to: env().MAIL_TO ?? "(unset)", from: mail.email, subject: mail.subject },
      "mail disabled — contact message stored only",
    );
  },
};

function buildTransport(): Transporter | null {
  if (!env().MAIL_HOST || !env().MAIL_PORT || !env().MAIL_TO || !env().MAIL_FROM) {
    consoleWarn(
      "MAIL_ENABLED=true but MAIL_HOST/MAIL_PORT/MAIL_FROM/MAIL_TO are incomplete — falling back to logging",
    );
    return null;
  }

  return nodemailer.createTransport({
    host: env().MAIL_HOST,
    port: env().MAIL_PORT,
    secure: env().MAIL_SECURE,
    auth:
      env().MAIL_USER && env().MAIL_PASSWORD
        ? { user: env().MAIL_USER, pass: env().MAIL_PASSWORD }
        : undefined,
  });
}

export function createMailer(): Mailer {
  if (!env().MAIL_ENABLED) return noopMailer;

  const transport = buildTransport();
  if (!transport) return noopMailer;

  return {
    enabled: true,
    async send(mail) {
      await transport.sendMail({
        from: env().MAIL_FROM,
        to: env().MAIL_TO,
        // The visitor's address goes in Reply-To, never in From: sending as
        // them would fail SPF/DMARC and land the whole thing in spam.
        replyTo: `${mail.name} <${mail.email}>`,
        subject: `[portfolio] ${mail.subject}`,
        text: `From: ${mail.name} <${mail.email}>\n\n${mail.message}`,
      });
    },
  };
}

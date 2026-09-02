import type { ContactMail } from "./mailer";

/**
 * The notification email.
 *
 * Written as inline-styled tables rather than a stylesheet because that is what
 * survives Gmail, Outlook and Apple Mail -- they strip `<style>` blocks, ignore
 * flexbox and grid, and Outlook renders through Word. No external images
 * either: remote content is blocked by default in most clients, so anything
 * decorative has to be built from borders and background colours or it arrives
 * as a broken-image icon.
 *
 * Light, not the site's dark palette. Forced dark mode in Gmail and Outlook
 * inverts colours unpredictably, and a dark card is where that goes worst.
 */

const INK = "#111318";
const MUTED = "#5b6270";
const FAINT = "#8a91a0";
const LINE = "#e4e6eb";
const CANVAS = "#f5f6f8";

/**
 * Repeated on every element that renders text.
 *
 * Mail clients do not inherit a body font the way a browser does -- an element
 * without an explicit family falls back to the client's default, which is Times
 * in most of them. The message body arrived in serif while the rest of the
 * template was sans until this was set on the paragraphs too.
 */
const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

/** Escapes for HTML, since every value here is attacker-controlled. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Preserves the visitor's paragraphs without trusting their markup. */
function paragraphs(message: string): string {
  return message
    .split(/\n{2,}/)
    .map((block) => escapeHtml(block.trim()).replace(/\n/g, "<br />"))
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 14px;font:400 15px/1.65 ${SANS};color:${INK}">${block}</p>`,
    )
    .join("");
}

export function subjectLine(mail: ContactMail): string {
  // The name goes in the subject because Gmail shows a self-addressed message
  // as "me" no matter what the From display name says -- the subject is the
  // only part of the row that can carry who it is actually from.
  return `Portfolio · ${mail.name} — ${mail.subject}`;
}

export function textBody(mail: ContactMail): string {
  return [
    `New message from the portfolio contact form.`,
    ``,
    `From:    ${mail.name} <${mail.email}>`,
    `Subject: ${mail.subject}`,
    ``,
    `---`,
    ``,
    mail.message,
    ``,
    `---`,
    ``,
    `Reply to this email and it goes straight to ${mail.email}.`,
  ].join("\n");
}

export function htmlBody(mail: ContactMail): string {
  const name = escapeHtml(mail.name);
  const email = escapeHtml(mail.email);
  const subject = escapeHtml(mail.subject);

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:${CANVAS};">
  <!-- Preheader: the grey line Gmail shows after the subject in the list. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${name} &lt;${email}&gt; — ${subject}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:${CANVAS};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;">

        <tr><td style="background:#0a0b0d;padding:18px 26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="font:600 14px/1.2 ${SANS};color:#ffffff;letter-spacing:-0.01em;">
              alwint.dev
            </td>
            <td align="right" style="font:500 10px/1.2 ${MONO};color:#8a91a0;letter-spacing:0.16em;text-transform:uppercase;">
              Contact form
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:26px 26px 6px;">
          <p style="margin:0 0 4px;font:500 11px/1.2 ${MONO};color:${FAINT};letter-spacing:0.14em;text-transform:uppercase;">
            New message
          </p>
          <h1 style="margin:0 0 20px;font:600 20px/1.3 ${SANS};color:${INK};letter-spacing:-0.02em;">
            ${subject}
          </h1>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                 style="border:1px solid ${LINE};border-radius:10px;background:#fafbfc;margin:0 0 22px;">
            <tr>
              <td style="padding:12px 16px;font:400 13px/1.5 ${SANS};color:${MUTED};width:64px;">From</td>
              <td style="padding:12px 16px 12px 0;font:600 13px/1.5 ${SANS};color:${INK};">${name}</td>
            </tr>
            <tr>
              <td style="padding:0 16px 12px;font:400 13px/1.5 ${SANS};color:${MUTED};">Email</td>
              <td style="padding:0 16px 12px 0;font:400 13px/1.5 ${MONO};">
                <a href="mailto:${email}" style="color:#1e5fd0;text-decoration:none;">${email}</a>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 26px 8px;">
          ${paragraphs(mail.message)}
        </td></tr>

        <tr><td style="padding:14px 26px 28px;">
          <a href="mailto:${email}?subject=${encodeURIComponent("Re: " + mail.subject)}"
             style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;
                    font:600 13px/1 ${SANS};
                    padding:13px 22px;border-radius:999px;">
            Reply to ${name}
          </a>
        </td></tr>

        <tr><td style="border-top:1px solid ${LINE};padding:16px 26px;background:#fafbfc;">
          <p style="margin:0;font:400 12px/1.6 ${SANS};color:${FAINT};">
            Sent from the contact form at
            <a href="https://www.alwint.dev" style="color:${MUTED};">alwint.dev</a>.
            Replying to this email reaches ${name} directly.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

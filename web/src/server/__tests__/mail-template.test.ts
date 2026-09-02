import { describe, expect, it } from "vitest";

import { htmlBody, subjectLine, textBody } from "../mail-template";

/**
 * Every field in a contact message is attacker-controlled and lands in an HTML
 * document that gets delivered to a mailbox. Mail clients are far less
 * forgiving than a browser about what they will execute, but "less" is not
 * "never" -- and a broken layout from an unescaped `<` is a certainty either
 * way.
 */
const hostile = {
  name: '<script>alert(1)</script>Bobby "Tables"',
  email: 'x@evil.test"><img src=x onerror=alert(1)>',
  subject: "</h1><script>alert('xss')</script>",
  message: "<script>alert('body')</script>\n\n<b>not bold</b> & <i>not italic</i>",
};

const ordinary = {
  name: "Priya Raman",
  email: "priya@example.com",
  subject: "ML Engineer role",
  message: "First paragraph.\n\nSecond paragraph.\nSame paragraph, new line.",
};

describe("mail template", () => {
  it("escapes every attacker-controlled field", () => {
    const html = htmlBody(hostile);

    // The property that matters is position, not presence: the string
    // "onerror=" surviving as inert text is fine, an <img> tag carrying it is
    // not. So assert no injected tag opens, and that the payloads are escaped.
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("</h1><");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    // The quote in the name must not be able to close an attribute.
    expect(html).toContain("&quot;Tables&quot;");
  });

  it("keeps the visitor's paragraphs without trusting their markup", () => {
    const html = htmlBody(ordinary);

    expect(html).toContain("First paragraph.");
    expect(html).toContain("Second paragraph.<br />Same paragraph, new line.");
    // Two blank-line-separated blocks, so two paragraphs in the message body.
    // Counted structurally rather than by a style string, which changes
    // whenever the template's CSS is touched.
    const bodyParagraphs = html.match(/<p style="margin:0 0 14px/g) ?? [];
    expect(bodyParagraphs).toHaveLength(2);
  });

  it("puts the sender in the subject, since Gmail shows a self-addressed row as 'me'", () => {
    expect(subjectLine(ordinary)).toBe("Portfolio · Priya Raman — ML Engineer role");
  });

  it("sends a plain-text part as well as HTML", () => {
    const text = textBody(ordinary);

    expect(text).toContain("priya@example.com");
    expect(text).toContain("First paragraph.");
    // Notification previews and screen readers read this, so it must be prose,
    // not markup. `Name <email>` is RFC address form, not a tag -- so check for
    // tags rather than for angle brackets.
    // A tag name is letters and digits, then whitespace or `>`. Without that
    // last part the pattern matches `<priya@example.com>`, because an RFC
    // address looks exactly like a tag to a lazy regex.
    expect(text).not.toMatch(/<\/?[a-z][a-z0-9]*(?:\s[^>]*)?>/i);
    expect(text).toContain("Priya Raman <priya@example.com>");
  });
});

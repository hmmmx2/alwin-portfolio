/**
 * The email address, linked straight to a Gmail compose window.
 *
 * Not a `mailto:`. That is the correct markup, and it does nothing at all for a
 * visitor with no desktop mail client registered -- which is most people on a
 * work laptop, and was the reported symptom. A dead click costs more than
 * sending someone to the wrong webmail.
 *
 * The trade is real and worth stating: an Outlook or Apple Mail user lands in
 * Gmail rather than their own client. Anyone signed in to a Google account --
 * the large majority -- gets a compose window addressed and titled; anyone else
 * gets a Google sign-in page and can fall back to copying the address, which is
 * visible on screen wherever this is used.
 *
 * No "use client": this is a plain anchor, so it ships no JavaScript.
 */
export function EmailLink({
  email,
  subject = "Hello Alwin",
  className,
  children,
}: {
  email: string;
  subject?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const href =
    "https://mail.google.com/mail/?view=cm&fs=1" +
    `&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}`;

  return (
    <a
      href={href}
      // A new tab, so the portfolio is still open behind the compose window.
      target="_blank"
      rel="noreferrer"
      title={`Email ${email}`}
      className={className}
    >
      {children ?? email}
    </a>
  );
}

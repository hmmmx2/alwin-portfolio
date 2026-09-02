"use client";

import { useEffect, useRef, useState } from "react";

import { CheckIcon, ExternalIcon, MailIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/**
 * The email address, with somewhere to go.
 *
 * A bare `mailto:` is correct markup and does nothing at all for a visitor with
 * no desktop mail client configured -- which is most people on a work laptop,
 * and was the reported symptom here. Guessing their webmail from the user agent
 * is not possible either.
 *
 * So it asks. One click opens a small menu: Gmail, Outlook, whatever the system
 * has registered, or copy. `mailto:` stays in the list rather than being
 * replaced, because for anyone who *does* have Thunderbird or Mail.app it is
 * still the right answer.
 */
function composeUrls(email: string, subject: string) {
  const s = encodeURIComponent(subject);
  const to = encodeURIComponent(email);
  return {
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${s}`,
    outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${to}&subject=${s}`,
    mailto: `mailto:${email}?subject=${s}`,
  };
}

const item =
  "flex w-full items-center gap-[10px] px-[14px] py-[9px] text-left font-mono text-[12px] leading-none text-ink-muted transition-colors hover:bg-[rgb(255_255_255/0.06)] hover:text-ink-bright";

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
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const urls = composeUrls(email, subject);

  // Close on outside click and on Escape, the same way the mobile nav does.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is unavailable outside a secure context; the address is
      // visible on screen either way, so this fails quietly rather than
      // throwing an error at someone who just wanted to email.
    }
    setOpen(false);
  }

  return (
    <div ref={root} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn("cursor-pointer", className)}
      >
        {children ?? email}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-[calc(100%+8px)] z-50 min-w-[190px] overflow-hidden rounded-tile border border-[rgb(255_255_255/0.12)] bg-[rgb(18_19_22/0.98)] py-1 shadow-panel backdrop-blur-[var(--glass-blur)]"
        >
          <a role="menuitem" href={urls.gmail} target="_blank" rel="noreferrer" className={item}>
            Gmail
            <ExternalIcon className="ml-auto size-[11px]" />
          </a>
          <a role="menuitem" href={urls.outlook} target="_blank" rel="noreferrer" className={item}>
            Outlook
            <ExternalIcon className="ml-auto size-[11px]" />
          </a>
          <a role="menuitem" href={urls.mailto} className={item}>
            Mail app
            <MailIcon className="ml-auto size-[12px]" />
          </a>
          <button role="menuitem" type="button" onClick={copy} className={item}>
            {copied ? "Copied" : "Copy address"}
            {copied ? <CheckIcon className="ml-auto size-[12px]" /> : null}
          </button>
        </div>
      ) : null}
    </div>
  );
}

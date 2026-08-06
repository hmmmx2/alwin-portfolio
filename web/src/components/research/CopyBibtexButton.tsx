"use client";

import { useEffect, useRef, useState } from "react";

import { CheckIcon } from "@/components/ui/icons";

/**
 * Copies a BibTeX entry to the clipboard.
 *
 * The only client component on /research. The entry itself is generated on the
 * server and passed in, so this ships no formatting logic.
 */
export function CopyBibtexButton({
  bibtex,
  paperTitle,
  className,
}: {
  bibtex: string;
  paperTitle: string;
  className: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(bibtex);
      } else {
        // The async clipboard API needs a secure context. On plain http — a
        // LAN preview, say — fall back rather than silently doing nothing.
        const scratch = document.createElement("textarea");
        scratch.value = bibtex;
        scratch.setAttribute("readonly", "");
        scratch.style.position = "fixed";
        scratch.style.opacity = "0";
        document.body.appendChild(scratch);
        scratch.select();
        document.execCommand("copy");
        document.body.removeChild(scratch);
      }

      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      // Nothing useful to say — the citation is still visible in the entry
      // itself if they want to select it by hand.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy BibTeX citation for ${paperTitle}`}
      className={className}
    >
      {copied ? (
        <>
          <CheckIcon className="size-[13px]" />
          Copied
        </>
      ) : (
        "Copy BibTeX"
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "BibTeX citation copied to clipboard" : ""}
      </span>
    </button>
  );
}

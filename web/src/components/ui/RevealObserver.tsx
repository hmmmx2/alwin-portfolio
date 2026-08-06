"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * One IntersectionObserver for the whole page.
 *
 * Elements are unobserved as soon as they reveal, so the observer's work list
 * shrinks to nothing by the time the visitor reaches the footer. Under reduced
 * motion nothing is observed at all — the CSS already shows every element.
 *
 * Keyed on the pathname because this is mounted from the layout: it snapshots
 * the DOM once, and without re-running on navigation the next page's elements
 * would sit at `opacity: 0` forever. A hard refresh hides the bug entirely —
 * it only appears on client-side navigation.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    for (const target of targets) {
      // Anything already on screen at load reveals immediately rather than
      // waiting for a scroll that may never come.
      const rect = target.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        target.setAttribute("data-revealed", "");
      } else {
        observer.observe(target);
      }
    }

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}

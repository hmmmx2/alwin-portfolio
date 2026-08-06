import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Marks an element to animate in when it first scrolls into view.
 *
 * Server-rendered on purpose: this only sets attributes. A single client-side
 * observer (<RevealObserver />, mounted once per page) does the watching, so a
 * page with forty revealed elements has one observer rather than forty.
 *
 * `index` staggers siblings through a CSS custom property — no per-item timers.
 */
export function Reveal({
  as: Tag = "div",
  index = 0,
  className,
  children,
  id,
  // Forwarded explicitly: this component renders an arbitrary tag, and props it
  // doesn't declare are dropped without warning — which quietly cost a
  // `<section>` its accessible name.
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: {
  as?: ElementType;
  index?: number;
  className?: string;
  children: ReactNode;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  return (
    <Tag
      id={id}
      data-reveal=""
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      style={{ "--reveal-index": index } as React.CSSProperties}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}

"use client";

import { useCallback, useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Pointer-tracked highlight for cards.
 *
 * The gradient itself is CSS (see `.spotlight` in globals.css); this only
 * writes two custom properties. Updates are batched into one animation frame
 * and never touch React state, so dragging the mouse across the project grid
 * costs a style recalculation rather than a re-render.
 *
 * Mouse only — a touch device has no hover, so there is nothing to track.
 */
export function Spotlight({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const point = useRef({ x: 0, y: 0 });

  const flush = useCallback(() => {
    frame.current = 0;
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--spot-x", `${point.current.x}px`);
    el.style.setProperty("--spot-y", `${point.current.y}px`);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse") return;
      const rect = event.currentTarget.getBoundingClientRect();
      point.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      if (!frame.current) frame.current = requestAnimationFrame(flush);
    },
    [flush],
  );

  const setActive = useCallback((active: boolean) => {
    const el = ref.current;
    if (!el) return;
    el.dataset.active = String(active);
  }, []);

  return (
    <div
      ref={ref}
      className={cn("spotlight relative", className)}
      onPointerMove={onPointerMove}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setActive(true);
      }}
      onPointerLeave={() => setActive(false)}
    >
      {children}
    </div>
  );
}

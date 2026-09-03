"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

/**
 * A silent screen recording of a project actually running.
 *
 * This is evidence rather than decoration -- the point is that a visitor sees
 * the thing work -- so it loops, carries real controls, and is never cropped on
 * the showcase row, where the UI in the frame is the whole argument.
 *
 * Three things keep it from costing every visitor 6.7 MB:
 *
 *  - `preload="none"`, so someone who never scrolls to it downloads only the
 *    poster image.
 *  - Playback starts when it scrolls into view and pauses when it leaves, so a
 *    background tab or a section nobody reached is not decoding video.
 *  - `muted` + `playsInline`, without which iOS refuses to autoplay at all and
 *    Safari would take the video fullscreen on tap.
 *
 * Sizing follows `MediaSlot`: a positioned wrapper carries the box and the
 * video fills it absolutely. The video cannot carry its own size -- `h-full`
 * against a parent with no height collapses it, which rendered this component
 * as a 2x2 pixel dot the first time.
 */
export function ProjectVideo({
  src,
  poster,
  label,
  caption,
  className,
  style,
  fit = "cover",
  controls = true,
}: {
  src: string;
  poster: string;
  /** Describes the recording for anyone who cannot see it. */
  label: string;
  caption?: string;
  className?: string;
  /**
   * Carries the aspect ratio, which comes from the data rather than a class so
   * a differently-shaped recording still reserves the right box.
   */
  style?: React.CSSProperties;
  /** `contain` where the UI in the frame is the point and must not be cropped. */
  fit?: "cover" | "contain";
  controls?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    /*
     * Someone who has asked for less motion gets the poster and the controls,
     * and decides for themselves. Read here rather than in CSS because what
     * changes is behaviour, not style.
     */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /*
     * Same courtesy for an explicit data-saver setting. This file is 6.7 MB and
     * loops; pushing that at someone on a metered connection is a bill, not a
     * demo. They still get the poster and can press play.
     */
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (connection?.saveData) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          // Autoplay can still be refused by browser policy. That is a fine
          // outcome -- poster and controls remain -- so the rejection is
          // swallowed rather than logged on every card.
          void video.play().catch(() => {});
        } else if (!video.paused) {
          video.pause();
        }
      },
      /*
       * A quarter in view. The showcase player is taller than a short laptop
       * viewport, so a half-visible threshold could never be satisfied there
       * and the video would sit on its poster forever.
       */
      { threshold: 0.25 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <figure className="m-0">
      <div className={cn("relative overflow-hidden", className)} style={style}>
        {failed ? (
          // An unplayable video must not leave a black rectangle where the
          // evidence was meant to be.
          <div className="absolute inset-0 flex items-center justify-center bg-panel px-6 text-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-ghost">
              Demo video unavailable
            </span>
          </div>
        ) : (
          <video
            ref={ref}
            src={src}
            poster={poster}
            aria-label={label}
            muted
            loop
            playsInline
            preload="none"
            controls={controls}
            onError={() => setFailed(true)}
            className={cn(
              "absolute inset-0 size-full bg-void",
              fit === "contain" ? "object-contain" : "object-cover",
            )}
          />
        )}
      </div>
      {caption ? (
        <figcaption className="m-0 mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-ink-ghost">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

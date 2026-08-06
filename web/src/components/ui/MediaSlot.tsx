import Image from "next/image";

import { cn } from "@/lib/cn";

/**
 * Replaces the design's <image-slot> custom element.
 *
 * Every slot in the source document was empty — the design had no
 * `.image-slots.state.json` sidecar, so there are no thumbnails to port. This
 * renders a real optimised image when one is configured and an honest empty
 * frame when one isn't, rather than a broken <img> or a stock photo standing
 * in for work that doesn't exist.
 */
export function MediaSlot({
  src,
  alt,
  label,
  className,
  style,
  fit = "cover",
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
  quality,
}: {
  src: string | null;
  alt: string;
  label: string;
  className?: string;
  style?: React.CSSProperties;
  fit?: "cover" | "contain";
  sizes?: string;
  priority?: boolean;
  /**
   * Next's default is 75, which is fine for a screenshot and visibly soft on a
   * face. Raise it for photographic content; leave it alone for everything else,
   * since the bytes are real.
   */
  quality?: number;
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden", className)} style={style}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={quality}
          className={fit === "contain" ? "object-contain" : "object-cover"}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-panel",
        className,
      )}
      style={style}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.035) 0 1px, transparent 1px 9px)",
        }}
      />
      <span className="relative px-6 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-ink-ghost">
        {label}
      </span>
    </div>
  );
}

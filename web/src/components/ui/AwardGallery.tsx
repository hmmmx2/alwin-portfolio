"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

/**
 * The photographs attached to an award, with a click-to-enlarge preview.
 *
 * Built on a native `<dialog>` opened with `showModal()`, which is doing real
 * work here rather than being a tag choice: it supplies the focus trap, Escape
 * to dismiss, inertness of the page behind, and focus returning to the
 * thumbnail that opened it. Hand-rolling those is where accessible modals
 * usually go wrong.
 *
 * Layout follows the number of images, because a single photograph in a 2x2
 * grid looks like three are missing:
 *
 *  - one image  -> a single full-width frame at its own aspect ratio
 *  - two or more -> two stacked on the left, the third spanning a right column
 */

/** Shared glass recipe, matching the project showcase's frames. */
const frame =
  "relative overflow-hidden rounded-tile border border-[rgb(255_255_255/0.09)] bg-[rgb(255_255_255/0.03)]";

/*
 * A thumbnail is a button, not a div with a click handler: it has to be
 * reachable by keyboard and announce itself as something that does something.
 */
const trigger =
  "group relative block w-full cursor-zoom-in appearance-none border-0 bg-transparent p-0 text-left transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(125_211_252/0.8)]";

export function AwardGallery({
  images,
  title,
}: {
  /** Each image carries its own alt text, so the two cannot drift apart. */
  images: { src: string; alt: string }[];
  title: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open !== null && !dialog.open) dialog.showModal();
    if (open === null && dialog.open) dialog.close();
  }, [open]);

  // Escape and the close button both fire `close`; syncing state here keeps
  // React's idea of open in step with the element's, however it was dismissed.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => setOpen(null);
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  const step = useCallback(
    (delta: number) => {
      setOpen((current) =>
        current === null ? null : (current + delta + images.length) % images.length,
      );
    },
    [images.length],
  );

  useEffect(() => {
    if (open === null || images.length < 2) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, images.length, step]);

  if (images.length === 0) return null;

  const single = images.length === 1;

  return (
    <>
      <div
        className={cn(
          "w-full flex-[1_1_340px]",
          single ? "" : "grid grid-cols-2 grid-rows-2 gap-[10px] sm:gap-3",
        )}
      >
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setOpen(index)}
            aria-label={`Enlarge ${title}: ${image.alt}`}
            className={cn(
              trigger,
              single
                ? ""
                : index === 0
                  ? "col-start-1 row-start-1"
                  : index === 1
                    ? "col-start-1 row-start-2"
                    : "col-start-2 row-span-2 row-start-1",
            )}
          >
            <span
              className={cn(
                frame,
                "block",
                // A lone photograph keeps its own shape; the grid's left cells
                // are 4:3 so the spanning column lands near the certificate's
                // own ratio.
                single ? "aspect-[16/9]" : index === 2 ? "h-full" : "aspect-[4/3]",
              )}
            >
              <Image
                src={image.src}
                alt={`${title}: ${image.alt}`}
                fill
                sizes={single ? "(max-width: 900px) 92vw, 420px" : "(max-width: 900px) 45vw, 260px"}
                className="object-contain"
              />
            </span>
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        aria-label={`${title}, enlarged`}
        // Clicking the backdrop dismisses. The check compares against the
        // dialog itself: the backdrop is not a child, so any click that lands
        // on the element rather than its content came from outside the panel.
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(null);
        }}
        className="max-h-none max-w-none border-0 bg-transparent p-0 backdrop:bg-[rgb(3_3_4/0.88)] backdrop:backdrop-blur-sm"
      >
        {open !== null ? (
          <div className="relative flex h-[100dvh] w-[100vw] items-center justify-center p-[clamp(16px,4vw,56px)]">
            <div className="relative h-full w-full">
              <Image
                src={images[open]!.src}
                alt={`${title}: ${images[open]!.alt}`}
                fill
                sizes="92vw"
                className="object-contain"
                priority
              />
            </div>

            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="Close preview"
              className="absolute right-[clamp(12px,3vw,28px)] top-[clamp(12px,3vw,28px)] flex size-10 items-center justify-center rounded-pill border border-line bg-[rgb(10_10_12/0.7)] text-[18px] leading-none text-ink backdrop-blur-sm transition-colors hover:border-line-strong hover:bg-glass-hover"
            >
              <span aria-hidden="true">✕</span>
            </button>

            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous image"
                  className="absolute left-[clamp(8px,2vw,24px)] top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-pill border border-line bg-[rgb(10_10_12/0.7)] text-[18px] leading-none text-ink backdrop-blur-sm transition-colors hover:border-line-strong hover:bg-glass-hover"
                >
                  <span aria-hidden="true">‹</span>
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next image"
                  className="absolute right-[clamp(8px,2vw,24px)] top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-pill border border-line bg-[rgb(10_10_12/0.7)] text-[18px] leading-none text-ink backdrop-blur-sm transition-colors hover:border-line-strong hover:bg-glass-hover"
                >
                  <span aria-hidden="true">›</span>
                </button>

                <p
                  aria-live="polite"
                  className="absolute bottom-[clamp(12px,3vw,28px)] left-1/2 m-0 -translate-x-1/2 rounded-pill border border-line bg-[rgb(10_10_12/0.7)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted backdrop-blur-sm"
                >
                  {open + 1} / {images.length}
                </p>
              </>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </>
  );
}

import Image from "next/image";

import type { Award } from "@portfolio/shared";

import { Reveal } from "@/components/ui/Reveal";
import { Spotlight } from "@/components/ui/Spotlight";
import { cn } from "@/lib/cn";

import { SectionHeader, SectionTitle } from "./SectionHeader";

/**
 * Full-width rows rather than the card grid this used to be.
 *
 * The grid was right while an award was a one-line claim. One of them now
 * carries a certificate and two photographs, and a 260px card has nowhere to
 * put them, so an award with images takes the whole width: text on the left,
 * the evidence beside it. Awards without images keep the compact shape and
 * simply do not reserve the space.
 */

/** Shared glass recipe, matching the project showcase's frames. */
const frame =
  "relative overflow-hidden rounded-tile border border-[rgb(255_255_255/0.09)] bg-[rgb(255_255_255/0.03)]";

/**
 * Two stacked frames on the left, one full-height frame on the right.
 *
 * The right-hand image is a portrait certificate, so it gets its own column
 * rather than a third row: dropped into the stack it would either be cropped
 * to a letterbox or force the row absurdly tall.
 *
 * `object-contain` throughout, not `cover`. These are documents and
 * photographs of a person, and cropping a certificate to fill a box cuts off
 * the part that makes it evidence.
 */
function AwardMedia({ images, title }: { images: string[]; title: string }) {
  const [first, second, third] = images;
  if (!first) return null;

  return (
    <div className="grid w-full flex-[1_1_340px] grid-cols-2 grid-rows-2 gap-[10px] sm:gap-3">
      <div className={cn(frame, "col-start-1 row-start-1 aspect-[4/3]")}>
        <Image
          src={first}
          alt={`${title}: award presentation on stage`}
          fill
          sizes="(max-width: 900px) 45vw, 260px"
          className="object-contain"
        />
      </div>

      {second ? (
        <div className={cn(frame, "col-start-1 row-start-2 aspect-[4/3]")}>
          <Image
            src={second}
            alt={`${title}: the award`}
            fill
            sizes="(max-width: 900px) 45vw, 260px"
            className="object-contain"
          />
        </div>
      ) : null}

      {third ? (
        // Spans both rows, so the certificate is readable rather than a stamp.
        <div className={cn(frame, "col-start-2 row-span-2 row-start-1")}>
          <Image
            src={third}
            alt={`${title}: certificate`}
            fill
            sizes="(max-width: 900px) 45vw, 260px"
            className="object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}

export function AwardsSection({ awards }: { awards: Award[] }) {
  if (awards.length === 0) return null;

  return (
    <Reveal as="section" id="awards" className="scroll-mt-16 pb-2 pt-[104px]">
      <SectionHeader index="07" label="ACHIEVEMENTS & AWARDS" />
      <SectionTitle>Achievements &amp; awards</SectionTitle>

      <ul className="m-0 flex list-none flex-col gap-[14px] p-0">
        {awards.map((award, index) => (
          <li
            key={award.id}
            data-reveal=""
            style={{ "--reveal-index": index } as React.CSSProperties}
          >
            <Spotlight className="h-full rounded-card">
              <article
                className={cn(
                  "flex flex-wrap items-center gap-x-10 gap-y-7 rounded-card border border-[rgb(255_255_255/0.075)] bg-gradient-to-br from-[rgb(34_36_41/0.66)] to-[rgb(14_15_17/0.52)] px-[clamp(20px,3vw,30px)] py-[clamp(20px,2.6vw,26px)] shadow-card backdrop-blur-[var(--glass-blur)] transition-all duration-300 hover:border-[rgb(255_255_255/0.2)]",
                  // Only the text-only rows lift on hover. Nudging a row that
                  // holds photographs makes the images look interactive when
                  // they are not.
                  award.images.length > 0 ? "" : "hover:-translate-y-1",
                )}
              >
                <div className="flex-[2_1_320px]">
                  {/* Undated awards drop the eyebrow rather than invent a year. */}
                  {award.date ? (
                    <p className="m-0 font-mono text-[9.5px] font-medium uppercase leading-none tracking-[0.22em] text-ink-ghost">
                      {award.date}
                    </p>
                  ) : null}

                  <h3 className="m-0 mt-[14px] first:mt-0 font-display text-[clamp(17px,1.7vw,20px)] font-semibold leading-[1.28] tracking-[-0.018em] text-ink">
                    {award.title}
                  </h3>

                  <p className="m-0 mt-[10px] text-[12.5px] font-medium leading-[1.45] text-ink-faint">
                    {award.issuer}
                  </p>

                  {award.summary ? (
                    <p className="m-0 mt-[14px] max-w-[52ch] text-[13px] leading-[1.6] text-ink-muted">
                      {award.summary}
                    </p>
                  ) : null}
                </div>

                <AwardMedia images={award.images} title={award.title} />
              </article>
            </Spotlight>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

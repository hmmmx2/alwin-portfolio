import type { Award } from "@portfolio/shared";

import { AwardGallery } from "@/components/ui/AwardGallery";
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

                <AwardGallery images={award.images} title={award.title} />
              </article>
            </Spotlight>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

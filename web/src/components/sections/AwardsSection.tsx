import type { Award } from "@portfolio/shared";

import { Reveal } from "@/components/ui/Reveal";
import { Spotlight } from "@/components/ui/Spotlight";

import { SectionHeader, SectionTitle } from "./SectionHeader";

/**
 * A card grid rather than a timeline: awards are usually one-liners, and a
 * timeline would give each of them a whole row of vertical space. Narrower
 * track than the projects grid since there is no media to hold.
 */
export function AwardsSection({ awards }: { awards: Award[] }) {
  if (awards.length === 0) return null;

  return (
    <Reveal as="section" id="awards" className="scroll-mt-16 pb-2 pt-[104px]">
      <SectionHeader index="07" label="ACHIEVEMENTS & AWARDS" />
      <SectionTitle>Achievements &amp; awards</SectionTitle>

      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-[14px] p-0">
        {awards.map((award, index) => (
          <li
            key={award.id}
            data-reveal=""
            style={{ "--reveal-index": index } as React.CSSProperties}
          >
            <Spotlight className="h-full rounded-card">
              <article className="flex h-full flex-col rounded-card border border-[rgb(255_255_255/0.075)] bg-gradient-to-br from-[rgb(34_36_41/0.66)] to-[rgb(14_15_17/0.52)] px-[22px] pb-[22px] pt-[20px] shadow-card backdrop-blur-[var(--glass-blur)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgb(255_255_255/0.2)]">
                <p className="m-0 font-mono text-[9.5px] font-medium uppercase leading-none tracking-[0.22em] text-ink-ghost">
                  {award.date}
                </p>

                <h3 className="m-0 mt-[14px] font-display text-[17px] font-semibold leading-[1.28] tracking-[-0.018em] text-ink">
                  {award.title}
                </h3>

                <p className="m-0 mt-[10px] text-[12.5px] font-medium leading-[1.45] text-ink-faint">
                  {award.issuer}
                </p>

                {award.summary ? (
                  <p className="m-0 mt-[14px] text-[13px] leading-[1.6] text-ink-muted">
                    {award.summary}
                  </p>
                ) : null}
              </article>
            </Spotlight>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

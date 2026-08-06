import type { EducationEntry } from "@portfolio/shared";

import { Reveal } from "@/components/ui/Reveal";

import { SectionHeader, SectionTitle } from "./SectionHeader";

/**
 * Reuses the Experience timeline — same spine, dots and column rhythm — so the
 * two histories read as one continuous thread down the page rather than two
 * unrelated treatments.
 */
export function EducationSection({ entries }: { entries: EducationEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <Reveal as="section" id="education" className="scroll-mt-16 pb-2 pt-[104px]">
      <SectionHeader index="06" label="EDUCATION" />
      <SectionTitle>Education</SectionTitle>

      <ol className="relative m-0 flex list-none flex-col p-0 pl-[34px]">
        {/* Draws itself downward as the section scrolls past. */}
        <div
          aria-hidden="true"
          className="timeline-spine absolute left-0 top-0 h-full w-px bg-[rgb(255_255_255/0.09)]"
        />

        {entries.map((entry) => (
          <li
            key={entry.id}
            className="relative flex flex-wrap items-start gap-x-6 gap-y-[10px] border-b border-[rgb(255_255_255/0.06)] py-[26px] last:border-b-0"
          >
            <span
              aria-hidden="true"
              className={
                entry.current
                  ? "absolute -left-[39px] top-8 size-[9px] rounded-full bg-ink shadow-[0_0_0_4px_rgb(244_245_246/0.08)]"
                  : "absolute -left-[39px] top-8 size-[9px] rounded-full bg-[rgb(244_245_246/0.35)]"
              }
            />

            <div className="flex-[1_1_300px]">
              <h3 className="m-0 font-display text-xl font-semibold leading-[1.25] tracking-[-0.015em] text-ink">
                {entry.degree}
              </h3>
              <p className="m-0 mt-[5px] text-[13px] font-medium leading-[1.4] text-ink-muted">
                {entry.institution}
              </p>
              {entry.summary ? (
                <p className="m-0 mt-3 max-w-[60ch] text-[13.5px] leading-[1.6] text-ink-muted">
                  {entry.summary}
                </p>
              ) : null}
            </div>

            <p className="m-0 ml-auto text-right font-mono text-[11.5px] leading-[1.6] tracking-[0.06em] text-ink-faint">
              {entry.period}
              {entry.note ? (
                <>
                  <br />
                  {entry.note}
                </>
              ) : null}
            </p>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

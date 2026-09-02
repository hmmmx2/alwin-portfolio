import Link from "next/link";

import type { ExperienceEntry } from "@portfolio/shared";

import { Reveal } from "@/components/ui/Reveal";
import { ArrowRightIcon } from "@/components/ui/icons";

import { SectionHeader, SectionTitle } from "./SectionHeader";

/**
 * The home page's experience block.
 *
 * `limit` trims it to the most recent roles and `moreHref` appends a link to
 * the full page — highlights and tech deliberately don't render here, so the
 * teaser stays a teaser and /experience is worth visiting.
 */
export function ExperienceSection({
  entries,
  limit,
  moreHref,
}: {
  entries: ExperienceEntry[];
  limit?: number;
  moreHref?: string;
}) {
  const shown = typeof limit === "number" ? entries.slice(0, limit) : entries;
  const hidden = entries.length - shown.length;

  return (
    <Reveal as="section" id="experience" className="scroll-mt-16 pb-2 pt-[104px]">
      <SectionHeader index="03" label="EXPERIENCE" />
      <SectionTitle>Work experience</SectionTitle>

      <ol className="relative m-0 flex list-none flex-col p-0 pl-[34px]">
        {/* The spine draws itself downward as the section scrolls past. */}
        <div
          aria-hidden="true"
          className="timeline-spine absolute left-0 top-0 h-full w-px bg-[rgb(255_255_255/0.09)]"
        />

        {shown.map((entry) => (
          <li
            key={entry.id}
            className="relative flex flex-wrap items-start gap-x-6 gap-y-[10px] border-b border-[rgb(255_255_255/0.06)] py-[26px]"
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
                {entry.title}
              </h3>
              <p className="m-0 mt-[5px] text-[13px] font-medium leading-[1.4] text-ink-muted">
                {entry.organisation}
              </p>
              {entry.location ? (
                <p className="m-0 mt-[3px] font-mono text-[11px] leading-[1.4] tracking-[0.04em] text-ink-faint">
                  {entry.location}
                </p>
              ) : null}
              <p className="m-0 mt-3 max-w-[60ch] text-[13.5px] leading-[1.6] text-ink-muted">
                {entry.summary}
              </p>
            </div>

            <p className="m-0 ml-auto text-right font-mono text-[11.5px] leading-[1.6] tracking-[0.06em] text-ink-faint">
              {entry.period}
              <br />
              {entry.kind}
            </p>
          </li>
        ))}
      </ol>

      {moreHref ? (
        <div className="mt-7 flex justify-end">
          <Link
            href={moreHref}
            className="group inline-flex items-center gap-[10px] rounded-pill border border-line bg-glass px-[18px] py-[11px] font-mono text-[12px] uppercase tracking-[0.1em] text-ink-muted transition-colors duration-300 hover:border-line-strong hover:bg-glass-hover hover:text-ink-bright"
          >
            Full experience
            {hidden > 0 ? (
              <span className="text-ink-ghost">
                (+{hidden} {hidden === 1 ? "role" : "roles"})
              </span>
            ) : null}
            <ArrowRightIcon className="size-[13px] transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      ) : null}
    </Reveal>
  );
}

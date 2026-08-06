import Link from "next/link";

import type { ResearchPaper } from "@portfolio/shared";

import { Reveal } from "@/components/ui/Reveal";
import { ArrowRightIcon, ExternalIcon } from "@/components/ui/icons";

import { SectionHeader, SectionTitle } from "./SectionHeader";

/**
 * The home page's research block.
 *
 * `limit` trims it and `moreHref` appends a link to the full page — same two
 * props `ExperienceSection` and `ProjectsSection` take, so all three sections
 * behave identically on the home page.
 */
export function ResearchSection({
  papers,
  limit,
  moreHref,
}: {
  papers: ResearchPaper[];
  limit?: number;
  moreHref?: string;
}) {
  const shown = typeof limit === "number" ? papers.slice(0, limit) : papers;
  const hidden = papers.length - shown.length;

  return (
    <Reveal as="section" id="research" className="scroll-mt-16 pb-2 pt-[104px]">
      <SectionHeader index="04" label="RESEARCH" />
      <SectionTitle>Research papers</SectionTitle>

      <ol className="m-0 flex list-none flex-col border-b border-line p-0">
        {shown.map((paper, index) => (
          <li
            key={paper.id}
            className="flex flex-wrap items-start gap-x-[22px] gap-y-[14px] border-t border-line px-[6px] py-7"
          >
            <span aria-hidden="true" className="font-mono text-[11.5px] leading-[1.6] text-ink-ghost">
              [{String(index + 1).padStart(2, "0")}]
            </span>

            <div className="flex-[1_1_320px]">
              <h3 className="m-0 max-w-[52ch] font-display text-[18px] font-medium leading-[1.35] tracking-[-0.015em] text-ink">
                {paper.title}
              </h3>
              <p className="m-0 mt-2 font-mono text-[11px] uppercase leading-[1.5] tracking-[0.09em] text-ink-faint">
                {paper.venue}
              </p>
              <p className="m-0 mt-3 max-w-[64ch] text-[13.5px] leading-[1.65] text-ink-muted">
                {paper.abstract}
              </p>
            </div>

            <a
              href={paper.url}
              className="ml-auto inline-flex items-center gap-[9px] whitespace-nowrap rounded-tile border border-[rgb(255_255_255/0.09)] bg-gradient-to-br from-[rgb(36_38_43/0.6)] to-[rgb(15_16_18/0.48)] px-[15px] py-[10px] font-mono text-xs font-medium leading-none tracking-[0.04em] text-ink-soft shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] backdrop-blur-[var(--glass-blur)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgb(255_255_255/0.26)] hover:text-ink-bright"
            >
              <span className="sr-only">Read </span>arXiv
              <span className="sr-only"> — {paper.title}</span>
              <ExternalIcon className="size-3" />
            </a>
          </li>
        ))}
      </ol>

      {moreHref ? (
        <div className="mt-7 flex justify-end">
          <Link
            href={moreHref}
            className="group inline-flex items-center gap-[10px] rounded-pill border border-line bg-glass px-[18px] py-[11px] font-mono text-[12px] uppercase tracking-[0.1em] text-ink-muted transition-colors duration-300 hover:border-line-strong hover:bg-glass-hover hover:text-ink-bright"
          >
            All papers
            {hidden > 0 ? (
              <span className="text-ink-ghost">
                (+{hidden} {hidden === 1 ? "paper" : "papers"})
              </span>
            ) : null}
            <ArrowRightIcon className="size-[13px] transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      ) : null}
    </Reveal>
  );
}

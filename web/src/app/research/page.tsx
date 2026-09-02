import type { Metadata } from "next";

import { PaperList } from "@/components/research/PaperList";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { getContent } from "@/lib/api";

export const metadata: Metadata = {
  // The layout's `%s — Alwin` template supplies the rest.
  title: "Research",
  description:
    "Published papers on parameter-efficient adaptation, retrieval faithfulness and instruction data.",
};

/**
 * No `<Reveal>` here, matching /projects — and animating a panel that contains
 * a PDF iframe is visibly glitchy.
 */
export default async function ResearchPage() {
  const { research } = getContent();

  // Derived rather than written down, so the line can't go stale when a paper
  // is added.
  // `filter` before `map`, not after: an unpublished paper has no date at all,
  // and slicing null throws rather than producing something to filter out.
  const years = research
    .map((paper) => paper.publishedAt)
    .filter((date): date is string => Boolean(date))
    .map((date) => date.slice(0, 4))
    .sort();
  const span =
    years.length > 0 && years[0] !== years[years.length - 1]
      ? `${years[0]}–${years[years.length - 1]}`
      : years[0];

  return (
    <main
      id="main"
      /*
       * `scroll-padding-top` in globals.css only covers anchor jumps, so the
       * page has to reserve the fixed nav's height itself on first paint.
       */
      className="relative mx-auto box-border w-full max-w-[1240px] px-[clamp(18px,4vw,56px)] pb-28 pt-[clamp(120px,16vh,168px)]"
    >
      <header className="pb-2">
        <SectionHeader index="01" label="RESEARCH" />
        <h1 className="m-0 max-w-[18ch] font-display text-[clamp(34px,5.4vw,64px)] font-semibold leading-[1.02] tracking-[-0.035em] text-ink">
          Research papers
        </h1>
        <p className="m-0 mt-6 max-w-[58ch] text-[15px] leading-[1.7] text-ink-muted">
          Work on parameter-efficient adaptation, retrieval faithfulness and the
          data side of instruction tuning. Each paper is readable in place.
        </p>
        <p className="m-0 mt-7 font-mono text-[11px] uppercase leading-none tracking-[0.14em] text-ink-ghost">
          {research.length} {research.length === 1 ? "paper" : "papers"}
          {span ? ` · ${span}` : ""}
        </p>
      </header>

      <section aria-label="All papers" className="pt-20">
        <PaperList papers={research} />
      </section>
    </main>
  );
}

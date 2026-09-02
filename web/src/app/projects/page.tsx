import type { Metadata } from "next";

import { ProjectShowcase } from "@/components/projects/ProjectShowcase";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { getContent } from "@/lib/api";

export const metadata: Metadata = {
  // The layout's `%s — Alwin` template supplies the rest.
  title: "Projects",
  description:
    "Open-source work, research tooling and experiments — what each one does and the stack behind it.",
};

/**
 * No `<Reveal>` anywhere on this page, deliberately.
 *
 * Reveal is opt-in via a `data-reveal` attribute, so emitting none of them
 * means `RevealObserver` never picks these elements up and nothing fades or
 * rises as you scroll. The other two routes are unaffected.
 */
export default async function ProjectsPage() {
  const { projects, stack } = getContent();

  // Derived from the data rather than written down, so the line can't go stale
  // when a project is added or recategorised.
  const categories = [...new Set(projects.map((project) => project.category))];

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
        <SectionHeader index="01" label="PROJECTS" />
        <h1 className="m-0 max-w-[18ch] font-display text-[clamp(34px,5.4vw,64px)] font-semibold leading-[1.02] tracking-[-0.035em] text-ink">
          Things I&rsquo;ve built
        </h1>
        <p className="m-0 mt-6 max-w-[58ch] text-[15px] leading-[1.7] text-ink-muted">
          Open-source libraries, research tooling and the occasional experiment.
          Each one lists what it does and the stack behind it.
        </p>
        <p className="m-0 mt-7 font-mono text-[11px] uppercase leading-none tracking-[0.14em] text-ink-ghost">
          {projects.length} {projects.length === 1 ? "project" : "projects"}
          {categories.length > 0 ? ` · ${categories.join(" · ")}` : ""}
        </p>
      </header>

      <section aria-label="All projects" className="pt-20">
        <ProjectShowcase projects={projects} stack={stack} />
      </section>
    </main>
  );
}

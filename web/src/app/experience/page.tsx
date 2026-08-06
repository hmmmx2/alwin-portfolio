import type { Metadata } from "next";

import { ExperienceTimeline } from "@/components/experience/ExperienceTimeline";
import { ResumeCard } from "@/components/experience/ResumeCard";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { getContent, getResumeMeta } from "@/lib/api";

export const metadata: Metadata = {
  // The layout's `%s — Alwin` template supplies the rest.
  title: "Experience",
  description:
    "Work history — roles, what each one shipped, and the stack behind them.",
};

export default async function ExperiencePage() {
  const [content, resume] = await Promise.all([getContent(), getResumeMeta()]);
  const { experience, stack, profile } = content;

  return (
    <main
      id="main"
      /*
       * `scroll-padding-top` in globals.css only covers anchor jumps, so the
       * page has to reserve the fixed nav's height itself on first paint.
       */
      className="relative mx-auto box-border w-full max-w-[1240px] px-[clamp(18px,4vw,56px)] pb-24 pt-[clamp(120px,16vh,168px)]"
    >
      <Reveal as="header" className="pb-2">
        <SectionHeader index="01" label="EXPERIENCE" />
        <h1 className="m-0 max-w-[18ch] font-display text-[clamp(34px,5.4vw,64px)] font-semibold leading-[1.02] tracking-[-0.035em] text-ink">
          Work experience
        </h1>
        <p className="m-0 mt-6 max-w-[58ch] text-[15px] leading-[1.7] text-ink-muted">
          {profile.role}. The roles below are in reverse order, each with what it
          actually shipped and the stack behind it.
        </p>
      </Reveal>

      <Reveal as="section" aria-label="Roles" className="pt-14">
        <ExperienceTimeline entries={experience} stack={stack} />
      </Reveal>

      <Reveal as="section" aria-label="Resume" className="pt-16">
        <ResumeCard resume={resume} />
      </Reveal>
    </main>
  );
}

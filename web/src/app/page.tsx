import { Hero } from "@/components/hero/Hero";
import { AwardsSection } from "@/components/sections/AwardsSection";
import { CertificationsSection } from "@/components/sections/CertificationsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { EducationSection } from "@/components/sections/EducationSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { ResearchSection } from "@/components/sections/ResearchSection";
import { StackSection } from "@/components/sections/StackSection";
import { getContent } from "@/lib/api";

/**
 * A Server Component. The nav, footer and reveal observer come from the layout;
 * the only client islands on this page are the wave field, the card spotlights
 * and the contact form.
 */
export default async function HomePage() {
  const content = getContent();

  return (
    <>
      <Hero profile={content.profile} />

      <main
        id="main"
        className="relative mx-auto box-border w-full max-w-[1240px] px-[clamp(18px,4vw,56px)]"
      >
        <StackSection items={content.stack} />
        {/*
          A teaser, not the whole history — the full timeline is its own page
          now. Keeps `id="experience"` so the footer anchor still lands here.
        */}
        <ExperienceSection entries={content.experience} limit={2} moreHref="/experience" />
        {/* Teaser as well — the full grid, with tech tags and CTAs, is /projects. */}
        <ProjectsSection projects={content.projects} limit={2} moreHref="/projects" />
        <ResearchSection papers={content.research} limit={2} moreHref="/research" />
        <EducationSection entries={content.education} />
        <AwardsSection awards={content.awards} />
        <CertificationsSection items={content.certifications} />
        <ContactSection profile={content.profile} />
      </main>
    </>
  );
}

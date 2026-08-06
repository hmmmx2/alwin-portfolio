import Link from "next/link";

import type { Project } from "@portfolio/shared";

import { BrandIcon } from "@/components/ui/BrandIcon";
import { MediaSlot } from "@/components/ui/MediaSlot";
import { Reveal } from "@/components/ui/Reveal";
import { Spotlight } from "@/components/ui/Spotlight";
import { ArrowRightIcon, ExternalIcon } from "@/components/ui/icons";

import { SectionHeader, SectionTitle } from "./SectionHeader";

const iconLink =
  "flex size-8 items-center justify-center rounded-[10px] border border-[rgb(255_255_255/0.1)] text-ink-faint transition-colors duration-300 hover:border-[rgb(255_255_255/0.26)] hover:bg-[rgb(255_255_255/0.05)] hover:text-ink-bright";

/**
 * The home page's project block.
 *
 * `limit` trims it to the first few and `moreHref` appends a link to the full
 * page — tech tags and labelled CTAs deliberately don't render here, so the
 * teaser stays a teaser and /projects is worth visiting. Same two props
 * `ExperienceSection` takes, so the two sections behave identically.
 */
export function ProjectsSection({
  projects,
  limit,
  moreHref,
}: {
  projects: Project[];
  limit?: number;
  moreHref?: string;
}) {
  const shown = typeof limit === "number" ? projects.slice(0, limit) : projects;
  const hidden = projects.length - shown.length;

  return (
    <Reveal as="section" id="projects" className="scroll-mt-16 pb-2 pt-[104px]">
      <SectionHeader index="05" label="PROJECTS" />
      <SectionTitle>Projects</SectionTitle>

      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-[18px] p-0">
        {shown.map((project, index) => (
          <li
            key={project.id}
            data-reveal=""
            style={{ "--reveal-index": index } as React.CSSProperties}
          >
            <Spotlight className="h-full rounded-card">
              <article className="flex h-full flex-col overflow-hidden rounded-card border border-[rgb(255_255_255/0.075)] bg-gradient-to-br from-[rgb(34_36_41/0.66)] to-[rgb(14_15_17/0.52)] shadow-card backdrop-blur-[var(--glass-blur)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgb(255_255_255/0.2)]">
                <MediaSlot
                  // First screenshot doubles as the card thumbnail, so a card
                  // image and the showcase mosaic can't drift apart.
                  src={project.images[0] ?? null}
                  alt={project.images[0] ? `${project.name} screenshot` : ""}
                  label="Project thumbnail"
                  className="aspect-video w-full border-b border-[rgb(255_255_255/0.07)]"
                />

                <div className="flex flex-1 flex-col px-6 pb-5 pt-[22px]">
                  <p className="m-0 font-mono text-[9.5px] font-medium uppercase leading-none tracking-[0.22em] text-ink-ghost">
                    {project.category}
                  </p>
                  <h3 className="m-0 mt-[14px] font-display text-[22px] font-semibold leading-[1.15] tracking-[-0.025em] text-ink">
                    {project.name}
                  </h3>
                  <p className="m-0 mt-[10px] max-w-[46ch] text-[13.5px] leading-[1.6] text-ink-muted">
                    {project.summary}
                  </p>

                  <div className="mt-auto flex gap-[9px] pt-5">
                    {project.repoUrl ? (
                      <a
                        href={project.repoUrl}
                        aria-label={`${project.name} source on GitHub`}
                        className={iconLink}
                      >
                        <BrandIcon name="github" className="size-[15px]" />
                      </a>
                    ) : null}
                    {project.demoUrl ? (
                      <a
                        href={project.demoUrl}
                        aria-label={`${project.name} live demo`}
                        className={iconLink}
                      >
                        <ExternalIcon className="size-[13px]" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            </Spotlight>
          </li>
        ))}
      </ul>

      {moreHref ? (
        <div className="mt-7 flex justify-end">
          <Link
            href={moreHref}
            className="group inline-flex items-center gap-[10px] rounded-pill border border-line bg-glass px-[18px] py-[11px] font-mono text-[12px] uppercase tracking-[0.1em] text-ink-muted transition-colors duration-300 hover:border-line-strong hover:bg-glass-hover hover:text-ink-bright"
          >
            All projects
            {hidden > 0 ? <span className="text-ink-ghost">(+{hidden})</span> : null}
            <ArrowRightIcon className="size-[13px] transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      ) : null}
    </Reveal>
  );
}

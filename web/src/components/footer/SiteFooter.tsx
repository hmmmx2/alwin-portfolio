import Link from "next/link";

import type { ContentPayload, ResumeMeta } from "@portfolio/shared";

import { BrandIcon } from "@/components/ui/BrandIcon";
import { MailIcon } from "@/components/ui/icons";
import { resumeUrl } from "@/lib/api";

import { Wordmark } from "./Wordmark";

const columnHeading =
  "mb-4 font-mono text-[9.5px] font-medium uppercase leading-none tracking-[0.24em] text-ink-ghost";
const columnLink = "text-[13px] leading-[1.3] text-ink-muted transition-colors hover:text-ink";
const socialTile =
  "flex size-8 items-center justify-center rounded-[9px] border border-[rgb(255_255_255/0.1)] text-ink-muted transition-colors duration-300 hover:border-[rgb(255_255_255/0.26)] hover:bg-[rgb(255_255_255/0.05)] hover:text-ink-bright";

export function SiteFooter({
  content,
  resume,
}: {
  content: ContentPayload;
  resume: ResumeMeta;
}) {
  const { profile, research, projects } = content;
  const linkedin = profile.socials.find((social) => social.kind === "linkedin");
  const github = profile.socials.find((social) => social.kind === "github");

  return (
    <footer className="relative mx-auto box-border w-full max-w-[1240px] px-[clamp(18px,4vw,56px)]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-8 pb-12 pt-14">
        {/*
          Root-relative, not bare `#hash`. The footer renders on every route now,
          and a bare anchor would resolve against whichever page you are on.
        */}
        <nav aria-label="Sections">
          <h2 className={columnHeading}>Sections</h2>
          <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
            {[
              ["/#about", "About"],
              ["/#stack", "Tech stack"],
              ["/experience", "Experience"],
              ["/projects", "Projects"],
              ["/research", "Research"],
              ["/#education", "Education"],
              ["/#certifications", "Certifications"],
              ["/#awards", "Achievements"],
              ["/#contact", "Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href!} className={columnLink}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Research">
          <h2 className={columnHeading}>Research</h2>
          <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
            {research.slice(0, 3).map((paper) => (
              <li key={paper.id}>
                <Link href="/research" className={columnLink}>
                  {paper.title.split(":")[0]}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/#research" className={columnLink}>
                All papers
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Projects">
          <h2 className={columnHeading}>Projects</h2>
          <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
            {projects.map((project) => (
              <li key={project.id}>
                <Link href="/projects" className={columnLink}>
                  {project.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Elsewhere">
          <h2 className={columnHeading}>Connect</h2>
          <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
            {profile.socials.map((social) => (
              <li key={social.kind}>
                <a href={social.href} className={columnLink}>
                  {social.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={resumeUrl}
                {...(resume.available
                  ? { download: resume.filename ?? "resume.pdf" }
                  : { title: "Resume PDF hasn't been published yet" })}
                className={columnLink}
              >
                Resume (PDF)
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div aria-hidden="true" className="h-px bg-[rgb(255_255_255/0.09)]" />

      <div className="flex flex-wrap items-center justify-between gap-6 pb-[30px] pt-[22px]">
        <p className="m-0 font-mono text-[11.5px] leading-none tracking-[0.06em] text-ink-faint">
          © {new Date().getFullYear()} {profile.name} • All rights reserved
        </p>
        <div className="flex items-center gap-[10px]">
          {linkedin ? (
            <a href={linkedin.href} aria-label="LinkedIn profile" className={socialTile}>
              <BrandIcon name="linkedin" className="size-[15px]" />
            </a>
          ) : null}
          {github ? (
            <a href={github.href} aria-label="GitHub profile" className={socialTile}>
              <BrandIcon name="github" className="size-[15px]" />
            </a>
          ) : null}
          <a
            href={`mailto:${profile.email}`}
            aria-label={`Email ${profile.email}`}
            className={socialTile}
          >
            <MailIcon className="size-4" />
          </a>
        </div>
      </div>

      {/* Spacing lives out here so it can't skew the wordmark's own clip box. */}
      <div className="pt-[26px]">
        <Wordmark name={profile.shortName ?? profile.name} />
      </div>
    </footer>
  );
}

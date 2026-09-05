import Link from "next/link";

import type { ContentPayload, ResumeMeta } from "@portfolio/shared";

import { BrandIcon } from "@/components/ui/BrandIcon";
import { EmailLink } from "@/components/ui/EmailLink";
import { MailIcon } from "@/components/ui/icons";
import { resumeUrl } from "@/lib/api";
import { RESUME_DOWNLOAD_NAME } from "@/lib/resume";

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
              ["/#awards", "Achievements"],
              ["/#certifications", "Certifications"],
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
            {/*
              Only worth a link when there is more than one paper: "All papers"
              under a list of exactly one reads as a bug. Points at /research,
              the same place the titles above go, rather than the home anchor.
            */}
            {research.length > 1 ? (
              <li>
                <Link href="/research" className={columnLink}>
                  All papers
                </Link>
              </li>
            ) : null}
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
                  ? { download: resume.filename ?? RESUME_DOWNLOAD_NAME }
                  : { title: "CV PDF hasn't been published yet" })}
                className={columnLink}
              >
                CV (PDF)
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div aria-hidden="true" className="h-px bg-[rgb(255_255_255/0.09)]" />

      <div className="flex flex-wrap items-center justify-between gap-6 pb-[30px] pt-[22px]">
        <div className="flex flex-col gap-[10px]">
          {/*
            Above the copyright, not below it: someone who has scrolled the
            whole page is usually looking for exactly this, and a copyright
            notice is a weak last word.
          */}
          {profile.status ? (
            <p className="m-0 flex items-center gap-[9px] font-mono text-[11.5px] leading-none tracking-[0.04em] text-ink-muted">
              <span
                aria-hidden="true"
                className="inline-block size-[7px] shrink-0 rounded-full bg-accent"
              />
              {profile.status}
            </p>
          ) : null}
          <p className="m-0 font-mono text-[11.5px] leading-none tracking-[0.06em] text-ink-faint">
            © {new Date().getFullYear()} {profile.name} • All rights reserved
          </p>
        </div>
        <div className="flex items-center gap-[10px]">
          {/*
            The home page runs to nine sections and two videos, so the way back
            is a long scroll. `#top` already exists as an id.
          */}
          <Link
            href="/#top"
            className="mr-1 inline-flex items-center gap-[7px] font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted transition-colors hover:text-ink-bright"
          >
            <span aria-hidden="true">↑</span>
            Top
          </Link>
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
          <EmailLink email={profile.email} className={socialTile}>
            <MailIcon className="size-4" />
            <span className="sr-only">Email {profile.email}</span>
          </EmailLink>
        </div>
      </div>

      {/* Spacing lives out here so it can't skew the wordmark's own clip box. */}
      <div className="pt-[26px]">
        <Wordmark name={profile.shortName ?? profile.name} />
      </div>
    </footer>
  );
}

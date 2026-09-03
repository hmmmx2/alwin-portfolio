import Image from "next/image";

import type { Project, StackItem } from "@portfolio/shared";

import { BrandIcon } from "@/components/ui/BrandIcon";
import { ProjectVideo } from "@/components/ui/ProjectVideo";
import { ExternalIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/**
 * One large showcase row per project — text on one side, screenshots on the
 * other, alternating down the page.
 *
 * Deliberately outside the reveal system: the page emits no `data-reveal`, so
 * `RevealObserver` never sees these rows and nothing fades or rises on scroll.
 */

const primaryCta =
  "inline-flex items-center gap-[9px] rounded-pill bg-ink px-[20px] py-[12px] font-mono text-[11.5px] font-semibold uppercase leading-none tracking-[0.08em] text-void transition-all duration-200 hover:-translate-y-px hover:shadow-[0_12px_30px_rgb(255_255_255/0.14)]";

const secondaryCta =
  "inline-flex items-center gap-[9px] rounded-pill border border-line bg-glass px-[20px] py-[12px] font-mono text-[11.5px] font-semibold uppercase leading-none tracking-[0.08em] text-ink-muted transition-all duration-200 hover:-translate-y-px hover:border-line-strong hover:bg-glass-hover hover:text-ink-bright";

/** Shared glass recipe for anything holding a screenshot. */
const frame =
  "relative overflow-hidden rounded-card border border-line bg-gradient-to-br from-[rgb(34_36_41/0.66)] to-[rgb(14_15_17/0.52)] backdrop-blur-[var(--glass-blur)]";

/**
 * The reference's three-frame mosaic: two portrait frames stacked at a third
 * of the width, one wide frame at two thirds.
 *
 * Every project currently has an empty `images`, so in practice this renders
 * the single-panel fallback — three labelled empty boxes per row would read as
 * a broken page rather than a design.
 */
function ProjectMedia({ project }: { project: Project }) {
  const [first, second, third] = project.images;

  /*
   * A recording outranks the screenshots: it is the only thing on the page that
   * shows the project running rather than describing it.
   *
   * Held at the video's own aspect ratio instead of the row's 16/11, and
   * `contain` rather than `cover` -- the frame is dense product UI, and
   * cropping it to fit a grid would throw away the evidence.
   */
  if (project.video) {
    const { src, poster, caption, width, height } = project.video;
    return (
      <ProjectVideo
        src={src}
        poster={poster}
        label={`Screen recording of ${project.name} running`}
        caption={caption || undefined}
        fit="contain"
        className={cn(frame, "shadow-panel")}
        // Inline, not a Tailwind class: the ratio comes from the data, so a
        // differently-shaped recording on another project still reserves the
        // right box.
        style={{ aspectRatio: `${width} / ${height}` }}
      />
    );
  }

  if (!first) {
    return (
      <div className={cn(frame, "flex aspect-[16/11] items-center justify-center shadow-panel")}>
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.03) 0 1px, transparent 1px 11px)",
          }}
        />
        <span className="relative font-mono text-[10px] uppercase tracking-[0.22em] text-ink-ghost">
          Screenshots coming soon
        </span>
      </div>
    );
  }

  // A single screenshot fills the panel; the mosaic needs the wide one plus at
  // least one portrait beside it.
  if (!second) {
    return (
      <div className={cn(frame, "aspect-[16/11] shadow-panel")}>
        <Image
          src={first}
          alt={`${project.name} screenshot`}
          fill
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="grid aspect-[16/11] grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3">
      <div className="grid grid-rows-2 gap-3">
        {[second, third].map((src, index) =>
          src ? (
            <div key={src} className={cn(frame, "shadow-card")}>
              <Image
                src={src}
                alt={`${project.name} screenshot ${index + 2}`}
                fill
                sizes="(max-width: 1024px) 33vw, 18vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div key={`empty-${index}`} className={cn(frame, "shadow-card")} />
          ),
        )}
      </div>
      <div className={cn(frame, "shadow-panel")}>
        <Image
          src={first}
          alt={`${project.name} screenshot 1`}
          fill
          sizes="(max-width: 1024px) 66vw, 37vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}

export function ProjectShowcase({
  projects,
  stack,
}: {
  projects: Project[];
  stack: StackItem[];
}) {
  const byName = new Map(stack.map((item) => [item.name.toLowerCase(), item]));

  return (
    <ol className="m-0 flex list-none flex-col gap-24 p-0 lg:gap-28">
      {projects.map((project, index) => {
        // Alternate which side the media sits on. Ordering only applies from
        // `lg` up — stacked, the text must always come first.
        const mediaFirst = index % 2 === 1;

        return (
          <li
            key={project.id}
            className={cn(
              "grid grid-cols-1 items-center gap-10 lg:gap-x-12",
              // The template mirrors along with the order, so the media keeps
              // the wide column on both sides — swapping order alone put it in
              // the 5fr slot and shrank every flipped row.
              mediaFirst
                ? "lg:grid-cols-[minmax(0,7fr)_1px_minmax(0,5fr)]"
                : "lg:grid-cols-[minmax(0,5fr)_1px_minmax(0,7fr)]",
            )}
          >
            {/*
              All three children carry an explicit order at `lg`, not just the
              ones that move. `order` drives grid *auto-placement*, not only
              visual position — leaving the media at the default while the
              divider sat at 2 placed the media into the 1px divider column and
              collapsed it to 3x2px.
            */}
            <article className={cn("flex flex-col", mediaFirst ? "lg:order-3" : "lg:order-1")}>
              <p className="m-0 font-mono text-[9.5px] font-medium uppercase leading-none tracking-[0.22em] text-ink-ghost">
                {project.category}
              </p>

              <h2 className="m-0 mt-4 font-display text-[clamp(28px,3.4vw,42px)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink">
                {project.name}
              </h2>

              <p className="m-0 mt-5 max-w-[52ch] text-[14.5px] leading-[1.75] text-ink-muted">
                {project.description || project.summary}
              </p>

              {project.highlights.length > 0 ? (
                <ul className="m-0 mt-7 flex list-none flex-col gap-[14px] p-0">
                  {project.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="relative max-w-[52ch] pl-[22px] text-[13.5px] leading-[1.65] text-ink-muted"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute left-[2px] top-[0.6em] size-[5px] rounded-full bg-[rgb(255_255_255/0.45)]"
                      />
                      {highlight}
                    </li>
                  ))}
                </ul>
              ) : null}

              {project.tech.length > 0 ? (
                <ul className="m-0 mt-8 flex list-none flex-wrap gap-[8px] p-0">
                  {project.tech.map((name) => {
                    const item = byName.get(name.toLowerCase());
                    return (
                      <li
                        key={name}
                        className="inline-flex items-center gap-[8px] rounded-pill border border-line bg-gradient-to-br from-[rgb(33_35_40/0.62)] to-[rgb(15_16_18/0.5)] py-[8px] pl-[11px] pr-[14px] shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] backdrop-blur-[var(--glass-blur)]"
                      >
                        {/* Unknown names still render — just without a mark. */}
                        {item ? (
                          <BrandIcon
                            name={item.icon}
                            color={item.color}
                            className="size-[13px] shrink-0"
                          />
                        ) : null}
                        <span className="whitespace-nowrap font-display text-[12.5px] font-medium tracking-[-0.005em] text-[#e9ebee]">
                          {name}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <div className="mt-9 flex flex-wrap gap-[10px]">
                {project.demoUrl ? (
                  <a href={project.demoUrl} className={primaryCta}>
                    Live demo
                    <ExternalIcon className="size-[12px]" />
                  </a>
                ) : null}
                {project.repoUrl ? (
                  <a href={project.repoUrl} className={secondaryCta}>
                    <BrandIcon name="github" className="size-[13px]" />
                    GitHub
                  </a>
                ) : null}
              </div>
            </article>

            {/*
              The reference's vertical rule, with a dot at the top. Static —
              this page carries no scroll-driven motion. Hidden while stacked,
              where it would read as a stray line rather than a divider.
            */}
            <div
              aria-hidden="true"
              className="relative hidden self-stretch bg-[rgb(255_255_255/0.08)] lg:order-2 lg:block"
            >
              <span className="absolute -top-1 left-1/2 size-[7px] -translate-x-1/2 rounded-full bg-[rgb(255_255_255/0.35)]" />
            </div>

            <div className={cn(mediaFirst ? "lg:order-1" : "lg:order-3")}>
              <ProjectMedia project={project} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

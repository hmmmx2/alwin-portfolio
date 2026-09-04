import type { ExperienceEntry, StackItem } from "@portfolio/shared";

import { BrandIcon } from "@/components/ui/BrandIcon";
import { Reveal } from "@/components/ui/Reveal";
import { highlightTerms } from "@/lib/highlight";

/**
 * The full work history.
 *
 * Same spine, dots and type as the home page's teaser — this is the design's
 * timeline, given room for the highlights and stack each role carries.
 */
export function ExperienceTimeline({
  entries,
  stack,
}: {
  entries: ExperienceEntry[];
  stack: StackItem[];
}) {
  // `tech` holds stack item names, so the icon slug and the design's tuned
  // brand colours stay defined in exactly one place.
  const byName = new Map(stack.map((item) => [item.name.toLowerCase(), item]));

  return (
    <ol className="relative m-0 flex list-none flex-col p-0 pl-[34px]">
      <div
        aria-hidden="true"
        className="timeline-spine absolute left-0 top-0 h-full w-px bg-[rgb(255_255_255/0.09)]"
      />

      {entries.map((entry, index) => (
        <Reveal
          as="li"
          key={entry.id}
          index={index}
          className="relative border-b border-[rgb(255_255_255/0.06)] py-9 last:border-b-0"
        >
          <span
            aria-hidden="true"
            className={
              entry.current
                ? "absolute -left-[39px] top-[46px] size-[9px] rounded-full bg-ink shadow-[0_0_0_4px_rgb(244_245_246/0.08)]"
                : "absolute -left-[39px] top-[46px] size-[9px] rounded-full bg-[rgb(244_245_246/0.35)]"
            }
          />

          <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
            <div className="flex-[1_1_320px]">
              <h2 className="m-0 font-display text-[clamp(20px,2.2vw,26px)] font-semibold leading-[1.2] tracking-[-0.02em] text-ink">
                {entry.title}
              </h2>
              <p className="m-0 mt-[6px] text-[13.5px] font-medium leading-[1.4] text-ink-muted">
                {entry.organisation}
              </p>
              {entry.location ? (
                <p className="m-0 mt-[4px] font-mono text-[11px] leading-[1.4] tracking-[0.04em] text-ink-faint">
                  {entry.location}
                </p>
              ) : null}
            </div>

            <p className="m-0 ml-auto text-right font-mono text-[11.5px] leading-[1.6] tracking-[0.06em] text-ink-faint">
              {entry.period}
              <br />
              {entry.kind}
            </p>
          </div>

          <p className="m-0 mt-4 max-w-[68ch] text-[14px] leading-[1.7] text-ink-muted">
            {highlightTerms(entry.summary)}
          </p>

          {entry.highlights.length > 0 ? (
            <ul className="m-0 mt-5 flex list-none flex-col gap-[10px] p-0">
              {entry.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="relative max-w-[68ch] pl-[22px] text-[13.5px] leading-[1.65] text-ink-muted"
                >
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-[0.62em] h-px w-[11px] bg-[rgb(255_255_255/0.28)]"
                  />
                  {highlightTerms(highlight)}
                </li>
              ))}
            </ul>
          ) : null}

          {entry.tech.length > 0 ? (
            <ul className="m-0 mt-6 flex list-none flex-wrap gap-[8px] p-0">
              {entry.tech.map((name) => {
                const item = byName.get(name.toLowerCase());
                return (
                  <li
                    key={name}
                    className="inline-flex items-center gap-[8px] rounded-pill border border-line bg-gradient-to-br from-[rgb(33_35_40/0.62)] to-[rgb(15_16_18/0.5)] py-[7px] pl-[11px] pr-[13px] shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] backdrop-blur-[var(--glass-blur)]"
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
        </Reveal>
      ))}
    </ol>
  );
}

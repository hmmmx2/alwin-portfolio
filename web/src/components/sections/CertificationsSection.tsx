import type { Certification } from "@portfolio/shared";

import { Reveal } from "@/components/ui/Reveal";
import { Spotlight } from "@/components/ui/Spotlight";

import { SectionHeader, SectionTitle } from "./SectionHeader";

/**
 * The same card grid as Achievements, one section below it.
 *
 * Kept separate rather than merged: a competition placing and a course
 * completion are different claims, and interleaving them reads as padding.
 * The issuer takes the eyebrow slot that Achievements gives to the date,
 * because a certificate is identified by who issued it.
 */
export function CertificationsSection({ items }: { items: Certification[] }) {
  if (items.length === 0) return null;

  return (
    <Reveal as="section" id="certifications" className="scroll-mt-16 pb-2 pt-[104px]">
      <SectionHeader index="07" label="CERTIFICATIONS" />
      <SectionTitle>Certifications</SectionTitle>

      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-[14px] p-0">
        {items.map((item, index) => (
          <li
            key={item.id}
            data-reveal=""
            style={{ "--reveal-index": index } as React.CSSProperties}
          >
            <Spotlight className="h-full rounded-card">
              <article className="flex h-full flex-col rounded-card border border-[rgb(255_255_255/0.075)] bg-gradient-to-br from-[rgb(34_36_41/0.66)] to-[rgb(14_15_17/0.52)] px-[22px] pb-[22px] pt-[20px] shadow-card backdrop-blur-[var(--glass-blur)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgb(255_255_255/0.2)]">
                <p className="m-0 font-mono text-[9.5px] font-medium uppercase leading-none tracking-[0.22em] text-ink-ghost">
                  {item.issuer}
                </p>

                <h3 className="m-0 mt-[14px] font-display text-[15.5px] font-semibold leading-[1.32] tracking-[-0.015em] text-ink">
                  {item.title}
                </h3>

                {/*
                  Rendered as a link only when there is somewhere to go. Every
                  entry is url-less today — the CV lists "[link]" placeholders —
                  and a credential card that looks clickable and isn't is worse
                  than a plain one.
                */}
                {item.url ? (
                  <a
                    href={item.url}
                    className="mt-auto inline-flex w-fit items-center gap-[6px] pt-[14px] font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted transition-colors hover:text-ink-bright"
                  >
                    View credential
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
              </article>
            </Spotlight>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

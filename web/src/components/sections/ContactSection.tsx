import type { Profile } from "@portfolio/shared";

import { Reveal } from "@/components/ui/Reveal";

import { ContactForm } from "./ContactForm";
import { SectionHeader } from "./SectionHeader";

export function ContactSection({ profile }: { profile: Profile }) {
  return (
    <Reveal as="section" id="contact" className="scroll-mt-16 pb-24 pt-[104px]">
      {/* 06 and 07 are Education and Achievements, added above. */}
      <SectionHeader index="08" label="CONTACT" />

      <div className="flex flex-wrap items-start gap-x-14 gap-y-10">
        <div className="flex-[1_1_260px]">
          <h2 className="m-0 font-display text-[clamp(28px,3vw,40px)] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
            Let&rsquo;s talk
          </h2>
          <p className="m-0 mt-4 max-w-[34ch] text-sm leading-[1.7] text-ink-muted">
            {profile.availability}
          </p>
          {/* Email only — the site deliberately publishes no city or timezone. */}
          <address className="mt-[26px] font-mono text-[12.5px] not-italic leading-[1.9] text-ink-muted">
            <a
              href={`mailto:${profile.email}`}
              className="transition-colors hover:text-ink-bright"
            >
              {profile.email}
            </a>
          </address>
        </div>

        <ContactForm />
      </div>
    </Reveal>
  );
}

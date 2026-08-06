import type { StackItem } from "@portfolio/shared";

import { BrandIcon } from "@/components/ui/BrandIcon";
import { Reveal } from "@/components/ui/Reveal";

import { SectionHeader, SectionTitle } from "./SectionHeader";

export function StackSection({ items }: { items: StackItem[] }) {
  return (
    <Reveal as="section" id="stack" className="scroll-mt-16 pb-2 pt-24">
      <SectionHeader index="02" label="STACK" />
      <SectionTitle>Tech stack</SectionTitle>

      <ul className="m-0 flex list-none flex-wrap gap-[10px] p-0">
        {items.map((item, index) => (
          <li
            key={item.name}
            data-reveal=""
            style={{ "--reveal-index": index } as React.CSSProperties}
            className="inline-flex items-center gap-[10px] rounded-pill border border-line bg-gradient-to-br from-[rgb(33_35_40/0.62)] to-[rgb(15_16_18/0.5)] py-[10px] pl-[13px] pr-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] backdrop-blur-[var(--glass-blur)] transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:from-[rgb(44_46_52/0.7)] hover:to-[rgb(19_20_23/0.56)]"
          >
            <BrandIcon name={item.icon} color={item.color} className="size-[17px] shrink-0" />
            <span className="whitespace-nowrap font-display text-[13.5px] font-medium tracking-[-0.005em] text-[#e9ebee]">
              {item.name}
            </span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

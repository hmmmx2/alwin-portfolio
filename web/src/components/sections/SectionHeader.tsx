/**
 * The numbered eyebrow and fading rule that opens every section.
 * The rule wipes in from the left once the section reveals (see globals.css).
 */
export function SectionHeader({ index, label }: { index: string; label: string }) {
  return (
    <div className="mb-[38px] flex items-baseline gap-4">
      <span className="font-mono text-[10px] font-medium uppercase leading-none tracking-[0.3em] text-ink-ghost">
        {index} · {label}
      </span>
      <div
        aria-hidden="true"
        className="section-rule h-px flex-1 bg-gradient-to-r from-[rgb(255_255_255/0.12)] to-transparent"
      />
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="m-0 mb-[34px] font-display text-[clamp(28px,3vw,40px)] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
      {children}
    </h2>
  );
}

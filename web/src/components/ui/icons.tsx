/**
 * The design's own line icons, transcribed from its inline SVG. Kept apart
 * from BrandIcon: these are drawn to match the UI's 1.2–1.3px stroke weight,
 * not to reproduce anyone's logo.
 */

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.2,
} as const;

export function MailIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 18 18" className={className} aria-hidden="true" {...stroke}>
      <rect x="2.2" y="4.2" width="13.6" height="9.6" rx="2" />
      <path d="M3 5.4 9 10l6-4.6" strokeLinejoin="round" />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 14 14"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
    >
      <path d="M7 2.6v7" />
      <path d="M4 7l3 2.8L10 7" />
      <path d="M2.6 11.6h8.8" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 18 18"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
    >
      <path d="M3 5.5h12" />
      <path d="M3 9h12" />
      <path d="M3 12.5h12" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 18 18"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
    >
      <path d="M4.6 4.6 13.4 13.4" />
      <path d="M13.4 4.6 4.6 13.4" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 14 14"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.6 7h8.8" />
      <path d="M8 3.6 11.4 7 8 10.4" />
    </svg>
  );
}

export function ExternalIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
    >
      <path d="M3.4 8.6 8.6 3.4" />
      <path d="M4.4 3.4h4.2v4.2" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 14 14"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/*
        Drawn on with stroke-dashoffset when the form succeeds. `pathLength`
        normalises the geometry so the dash values don't depend on the actual
        curve length.
      */}
      <path d="M2.8 7.4 5.8 10.4 11.2 4.2" pathLength={1} className="check-path" />
    </svg>
  );
}

export function SpinnerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth={1.6} opacity={0.25} />
      <path
        d="M14 8a6 6 0 0 0-6-6"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

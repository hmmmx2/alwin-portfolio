import type { ResumeMeta } from "@portfolio/shared";

import { DownloadIcon } from "@/components/ui/icons";
import { resumeUrl } from "@/lib/api";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Resume download panel.
 *
 * Driven by `/api/resume/meta` exactly as the nav button is: a real `download`
 * with the file's size and date when a PDF is published, and an honest
 * unavailable state when it isn't — rather than a CTA that 404s.
 */
export function ResumeCard({ resume }: { resume: ResumeMeta }) {
  const updated = resume.updatedAt
    ? new Date(resume.updatedAt).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
      })
    : null;

  return (
    <div className="flex flex-wrap items-center gap-x-10 gap-y-6 rounded-panel border border-[rgb(255_255_255/0.075)] bg-gradient-to-br from-[rgb(31_33_37/0.6)] to-[rgb(13_14_16/0.5)] p-[clamp(20px,3vw,32px)] shadow-panel backdrop-blur-[var(--glass-blur)]">
      <div className="flex-[1_1_280px]">
        <h2 className="m-0 font-display text-[clamp(20px,2.2vw,26px)] font-semibold leading-[1.2] tracking-[-0.02em] text-ink">
          Full resume
        </h2>
        <p className="m-0 mt-3 max-w-[52ch] text-[13.5px] leading-[1.65] text-ink-muted">
          {resume.available
            ? "The complete history as a PDF — education, publications and the roles above in full."
            : "The PDF isn't published yet. Everything on this page is current in the meantime, and the email below reaches me directly."}
        </p>

        {resume.available && (resume.bytes || updated) ? (
          <p className="m-0 mt-4 font-mono text-[11px] uppercase leading-none tracking-[0.14em] text-ink-ghost">
            PDF
            {resume.bytes ? ` · ${formatBytes(resume.bytes)}` : ""}
            {updated ? ` · Updated ${updated}` : ""}
          </p>
        ) : null}
      </div>

      {resume.available ? (
        <a
          href={resumeUrl}
          download={resume.filename ?? "resume.pdf"}
          className="inline-flex shrink-0 items-center gap-[10px] rounded-pill bg-ink px-[26px] py-[14px] font-mono text-[12.5px] font-semibold leading-none tracking-[0.04em] text-void transition-all duration-200 hover:-translate-y-px hover:shadow-[0_12px_30px_rgb(255_255_255/0.16)]"
        >
          Download resume
          <DownloadIcon className="size-[14px]" />
        </a>
      ) : (
        <p className="m-0 inline-flex shrink-0 items-center gap-[10px] rounded-pill border border-line bg-glass px-[22px] py-[13px] font-mono text-[12px] uppercase leading-none tracking-[0.1em] text-ink-faint">
          Not published yet
        </p>
      )}
    </div>
  );
}

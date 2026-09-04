import type { ResumeMeta } from "@portfolio/shared";

import { DownloadIcon, ExternalIcon } from "@/components/ui/icons";
import { resumeUrl } from "@/lib/api";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Resume panel: the PDF previewed in place, with a download beside it.
 *
 * Driven by `/api/resume/meta` exactly as the nav button is — a real preview
 * when a PDF is published, and an honest unavailable state when it isn't,
 * rather than a CTA that 404s or an empty viewer frame.
 */
export function ResumeCard({ resume }: { resume: ResumeMeta }) {
  const updated = resume.updatedAt
    ? new Date(resume.updatedAt).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
      })
    : null;

  return (
    <div className="rounded-panel border border-[rgb(255_255_255/0.075)] bg-gradient-to-br from-[rgb(31_33_37/0.6)] to-[rgb(13_14_16/0.5)] p-[clamp(20px,3vw,32px)] shadow-panel backdrop-blur-[var(--glass-blur)]">
      <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
        <div className="flex-[1_1_280px]">
          <h2 className="m-0 font-display text-[clamp(20px,2.2vw,26px)] font-semibold leading-[1.2] tracking-[-0.02em] text-ink">
            Full CV
          </h2>
          <p className="m-0 mt-3 max-w-[52ch] text-[13.5px] leading-[1.65] text-ink-muted">
            {resume.available
              ? "The complete history as a PDF — education, certifications and the roles above in full."
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
          /*
             * Not `shrink-0`: two buttons side by side demand 386px, which
             * overflowed a 375px phone by 50px instead of wrapping. Letting the
             * group shrink is what lets flex-wrap stack them.
             */
            <div className="flex flex-wrap items-center gap-3">
            <a
              href={resumeUrl}
              download={resume.filename ?? "resume.pdf"}
              className="inline-flex items-center gap-[10px] rounded-pill bg-ink px-[26px] py-[14px] font-mono text-[12.5px] font-semibold leading-none tracking-[0.04em] text-void transition-all duration-200 hover:-translate-y-px hover:shadow-[0_12px_30px_rgb(255_255_255/0.16)]"
            >
              Download CV
              <DownloadIcon className="size-[14px]" />
            </a>
            {/*
              Kept alongside the download because a PDF is often something to
              glance at rather than save. The `download` attribute above is
              actually honoured now — it was silently ignored while the API
              served this from a different port, since browsers refuse to
              rename a cross-origin download.
            */}
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-[9px] rounded-pill border border-line bg-glass px-[20px] py-[13px] font-mono text-[12px] font-medium leading-none tracking-[0.04em] text-ink-soft backdrop-blur-[var(--glass-blur)] transition-colors duration-300 hover:border-line-strong hover:text-ink-bright"
            >
              Open in new tab
              <ExternalIcon className="size-[12px]" />
            </a>
          </div>
        ) : (
          <p className="m-0 inline-flex shrink-0 items-center gap-[10px] rounded-pill border border-line bg-glass px-[22px] py-[13px] font-mono text-[12px] uppercase leading-none tracking-[0.1em] text-ink-faint">
            Not published yet
          </p>
        )}
      </div>

      {resume.available ? (
        <>
          {/*
            A4 is 1:√2, so the frame matches the page rather than letterboxing
            it inside a 3/4 box.

            Hidden below `lg` rather than merely shrunk: mobile Safari and
            Chrome Android generally refuse to render a PDF in an iframe and
            leave a blank rectangle, which reads as a broken page. The buttons
            above are the mobile path, and the note below says so.
            Not sandboxed — `sandbox` disables Chrome's built-in PDF viewer.
            No framing headers to work around any more: the PDF is a static
            asset on this origin, so the site's own `frame-src 'self'` covers
            it.
          */}
          <div className="relative mt-8 hidden aspect-[1/1.414] overflow-hidden rounded-card border border-[rgb(255_255_255/0.09)] bg-[rgb(255_255_255/0.02)] shadow-panel lg:block">
            <iframe
              src={`${resumeUrl}#view=FitH`}
              title="CV — PDF preview"
              loading="lazy"
              className="absolute inset-0 size-full border-0"
            />
          </div>
          <p className="m-0 mt-6 font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.16em] text-ink-ghost lg:hidden">
            Preview available on a larger screen
          </p>
        </>
      ) : null}
    </div>
  );
}

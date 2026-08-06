import type { ResearchPaper } from "@portfolio/shared";

import { ExternalIcon } from "@/components/ui/icons";
import { toBibtex } from "@/lib/bibtex";
import { cn } from "@/lib/cn";

import { CopyBibtexButton } from "./CopyBibtexButton";

/**
 * One split row per paper: metadata, abstract and actions on the left, the
 * embedded arXiv PDF on the right. Consistent sides on every row — unlike the
 * projects showcase, which alternates.
 */

const primaryCta =
  "inline-flex items-center gap-[9px] rounded-pill bg-ink px-[20px] py-[12px] font-mono text-[11.5px] font-semibold uppercase leading-none tracking-[0.08em] text-void transition-all duration-200 hover:-translate-y-px hover:shadow-[0_12px_30px_rgb(255_255_255/0.14)]";

const secondaryCta =
  "inline-flex items-center gap-[9px] rounded-pill border border-line bg-glass px-[20px] py-[12px] font-mono text-[11.5px] font-semibold uppercase leading-none tracking-[0.08em] text-ink-muted transition-all duration-200 hover:-translate-y-px hover:border-line-strong hover:bg-glass-hover hover:text-ink-bright";

const badge =
  "inline-flex items-center gap-[7px] rounded-pill border border-line bg-[rgb(255_255_255/0.03)] px-[12px] py-[6px] font-mono text-[10.5px] uppercase leading-none tracking-[0.12em] text-ink-muted";

/** Shared glass recipe, same as the projects showcase frames. */
const frame =
  "relative overflow-hidden rounded-card border border-line bg-gradient-to-br from-[rgb(34_36_41/0.66)] to-[rgb(14_15_17/0.52)] backdrop-blur-[var(--glass-blur)]";

const KIND_LABEL: Record<ResearchPaper["kind"], string> = {
  conference: "Peer-reviewed",
  workshop: "Peer-reviewed",
  journal: "Peer-reviewed",
  preprint: "Preprint",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { year: "numeric", month: "long" });
}

function arxivAbsUrl(paper: ResearchPaper): string | null {
  if (paper.arxivId) return `https://arxiv.org/abs/${paper.arxivId}`;
  return paper.url && paper.url !== "#" ? paper.url : null;
}

function PaperViewer({ paper }: { paper: ResearchPaper }) {
  const absUrl = arxivAbsUrl(paper);

  return (
    <div className="flex flex-col gap-4">
      {paper.arxivId ? (
        <>
          {/*
            The PDF, not the abstract page: `arxiv.org/abs/` sends
            `frame-ancestors 'none'` plus `X-Frame-Options: SAMEORIGIN` and can
            never be framed, while `arxiv.org/pdf/` sends neither.

            Hidden below `lg` rather than merely shrunk — mobile Safari and
            Chrome Android generally refuse to render a PDF in an iframe and
            leave a blank rectangle. The stacked view gets the panel below.

            Not sandboxed: `sandbox` disables Chrome's built-in PDF viewer.
            `referrerPolicy` keeps this site's URL off the request.
          */}
          <div className={cn(frame, "hidden aspect-[3/4] shadow-panel lg:block")}>
            <iframe
              src={`https://arxiv.org/pdf/${paper.arxivId}`}
              title={`${paper.title} — PDF preview`}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="absolute inset-0 size-full border-0"
            />
          </div>
          <div className={cn(frame, "flex aspect-[16/10] items-center justify-center lg:hidden")}>
            <span className="px-8 text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-ink-ghost">
              Preview available on a larger screen
            </span>
          </div>
        </>
      ) : (
        <div
          className={cn(
            frame,
            "flex aspect-[16/10] items-center justify-center shadow-panel lg:aspect-[3/4]",
          )}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.55]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.03) 0 1px, transparent 1px 11px)",
            }}
          />
          <span className="relative px-10 text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-ink-ghost">
            Preview appears once the arXiv ID is set
          </span>
        </div>
      )}

      {absUrl ? (
        <a
          href={absUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(secondaryCta, "self-start")}
        >
          Open in arXiv
          <ExternalIcon className="size-[12px]" />
        </a>
      ) : (
        <p className="m-0 font-mono text-[10.5px] uppercase leading-none tracking-[0.12em] text-ink-ghost">
          arXiv link not published yet
        </p>
      )}
    </div>
  );
}

export function PaperList({ papers }: { papers: ResearchPaper[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-24 p-0 lg:gap-28">
      {papers.map((paper, index) => (
        <li
          key={paper.id}
          className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,5fr)_1px_minmax(0,7fr)] lg:gap-x-12"
        >
          {/*
            Every child carries an explicit order. `order` drives grid
            auto-placement, not just visual position — leaving it off the
            non-moving children is what once dropped a panel into the 1px
            divider column and collapsed it.
          */}
          <article className="flex flex-col lg:order-1">
            <p className="m-0 font-mono text-[11.5px] leading-none text-ink-ghost">
              [{String(index + 1).padStart(2, "0")}]
            </p>

            <ul className="m-0 mt-5 flex list-none flex-wrap gap-[8px] p-0">
              <li className={badge}>{paper.venue}</li>
              <li className={badge}>{formatDate(paper.publishedAt)}</li>
              <li className={badge}>
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-[5px] rounded-full",
                    paper.kind === "preprint"
                      ? "bg-[rgb(255_255_255/0.3)]"
                      : "bg-[rgb(255_255_255/0.6)]",
                  )}
                />
                {KIND_LABEL[paper.kind]}
              </li>
            </ul>

            <h2 className="m-0 mt-6 max-w-[24ch] font-display text-[clamp(24px,2.8vw,34px)] font-semibold leading-[1.12] tracking-[-0.028em] text-ink">
              {paper.title}
            </h2>

            {paper.authors.length > 0 ? (
              <p className="m-0 mt-4 text-[13px] leading-[1.5] text-ink-faint">
                {paper.authors.join(", ")}
              </p>
            ) : null}

            <p className="m-0 mt-5 max-w-[54ch] text-[14px] leading-[1.75] text-ink-muted">
              {paper.abstract}
            </p>

            <div className="mt-8 flex flex-wrap gap-[10px]">
              {paper.arxivId ? (
                <a
                  href={`https://arxiv.org/pdf/${paper.arxivId}`}
                  target="_blank"
                  rel="noreferrer"
                  className={primaryCta}
                >
                  Read PDF
                  <ExternalIcon className="size-[12px]" />
                </a>
              ) : null}
              <CopyBibtexButton
                bibtex={toBibtex(paper)}
                paperTitle={paper.title}
                className={secondaryCta}
              />
            </div>
          </article>

          <div
            aria-hidden="true"
            className="relative hidden self-stretch bg-[rgb(255_255_255/0.08)] lg:order-2 lg:block"
          >
            <span className="absolute -top-1 left-1/2 size-[7px] -translate-x-1/2 rounded-full bg-[rgb(255_255_255/0.35)]" />
          </div>

          <div className="lg:order-3">
            <PaperViewer paper={paper} />
          </div>
        </li>
      ))}
    </ol>
  );
}

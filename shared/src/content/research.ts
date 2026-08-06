// PLACEHOLDER CONTENT — replace with real details before publishing.
// These four papers are sample copy from the design document. They are not
// real publications; do not link them anywhere public as-is.
//
// TODO: `arxivId` is null on every entry, so each row on /research falls back
// to the placeholder panel instead of an embedded PDF. Put the real arXiv
// identifier here (e.g. "2411.01234") and the viewer wires itself up.
//
// The author lists are invented too. They feed the Copy BibTeX button, so a
// wrong name here ends up in someone's bibliography.
import type { ResearchPaper } from "../types";

export const research: ResearchPaper[] = [
  {
    id: "budgeted-adapters",
    title: "Budgeted Adapters: Parameter-Efficient Tuning Under Fixed Memory",
    venue: "EMNLP Findings",
    publishedAt: "2025-11-12",
    authors: ["Alwin Tay", "R. Iyer", "M. Okonkwo"],
    kind: "conference",
    arxivId: null,
    abstract:
      "Introduces a memory-aware adapter allocation scheme that matches full LoRA quality at 38% of the trainable parameters, with a scheduler that reallocates rank across layers during training.",
    url: "#",
  },
  {
    id: "retrieval-faithfulness",
    title: "Retrieval Faithfulness as a Ranking Objective",
    venue: "SIGIR Workshop on Retrieval-Augmented Generation",
    publishedAt: "2024-07-18",
    authors: ["Alwin Tay", "S. Bergqvist"],
    kind: "workshop",
    arxivId: null,
    abstract:
      "Reframes reranking around answer attribution rather than passage similarity, cutting unsupported claims by 31% on three open-domain QA benchmarks.",
    url: "#",
  },
  {
    id: "small-models-long-context",
    title: "Small Models, Long Context: A Study of Compression Trade-offs",
    venue: "arXiv",
    publishedAt: "2024-02-29",
    authors: ["Alwin Tay", "D. Halvorsen", "P. Raman"],
    kind: "preprint",
    arxivId: null,
    abstract:
      "Benchmarks KV-cache compression, summarisation and retrieval on 1–7B models, and maps where each strategy fails as context length grows past 64k tokens.",
    url: "#",
  },
  {
    id: "instruction-data-curation",
    title: "Instruction Data Curation with Weak Supervision Signals",
    venue: "NeurIPS Workshop on Data-Centric AI",
    publishedAt: "2023-12-15",
    authors: ["Alwin Tay", "L. Moreau"],
    kind: "workshop",
    arxivId: null,
    abstract:
      "A pipeline that scores instruction data with cheap proxy signals, reaching human-filtered quality on 12% of the annotation budget.",
    url: "#",
  },
];

// From the CV: "Authored a research paper on a recursive refinement and bias
// analysis framework for conversational AI under academic supervision."
//
// That is the whole of what the CV says, so this entry claims nothing more.
// `publishedAt` and `url` are null and `kind` is "preprint", which makes the
// row render an IN PREPARATION status where a published paper would show its
// date and a link. No venue has accepted it, so `venue` says exactly that.
//
// TODO: `authors` lists Alwin alone because the CV names no co-authors, only
// that the work was supervised. This feeds the Copy BibTeX button, so a wrong
// author list ends up in someone else's bibliography -- correct it before the
// paper is cited anywhere.
//
// TODO: `arxivId` is null, so the /research row shows the placeholder panel
// instead of an embedded PDF. Set the identifier (e.g. "2411.01234") once it
// is on arXiv and the viewer wires itself up.
import type { ResearchPaper } from "../types";

export const research: ResearchPaper[] = [
  {
    id: "recursive-refinement-bias-analysis",
    title:
      "A Recursive Refinement and Bias Analysis Framework for Conversational AI",
    venue: "Manuscript in preparation",
    publishedAt: null,
    authors: ["Alwin Tay Jing Xue"],
    kind: "preprint",
    arxivId: null,
    abstract:
      "A framework for detecting and reducing bias in conversational models through recursive refinement, developed alongside a Low-Rank Adaptation bias-detection workflow that evaluates Llama 3 8B against Direct Preference Optimization baselines with Qdrant vector retrieval. Written under academic supervision at Swinburne University of Technology.",
    url: null,
  },
];

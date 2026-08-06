// PLACEHOLDER CONTENT — replace with real details before publishing.
// Sample copy from the design document, including the "1.9k stars" claim.
//
// TODO: `repoUrl` and `demoUrl` are all "#", so the Live demo / GitHub buttons
// on /projects render but go nowhere. Put real URLs here, or set a field to
// null to drop that button from the card.
//
// TODO: `images` is empty everywhere, so each showcase row falls back to a
// single glass panel. Drop screenshots in web/public/projects/ and list them
// here — three or more gives the full mosaic, and images[0] also becomes the
// home page's teaser thumbnail.
//
// `tech` holds names from stack.ts. Anything not found there still renders,
// just without a brand icon.
import type { Project } from "../types";

export const projects: Project[] = [
  {
    id: "atlas-rag",
    name: "Atlas RAG",
    category: "OPEN SOURCE",
    summary:
      "A retrieval framework with pluggable rerankers and a built-in faithfulness eval suite. 1.9k stars.",
    description:
      "A retrieval framework built around the parts that usually get bolted on last: reranking, attribution and evaluation. Rerankers are pluggable, every answer carries the passages it was grounded in, and the faithfulness suite runs in CI so a regression shows up before a release does. Used in production by a handful of teams and at 1.9k stars.",
    highlights: [
      "Pluggable reranker interface — swap cross-encoders, LLM rerankers or your own without touching the retrieval path",
      "Built-in faithfulness evaluation that gates releases on unsupported-claim rate rather than passage similarity",
      "Answer attribution surfaced through the API, so every response can be traced to its sources",
    ],
    repoUrl: "#",
    demoUrl: "#",
    images: [],
    tech: ["Python", "PyTorch", "LangChain", "FastAPI"],
  },
  {
    id: "tinytune",
    name: "TinyTune",
    category: "RESEARCH TOOL",
    summary:
      "QLoRA fine-tuning on a single consumer GPU, with reproducible run manifests and cost reporting.",
    description:
      "QLoRA fine-tuning that fits on one consumer GPU, aimed at people who need a reproducible run rather than a leaderboard score. Every run writes a manifest — data hash, seed, hyperparameters, package versions — so a result can be re-created months later, and reports what it cost in GPU-hours while it goes.",
    highlights: [
      "Fits a 7B fine-tune into 24GB of VRAM with 4-bit quantisation and gradient checkpointing",
      "Run manifests capture data hash, seed and environment, so any result can be reproduced exactly",
      "Live cost reporting in GPU-hours, with a projected total before the run commits",
    ],
    repoUrl: "#",
    demoUrl: "#",
    images: [],
    tech: ["Python", "PyTorch", "CUDA", "Weights & Biases"],
  },
  {
    id: "ledger-eval",
    name: "Ledger Eval",
    category: "INFRASTRUCTURE",
    summary:
      "Continuous evaluation service that gates model releases on regression suites and traced failures.",
    description:
      "A continuous evaluation service that sits between a model and its release. Suites run on every candidate, results are stored against the commit that produced them, and a release is blocked when a regression crosses its threshold. Failures are kept with their full trace, so the question is which case broke rather than whether the score moved.",
    highlights: [
      "Release gating on regression thresholds per suite, not a single aggregate score",
      "Every failure retained with its full trace — inputs, retrieved context and model output",
      "Results keyed to the commit that produced them, so a regression points at a change",
    ],
    repoUrl: "#",
    demoUrl: "#",
    images: [],
    tech: ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes"],
  },
  {
    id: "halftone",
    name: "Halftone",
    category: "EXPERIMENT",
    summary:
      "An ASCII renderer that turns depth maps into density-matched character fields, in real time.",
    description:
      "An ASCII renderer that treats characters as a density ramp rather than a font. Depth maps are matched to glyphs by ink coverage, so the resulting field reads as shading instead of noise, and it runs fast enough to drive from a live camera. Built mostly to find out whether it could hold a stable image while the subject moves.",
    highlights: [
      "Glyphs matched to depth by measured ink coverage rather than a hand-ordered ramp",
      "Runs in real time on a live camera feed at 60fps",
      "Temporal smoothing keeps the field stable as the subject moves, instead of flickering per frame",
    ],
    repoUrl: "#",
    demoUrl: "#",
    images: [],
    tech: ["Python", "CUDA", "Jupyter"],
  },
];

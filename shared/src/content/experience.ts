// PLACEHOLDER CONTENT — replace with real details before publishing.
// These roles ("Nexus AI Labs", "Vertex Analytics") came from the design
// document as sample copy. None of them have been verified.
//
// `tech` holds names from `stack.ts`. Anything not found there still renders,
// just without a brand icon.
import type { ExperienceEntry } from "../types";

export const experience: ExperienceEntry[] = [
  {
    id: "nexus-ai-labs",
    title: "Machine Learning Engineer",
    organisation: "Nexus AI Labs",
    summary:
      "Own the retrieval and fine-tuning stack behind a production assistant serving 400k monthly queries. Cut answer latency 41% and grounded-answer error rate by half.",
    period: "2024 — PRESENT",
    kind: "FULL-TIME",
    current: true,
    highlights: [
      "Cut median answer latency 41% by moving reranking off the critical path and caching passage embeddings.",
      "Halved the grounded-answer error rate with an attribution-based reranking objective.",
      "Took the fine-tuning pipeline from a notebook to a scheduled job with reproducible run manifests.",
    ],
    tech: ["Python", "PyTorch", "LangChain", "FastAPI", "Redis"],
  },
  {
    id: "vertex-analytics",
    title: "ML Engineer, LLM Systems",
    organisation: "Vertex Analytics",
    summary:
      "Built the evaluation harness and data pipeline for domain-adapted models across finance and legal customers. Shipped the first self-serve fine-tuning workflow.",
    period: "2022 — 2024",
    kind: "FULL-TIME",
    current: false,
    highlights: [
      "Built the evaluation harness that gated every model release on regression suites and traced failures.",
      "Shipped self-serve fine-tuning, taking a customer from dataset upload to a deployed adapter without an engineer.",
      "Cut GPU spend roughly a third by right-sizing training jobs against measured utilisation.",
    ],
    tech: ["Python", "PyTorch", "Hugging Face", "Docker", "Weights & Biases"],
  },
  {
    id: "institute-applied-ml",
    title: "Research Assistant",
    organisation: "Institute for Applied Machine Learning",
    summary:
      "Worked on parameter-efficient adaptation of small language models under tight compute budgets. Two first-author workshop papers.",
    period: "2021 — 2022",
    kind: "RESEARCH",
    current: false,
    highlights: [
      "Two first-author workshop papers on parameter-efficient adaptation under fixed memory.",
      "Ran the group's shared GPU scheduling, which roughly doubled effective cluster utilisation.",
    ],
    tech: ["Python", "PyTorch", "CUDA", "Jupyter"],
  },
];

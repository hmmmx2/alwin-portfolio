// From the CV's TECHNICAL PROJECTS section, in the CV's own order: SYNTHIEN
// first, VoidCode second.
//
// Two honesty constraints carried over from how these were written, because
// they are the difference between a claim that survives an interview and one
// that does not:
//
//   - SYNTHIEN carries NO performance numbers. Every noun here is something
//     that can be pointed at in the codebase; throughput, accuracy and latency
//     figures are deliberately absent rather than estimated.
//   - VoidCode says "trained a QLoRA adapter", not "deployed a fine-tuned
//     model" -- production serves the stock model. It leads with routing 0.94
//     and localisation 0.81 rather than the joint score, which fails its own
//     gate and would invite a bad follow-up.
//
// TODO: `repoUrl` and `demoUrl` are null because the CV gives no URLs, so the
// GitHub and Live demo buttons do not render at all. Put real links here and
// they appear -- a null field drops its button rather than pointing nowhere.
//
// TODO: `images` is empty, so each showcase row falls back to a single glass
// panel. Screenshots in web/public/projects/ listed here are the single biggest
// thing still missing from this page; images[0] also becomes the home teaser.
//
// `tech` holds names from stack.ts. Anything not found there still renders,
// just without a brand icon.
import type { Project } from "../types";

export const projects: Project[] = [
  {
    id: "synthien-ai",
    name: "SYNTHIEN AI",
    category: "AGENTIC RAG PLATFORM",
    summary:
      "Multi-tenant, citation-grounded question answering over private document corpora, built on a tool-driven LLM agent with hybrid retrieval and row-level security.",
    description:
      "A multi-tenant agentic RAG platform that answers questions over private document corpora with machine-checkable citations. A tool-driven LLM planner — nine capabilities including hybrid corpus search, web search and full-page crawl — runs over hybrid retrieval, dense vector search in Qdrant fused with Postgres full-text, behind PostgreSQL row-level security for tenant isolation, with per-passage redaction and full audit logging. It ships a real-time streaming workspace of chat, notes, spreadsheets and multi-section research reports, an OpenAPI-generated typed client, OpenTelemetry observability and CI-gated migrations.",
    highlights: [
      "Architected a tool-driven agent planner with 9 registered capabilities — hybrid corpus search, web search, page fetch and crawl, table extraction, document summarisation — producing grounded answers with locator-based citations verified across a Python/TypeScript type boundary.",
      "Built hybrid retrieval: dense vectors in Qdrant fused with sparse Postgres full-text and optional reranking, with project and tenant scoping enforced end to end.",
      "Implemented multi-tenant isolation through PostgreSQL row-level security that raises on an unset tenant, hardened by an adversarial suite covering filter injection, prompt-injection into unscoped search, vector-filter smuggling and object-storage key traversal.",
      "Delivered egress-safe web research — an SSRF-guarded crawler with passage redaction before anything reaches the model — and a multi-section cited research-report generator.",
      "Shipped an SSE-streaming workspace (chat, notes, spreadsheets), an OpenAPI-generated typed client with byte-exact CI drift checks, Alembic migrations whose reversibility is tested in CI, and OpenTelemetry, Prometheus, Grafana and Loki behind Caddy TLS.",
    ],
    repoUrl: null,
    demoUrl: null,
    images: [],
    tech: ["Python", "FastAPI", "PostgreSQL", "Qdrant", "Redis", "Next.js", "TypeScript", "Docker"],
  },
  {
    id: "voidcode-ai",
    name: "VoidCode AI",
    category: "ML INTERVIEW PREP",
    summary:
      "An LLM interview-prep tutor on Qwen3.5-9B via SGLang, with a Judge0 execution sandbox, QLoRA fine-tuning, a LambdaMART recommender and a reproducible streaming evaluation harness.",
    description:
      "An LLM tutoring platform serving Qwen3.5-9B in fp8 through SGLang, with mode-routed Socratic prompting, a code-execution sandbox over 125 problems and 699 test cases whose reference solutions are CI-verified, and a LambdaMART recommender over an IRT mastery model. A QLoRA adapter was trained on Qwen2.5-7B on a single 16 GB GPU, and a streaming evaluation harness measures routing, bug localisation and answer leakage against a per-metric noise floor.",
    highlights: [
      "Fine-tuned a QLoRA adapter — 4-bit NF4, rank 16, 40.4 million trainable parameters at 0.92 percent — on Qwen2.5-7B over 1,860 curated examples on a single 16 GB RTX 5060 Ti.",
      "Built an SSE streaming evaluation harness scoring the production path on its response payload: routing accuracy 0.94 (deterministic), bug localisation 0.81 across 459 cases over 9 runs, and answer leakage — each judged against a measured 5-run noise floor.",
      "Shipped a code-execution sandbox on self-hosted Judge0 with hidden-test grading over 200 authored problems and 699 test cases, wired into CI so every reference solution runs green.",
      "Engineered a Spark feature pipeline over 2.3 million rows feeding an IRT mastery model and a LambdaMART learning-to-rank recommender, reaching Recall@100 of 0.62 and NDCG@10 of 0.21.",
    ],
    repoUrl: null,
    demoUrl: null,
    images: [],
    tech: ["Python", "PyTorch", "FastAPI", "Next.js", "PySpark", "Docker"],
  },
];

// From the CV's TECHNICAL PROJECTS section and the fuller write-ups behind it,
// in the CV's own order: SYNTHIEN first.
//
// Two deliberate restraints carried over from those write-ups, because both are
// the kind of thing an interviewer checks:
//
//   - SYNTHIEN claims no throughput, accuracy or latency numbers. Every noun in
//     it maps to something in the codebase; the performance figures would need
//     to come from a green CI run on the split repo, so they are simply absent.
//   - VoidCode says "trained a QLoRA adapter", not deployed or merged -- the
//     merged and AWQ artifacts are hollow and production serves the stock
//     model. It also leads with routing 0.94 and localisation 0.81 rather than
//     the joint 0.76, which fails its own gate and invites a bad follow-up.
//
// TODO: `repoUrl` and `demoUrl` are null because the CV gives no URLs, so the
// GitHub and Live demo buttons do not render. Put real links here and they
// appear -- a null field drops its button rather than pointing nowhere.
//
// TODO: `images` is empty, so each showcase row falls back to a single glass
// panel. Screenshots in web/public/projects/ are the biggest thing still
// missing from that page; images[0] also becomes the home page thumbnail.
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
      "Multi-tenant, citation-grounded question answering over private document corpora, on a tool-driven LLM agent with hybrid retrieval and row-level security.",
    description:
      "A multi-tenant agentic RAG platform that answers questions over private document corpora with machine-checkable citations. A tool-driven LLM planner — nine capabilities including hybrid corpus search, web search and full-page crawl — runs over hybrid retrieval, dense vector search in Qdrant fused with Postgres full-text, behind PostgreSQL row-level security for tenant isolation, with per-passage redaction and full audit logging. It ships a real-time streaming workspace covering chat, notes, spreadsheets and multi-section research reports, with an OpenAPI-generated typed client, OpenTelemetry observability and CI-gated migrations.",
    highlights: [
      "Architected a tool-driven agent planner across 9 registered capabilities — hybrid corpus search, web search, page fetch and crawl, table extraction, document summarisation — producing grounded answers with locator-based citations verified across a Python/TypeScript type boundary",
      "Built hybrid retrieval: dense vectors in Qdrant fused with sparse Postgres full-text, rank-fused with optional reranking, with project and tenant scoping enforced end to end",
      "Implemented multi-tenant isolation through PostgreSQL row-level security that raises on an unset tenant, hardened by an adversarial suite covering filter injection, prompt-injection into unscoped search, vector-filter smuggling and object-storage key traversal",
      "Delivered egress-safe web research — an SSRF-guarded crawler with passage redaction before model egress — and a multi-section cited research-report generator",
      "Shipped an SSE-streaming workspace (chat, notes, spreadsheets), an OpenAPI-generated typed client with byte-exact CI drift checks, Alembic migrations tested for reversibility in CI, and OpenTelemetry, Prometheus, Grafana and Loki observability behind Caddy TLS",
    ],
    repoUrl: null,
    demoUrl: null,
    images: [],
    tech: ["Python", "FastAPI", "PostgreSQL", "Qdrant", "Redis", "vLLM", "Next.js", "TypeScript", "Docker"],
  },
  {
    id: "voidcode-ai",
    name: "VoidCode AI",
    category: "ML INTERVIEW-PREP TUTOR",
    summary:
      "An LLM interview-prep tutor with a Judge0 execution sandbox, QLoRA fine-tuning, a LambdaMART recommender over an IRT mastery model, and a reproducible streaming evaluation harness.",
    description:
      "An LLM tutoring platform serving Qwen3.5-9B in fp8 through SGLang, with mode-routed Socratic prompting, a code-execution sandbox and a LambdaMART recommender built over an IRT mastery model. A QLoRA adapter was trained on Qwen2.5-7B on a single 16GB GPU, and a streaming evaluation harness measures routing, bug localisation and answer leakage on the production serving path — each against a per-metric noise floor rather than a single headline score.",
    highlights: [
      "Fine-tuned a QLoRA adapter — 4-bit NF4, rank 16, 40.4M trainable parameters at 0.92% — on Qwen2.5-7B over 1,860 curated examples on a single 16GB RTX 5060 Ti",
      "Built an SSE streaming evaluation harness scoring the production path on its response payload: routing accuracy 0.94 (deterministic) and bug-localisation 0.81 over 459 cases across 9 runs, each judged against a measured 5-run noise floor",
      "Shipped a self-hosted Judge0 execution sandbox with hidden-test grading over 200 authored problems and 699 test cases, wired into CI so every reference solution runs green",
      "Engineered a PySpark feature pipeline over 2.3M rows feeding an IRT mastery model and a LambdaMART learning-to-rank recommender, reaching Recall@100 of 0.62 against a 0.19 popularity baseline and NDCG@10 of 0.21",
    ],
    repoUrl: null,
    demoUrl: null,
    images: [],
    tech: ["Python", "FastAPI", "PyTorch", "SGLang", "Judge0", "PySpark", "LightGBM", "Next.js", "TypeScript"],
  },
];

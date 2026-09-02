// From the CV's TECHNICAL PROJECTS section.
//
// TODO: `repoUrl` and `demoUrl` are null because the CV gives no URLs, so the
// GitHub and Live demo buttons do not render at all. Put real links here and
// they appear -- a null field drops its button rather than pointing nowhere.
//
// TODO: `images` is empty, so each showcase row falls back to a single glass
// panel. Drop screenshots in web/public/projects/ and list them here; three or
// more gives the full mosaic, and images[0] becomes the home page thumbnail.
// Screenshots are the single biggest thing missing from this page.
//
// `tech` holds names from stack.ts. Anything not found there still renders,
// just without a brand icon.
import type { Project } from "../types";

export const projects: Project[] = [
  {
    id: "voidcode-ai",
    name: "VoidCode AI",
    category: "ML PLATFORM",
    summary:
      "An ML interview preparation platform: a PySpark feature pipeline over 2.3 million submissions feeding a LambdaMART ranker.",
    description:
      "A machine learning interview preparation platform built around measured recommendation quality rather than a hand-ordered syllabus. A PySpark pipeline turns 2.3 million code submissions into per-learner mastery vectors, a LambdaMART ranker learns over those features, and the problem catalogue is validated in CI so every reference solution is known to run.",
    highlights: [
      "PySpark feature pipeline processing 2.3 million code-submission rows at roughly 9,200 rows per second on 10 cores, into per-learner mastery vectors for 117,000 learners",
      "LambdaMART ranker over those features reaching Recall@100 of 0.616 against a 0.190 popularity baseline, and NDCG@10 of 0.214",
      "A 200-item catalogue with 125 executable problems and 699 test cases, every reference solution executing green in continuous integration",
    ],
    repoUrl: null,
    demoUrl: null,
    images: [],
    tech: ["Python", "PySpark", "PostgreSQL", "Next.js", "TypeScript"],
  },
  {
    id: "synthien-ai",
    name: "SYNTHIEN AI",
    category: "AI INFRASTRUCTURE",
    summary:
      "A multi-tenant document intelligence platform with agentic retrieval, per-claim citations and fail-closed row-level security.",
    description:
      "A multi-tenant document intelligence platform where the retrieval is agentic and the tenancy boundary is enforced at the data layer rather than in application code. Hybrid search and reranking produce per-claim citations; row-level security fails closed; and PII is redacted before anything leaves for a model, with an append-only audit log behind it.",
    highlights: [
      "Agentic retrieval backend across 197 source files and 79 migrations with 9 registered capabilities — hybrid search and reranking with per-claim citations, on FastAPI with PostgreSQL, Qdrant and Redis",
      "Fail-closed row-level security across 56 policies at the data layer, verified by an 85-test adversarial suite covering cross-tenant reads, filter injection, prompt injection and redaction before model egress",
      "PII redaction before every outbound model call and an append-only audit log spanning 88 action types, with CI running lint, type-check, contract-drift and a dedicated tenancy job on Linux service containers",
    ],
    repoUrl: null,
    demoUrl: null,
    images: [],
    tech: ["Python", "FastAPI", "PostgreSQL", "Qdrant", "Redis", "Docker"],
  },
];

import { Fragment, type ReactNode } from "react";

/**
 * Marks the technical vocabulary in a line of prose.
 *
 * A hiring manager skims before they read. The bullets already carry the
 * evidence, but on a monochrome page every word has the same weight, so the
 * stack has to be reconstructed sentence by sentence. Marking the named
 * technologies gives the eye somewhere to land and leaves a route back into the
 * sentence around it.
 *
 * Two deliberate restraints, because the failure mode here is a page that looks
 * like a highlighter accident and reads as trying too hard:
 *
 *  - Only *named* things: models, frameworks, methods, tools. Not "pipeline",
 *    not "training", not "evaluation" -- a term that would appear on every CV
 *    in the pile marks nothing.
 *  - No numbers. The measurements are the strongest thing on the page and they
 *    already stand out in running text. Colouring them reads as boasting, and
 *    it is the claim that carries them, not the digits.
 */

/*
 * Longest first. The regex alternation is tried in order, so "PostgreSQL" has
 * to come before "Postgres" and "Qwen2.5-7B" before "Qwen2.5", or the shorter
 * entry wins and leaves a stray tail behind.
 *
 * Every entry below appears in the current copy. An unmatched term is not
 * harmless: it is a claim someone believed was there, and the test asserts the
 * list and the content agree.
 */
const TERMS = [
  // Models and architectures
  "Qwen2.5 7B-Instruct",
  "Qwen2.5-7B",
  "Qwen3.5-9B",
  "Llama 3 8B",
  "EfficientNet-B0",
  "LambdaMART",
  "YOLOv8",

  // Methods
  "Direct Preference Optimization",
  "Low-Rank Adaptation",
  "learning-to-rank",
  "row-level security",
  "hybrid retrieval",
  "dense vector search",
  "time series analysis",
  "prompt-injection",
  "quantisation",
  "Fine-tuned",
  "Fine-tuning",
  "reranking",
  "QLoRA",
  "LoRA",
  "AdamW",
  "NF4",
  "IRT",
  "RAG",
  "fp8",

  // Frameworks, runtimes and infrastructure
  "OpenTelemetry",
  "PostgreSQL",
  "LangChain",
  "Prometheus",
  "TypeScript",
  "PySpark",
  "FastAPI",
  "Next.js",
  "PyTorch",
  "Alembic",
  "OpenAPI",
  "SGLang",
  "Postgres",
  "Judge0",
  "Grafana",
  "Django",
  "Qdrant",
  "Ollama",
  "Python",
  "VB.NET",
  "MySQL",
  "Caddy",
  "Loki",
  "SSE",
  "ETL",

  // Security and evaluation vocabulary
  "conversational AI",
  "Agile Scrum",
  "SIT/UAT",
  "95% CI",
  "SSRF",
  "SDLC",
  "Jira",

  // Retrieval and ranking metrics that name a method rather than a score
  "Recall@100",
  "NDCG@10",
] as const;

const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/*
 * Boundaries are alphanumeric-only rather than \b, because several terms carry
 * punctuation that \b treats as a break: "Next.js", "VB.NET", "NDCG@10",
 * "Recall@100". Guarding on [A-Za-z0-9] instead keeps "LoRA" from matching
 * inside "QLoRA" while still allowing a term to sit next to a hyphen or a dot.
 */
const PATTERN = new RegExp(
  `(?<![A-Za-z0-9])(${TERMS.map(escape).join("|")})(?![A-Za-z0-9])`,
  "g",
);

/** The terms, for the test that keeps this list and the copy in step. */
export const HIGHLIGHT_TERMS: readonly string[] = TERMS;

/**
 * Splits `text` into plain runs and marked terms.
 *
 * `<strong>` rather than a coloured `<span>`: this is emphasis with meaning, so
 * it should survive a stylesheet failing to load and read as emphasis to a
 * screen reader rather than as decoration.
 */
export function highlightTerms(text: string): ReactNode {
  if (!text) return text;

  const parts = text.split(PATTERN);
  // split() with one capture group yields [plain, term, plain, term, ...], so
  // odd indices are the matches.
  if (parts.length === 1) return text;

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-accent">
        {part}
      </strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

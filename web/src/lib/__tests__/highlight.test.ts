import { experience, projects } from "@portfolio/shared";
import { describe, expect, it } from "vitest";

import { HIGHLIGHT_TERMS, highlightTerms } from "../highlight";

/** Every string on the page that the highlighter is applied to. */
function markedCopy(): string[] {
  const out: string[] = [];
  for (const e of experience) {
    if (e.summary) out.push(e.summary);
    out.push(...e.highlights);
  }
  for (const p of projects) {
    if (p.summary) out.push(p.summary);
    if (p.description) out.push(p.description);
    out.push(...p.highlights);
  }
  return out;
}

/** Count the <strong> runs `highlightTerms` produced, without rendering. */
function markCount(text: string): number {
  const nodes = highlightTerms(text);
  if (!Array.isArray(nodes)) return 0;
  return nodes.filter(
    (n) => typeof n === "object" && n !== null && "type" in n && n.type === "strong",
  ).length;
}

describe("highlight terms", () => {
  it("every term in the list actually appears in the copy", () => {
    const corpus = markedCopy().join("\n");
    const missing = HIGHLIGHT_TERMS.filter((t) => !corpus.includes(t));
    // A term that matches nothing is not harmless: it is something somebody
    // believed was on the page. Either the copy changed or the claim was wrong.
    expect(missing).toEqual([]);
  });

  it("does not reduce QLoRA to LoRA, or PostgreSQL to Postgres", () => {
    // The boundary rule these two cases exist to protect: a shorter term must
    // not match inside a longer one and leave a stray tail unmarked.
    const nodes = highlightTerms("Trained a QLoRA adapter on PostgreSQL");
    const marks = (Array.isArray(nodes) ? nodes : []).filter(
      (n): n is { props: { children: string } } =>
        typeof n === "object" && n !== null && "type" in n && n.type === "strong",
    );
    expect(marks.map((m) => m.props.children)).toEqual(["QLoRA", "PostgreSQL"]);
  });

  it("marks the large majority of bullets", () => {
    /*
     * Not "every bullet". The first version of this asserted 100% and failed on
     * eight strings, and most of that was a real gap -- Jira, SIT/UAT, SDLC,
     * SSRF and 95% CI were all missing from the list. But two of them were
     * plain-English summaries of non-ML work ("Translated business requirements
     * into technical specifications..."), which name no technology at all.
     * Forcing a mark there would mean colouring a generic word, which is
     * exactly what the density test below exists to prevent. A bar the copy can
     * only clear by lying is the wrong bar.
     */
    const copy = markedCopy();
    const marked = copy.filter((t) => markCount(t) > 0);
    expect(marked.length / copy.length).toBeGreaterThanOrEqual(0.8);
  });

  it("does not turn a sentence into a highlighter accident", () => {
    // Guards the other failure: marking so much that nothing stands out.
    for (const text of markedCopy()) {
      const words = text.split(/\s+/).length;
      const marks = markCount(text);
      expect(marks / words).toBeLessThan(0.35);
    }
  });
});

describe("punctuation", () => {
  it("carries no semicolons, em-dashes or en-dashes", () => {
    const offenders = markedCopy().filter(
      (t) => t.includes(";") || t.includes("—") || t.includes("–") || t.includes("--"),
    );
    expect(offenders).toEqual([]);
  });
});

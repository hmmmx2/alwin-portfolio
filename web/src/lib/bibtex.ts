import type { ResearchPaper } from "@portfolio/shared";

/**
 * Renders a paper as a BibTeX entry.
 *
 * Web-only on purpose: this is presentation, not part of the API contract, so
 * it lives here rather than in @portfolio/shared.
 */

/** Entry type per venue kind — a preprint is not an `@inproceedings`. */
const ENTRY_TYPE: Record<ResearchPaper["kind"], string> = {
  conference: "inproceedings",
  workshop: "inproceedings",
  journal: "article",
  preprint: "misc",
};

/**
 * BibTeX is TeX: braces and backslashes are syntax. An unescaped one silently
 * corrupts whoever pastes this into their bibliography.
 */
function escapeTex(value: string): string {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

/** `taySmallModelsLongContext2024`-ish — stable, and readable in a .bib file. */
function citationKey(paper: ResearchPaper, year: string): string {
  const surname = paper.authors[0]?.split(/\s+/).pop()?.toLowerCase() ?? "anon";
  const slug = paper.id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  return `${surname}${slug.charAt(0).toUpperCase()}${slug.slice(1)}${year}`;
}

export function toBibtex(paper: ResearchPaper): string {
  const year = paper.publishedAt.slice(0, 4);
  const type = ENTRY_TYPE[paper.kind];

  const fields: Array<[string, string]> = [
    // BibTeX joins authors with " and ", not commas.
    ["author", escapeTex(paper.authors.join(" and "))],
    // Double braces protect the title's capitalisation from BibTeX's styles.
    ["title", `{${escapeTex(paper.title)}}`],
    [paper.kind === "journal" ? "journal" : "booktitle", escapeTex(paper.venue)],
    ["year", year],
  ];

  if (paper.arxivId) {
    fields.push(["eprint", paper.arxivId], ["archivePrefix", "arXiv"]);
  }
  if (paper.url && paper.url !== "#") {
    fields.push(["url", paper.url]);
  }

  const body = fields
    .filter(([, value]) => value.length > 0)
    .map(([name, value]) => `  ${name} = {${value}}`)
    .join(",\n");

  return `@${type}{${citationKey(paper, year)},\n${body}\n}`;
}

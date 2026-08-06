// PLACEHOLDER CONTENT — replace with real details before publishing.
// Degrees, dates and grades below are invented to fill the section out. The
// institution is a guess from the surrounding repository, not something you
// told me — check it before this goes anywhere public.
import type { EducationEntry } from "../types";

export const education: EducationEntry[] = [
  {
    id: "msc-machine-learning",
    degree: "MSc Machine Learning",
    institution: "Swinburne University of Technology",
    period: "2021 — 2022",
    note: "DISTINCTION",
    summary:
      "Thesis on parameter-efficient adaptation of small language models under fixed memory budgets, which became the first of the workshop papers listed under Research.",
    current: false,
  },
  {
    id: "bsc-computer-science",
    degree: "BSc Computer Science",
    institution: "Swinburne University of Technology",
    period: "2018 — 2021",
    note: "FIRST CLASS",
    summary:
      "Majored in software engineering with electives in statistics and distributed systems. Final-year project built a retrieval pipeline over the university's course catalogue.",
    current: false,
  },
];

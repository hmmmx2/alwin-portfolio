// From the CV's AWARDS & HONORS section. Both are national-level.
//
// TODO: `date` is null on both because the CV gives no year, and the card drops
// its eyebrow rather than inventing one. Add the years when you have them.
//
// The URLs come from the CV's own hyperlink annotations -- its "[link]" markers
// are real links, not placeholder text.
import type { Award } from "../types";

export const awards: Award[] = [
  {
    id: "techfrontier-scent-demo-day",
    title: "2nd Place, TechFrontier Explorer × SCENT Demo Day Competition",
    issuer: "TechFrontier Explorer × SCENT · National",
    date: null,
    summary: "",
    url: "https://drive.google.com/file/d/19L6wgy53ebmPfXD8k7Jp9RlaUoxoEc_j/view?usp=sharing",
  },
  {
    id: "techfrontier-scent-grant",
    title: "Grants Award, TechFrontier Explorer × SCENT Programme",
    issuer: "TechFrontier Explorer × SCENT · National",
    date: null,
    summary: "",
    url: "https://drive.google.com/file/d/1_jMbjr1bF-VwdVe3ZyPem3IcrgcIyQpd/view?usp=sharing",
  },
];

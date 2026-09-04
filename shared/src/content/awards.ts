// From the CV's AWARDS & HONORS section. Both are national-level.
//
// TODO: `date` is null on both because the CV gives no year, and the card drops
// its eyebrow rather than inventing one. Add the years when you have them.
//
// The certificate and photographs now stand in for the CV's "[link]" markers:
// the evidence is on the page rather than behind a Google Drive URL that a
// reader has to trust and click.
import type { Award } from "../types";

export const awards: Award[] = [
  {
    id: "techfrontier-scent-demo-day",
    title: "2nd Place, TechFrontier Explorer × SCENT Demo Day Competition",
    issuer: "TechFrontier Explorer × SCENT · National",
    date: null,
    summary: "",
    url: null,
    images: [
      { src: "/award-scent-stage.efb940f0.jpg", alt: "the award being presented on stage" },
      { src: "/award-scent-prize.1170adb6.jpg", alt: "the award" },
      { src: "/award-scent-certificate.e647a5b6.jpg", alt: "certificate of achievement" },
    ],
  },
  {
    id: "techfrontier-scent-grant",
    title: "Grants Award, TechFrontier Explorer × SCENT Programme",
    issuer: "TechFrontier Explorer × SCENT · National",
    date: null,
    summary: "",
    url: null,
    // One photograph, so the renderer gives it a single wide frame rather than
    // a 2x2 grid with three empty cells.
    images: [
      {
        src: "/award-scent-grant.f6e01aa0.jpg",
        alt: "the funded teams at the programme announcement",
      },
    ],
  },
];

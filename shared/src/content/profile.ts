// From the CV (V3). Everything here is real; nothing is placeholder.
//
// No phone number and no home address: the CV dropped both from its header,
// and a number on a public page is scraped within days. Email, LinkedIn and
// GitHub are the contact paths.
import type { Profile } from "../types";

export const profile: Profile = {
  name: "Alwin Tay Jing Xue",
  shortName: "Alwin",
  eyebrow: "PORTFOLIO · 2026",
  role: "Machine Learning Engineer (LLM)",
  email: "alwin.tayjx.work@gmail.com",
  availability:
    "Graduating July 2026 and looking for machine learning engineering work — LLM fine-tuning, retrieval systems, and the infrastructure around them. Replies within two days.",
  // Transparent WebP in web/public, built by web/scripts/build-portrait.py --
  // the filename is content-hashed, so edit the photo and rerun rather than
  // changing this by hand.
  avatar: "/alwin.ff160abf.webp",
  socials: [
    { kind: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/tayjx523/" },
    { kind: "github", label: "GitHub", href: "https://github.com/hmmmx2" },
    { kind: "email", label: "Email", href: "mailto:alwin.tayjx.work@gmail.com" },
  ],
};

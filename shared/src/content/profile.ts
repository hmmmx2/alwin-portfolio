// PLACEHOLDER CONTENT — replace with real details before publishing.
// Ported verbatim from the Claude Design document. The email address is real.
// Deliberately no city or timezone anywhere in this file.
import type { Profile } from "../types";

export const profile: Profile = {
  name: "Alwin Tay Jing Xue",
  shortName: "Alwin",
  eyebrow: "PORTFOLIO · 2026",
  role: "Machine Learning Engineer & LLM Researcher",
  email: "alwin.tayjx.work@gmail.com",
  availability:
    "Open to research collaborations, applied LLM work, and speaking. Replies within two days.",
  // Transparent WebP in web/public, built by web/scripts/build-portrait.py --
  // the filename is content-hashed, so edit the photo and rerun rather than
  // changing this by hand. This one is real, unlike the copy above.
  avatar: "/alwin.ff160abf.webp",
  socials: [
    // TODO: replace the '#' placeholders with real profile URLs.
    { kind: "linkedin", label: "LinkedIn", href: "#" },
    { kind: "github", label: "GitHub", href: "#" },
    { kind: "email", label: "Email", href: "mailto:alwin.tayjx.work@gmail.com" },
  ],
};

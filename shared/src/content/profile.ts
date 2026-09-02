// From the CV (V3). Everything here is real; nothing is placeholder.
//
// No home address by request, and no phone number for anyone but the owner --
// see `references` in the README for why the CV's referee contacts are not on
// the site at all.
import type { Profile } from "../types";

export const profile: Profile = {
  name: "Alwin Tay Jing Xue",
  shortName: "Alwin",
  eyebrow: "PORTFOLIO · 2026",
  role: "Machine Learning Engineer (LLM)",
  email: "alwin.tayjx.work@gmail.com",
  phone: "+60 16 983 7035",
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

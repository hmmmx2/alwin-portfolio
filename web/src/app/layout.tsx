import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope, Space_Grotesk } from "next/font/google";

import { profile } from "@portfolio/shared";

import { Analytics } from "@/components/Analytics";
import { SiteFooter } from "@/components/footer/SiteFooter";
import { SiteNav } from "@/components/nav/SiteNav";
import { RevealObserver } from "@/components/ui/RevealObserver";
import { getContent } from "@/lib/api";
import { getResumeMeta } from "@/server/resume";

import "./globals.css";

/*
 * The design loaded these from a blocking <link> to fonts.googleapis.com.
 * next/font self-hosts them, so there is no third-party round trip on the
 * critical path and no layout shift when they arrive.
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-manrope",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.alwint.dev";
const description = `${profile.role}. ${profile.availability}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${profile.name} — ${profile.role}`,
    template: `%s — ${profile.name}`,
  },
  description,
  openGraph: {
    type: "website",
    url: siteUrl,
    title: `${profile.name} — ${profile.role}`,
    description,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#050506",
  colorScheme: "dark",
};

/**
 * The nav, footer and reveal observer live here rather than in each page, so a
 * second route gets the whole chrome for free. Both fetches are already
 * `revalidate`-cached and Next memoises identical fetches within a render pass,
 * so the layout and a page asking for the same payload cost one request.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = getContent();
  const resume = await getResumeMeta();

  return (
    <html
      lang="en"
      /*
       * globals.css sets `scroll-behavior: smooth`, which without this makes
       * Next animate the scroll on every route change — a long smooth crawl
       * back to the top instead of landing there. The attribute keeps smooth
       * scrolling for in-page anchors and suppresses it for navigations.
       */
      data-scroll-behavior="smooth"
      className={`${spaceGrotesk.variable} ${manrope.variable} ${ibmPlexMono.variable}`}
    >
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:font-mono focus:text-xs focus:text-void"
        >
          Skip to content
        </a>

        <SiteNav email={content.profile.email} resume={resume} />
        {children}
        <SiteFooter content={content} resume={resume} />

        <RevealObserver />
        <Analytics />
      </body>
    </html>
  );
}

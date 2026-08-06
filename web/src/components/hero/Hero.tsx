import Link from "next/link";

import type { Profile } from "@portfolio/shared";

import { BrandIcon } from "@/components/ui/BrandIcon";
import { MediaSlot } from "@/components/ui/MediaSlot";
import { MailIcon } from "@/components/ui/icons";

import { AsciiWaveField } from "./AsciiWaveField";
import { PORTRAIT_CELLS, PORTRAIT_MAX_PX, renderStillFrame } from "./ascii-field";

/**
 * The still is generated on the server from the same maths the client animates,
 * so the hero arrives complete in the HTML instead of popping in after
 * hydration — and stays put for anyone who has asked for reduced motion.
 */
const STILL = renderStillFrame();

/**
 * The disc's size, from the two constants the wave field derives its opening
 * from — `min(18 · cell, 200px)`. They live in `ascii-field` so that the hole
 * and the thing it clears can't drift apart, which is exactly what happened
 * when each owned its own number.
 */
const PORTRAIT_SIZE = `min(calc(${PORTRAIT_CELLS} * var(--cell)), ${PORTRAIT_MAX_PX}px)`;

/**
 * Glass disc: translucent fill, the scene blurred behind it, a light edge along
 * the top and a drop shadow to lift it off the page. Same language as the nav
 * pill and the project cards, bent into a circle.
 *
 * No border ring — the fill and the blur are what describe the circle. The
 * inset highlight in `--shadow-portrait` still catches the top edge, which is
 * enough of a lip to keep the disc from reading as a flat cut-out.
 */
const PORTRAIT_GLASS = [
  "rounded-full",
  "bg-[rgb(255_255_255/0.06)]",
  "backdrop-blur-[var(--glass-blur)] backdrop-saturate-[1.4]",
  "shadow-portrait",
].join(" ");

const socialTile =
  "flex size-[34px] items-center justify-center rounded-[10px] border border-[rgb(255_255_255/0.11)] bg-[rgb(255_255_255/0.03)] text-ink-faint backdrop-blur-[var(--glass-blur)] transition-colors duration-300 hover:border-[rgb(255_255_255/0.28)] hover:bg-[rgb(255_255_255/0.07)] hover:text-ink-bright";

/*
 * The hero has to fit inside one screen, socials row included, from a 1366×768
 * laptop (≈640px of viewport once browser chrome is off) up to a 5120×1440
 * super-ultrawide. Only the *height* actually varies much across that range —
 * ultrawides are wide and short, so the tightest budgets are the 14" laptop and
 * the 34"/47" ultrawides, which land at roughly the same 640–1310px.
 *
 * So every vertical term below carries a `vh` ceiling as well as a px one. On a
 * tall screen the px cap wins and nothing changes; on a short one the whole
 * stack contracts proportionally instead of pushing the socials past the fold.
 * `--cell` is already height-aware (`min(100vw/118, 100vh/60)`), which is what
 * keeps the arch and the portrait in step with this.
 */
const HERO_PAD_TOP = "clamp(96px, calc(88px + 34 * var(--cell)), 33vh)";
const HERO_PAD_BOTTOM = "clamp(16px, 4vh, 64px)";
/** Eyebrow → name → role. */
const STACK_GAP = "clamp(8px, 1.4vh, 16px)";

export function Hero({ profile }: { profile: Profile }) {
  const linkedin = profile.socials.find((social) => social.kind === "linkedin");
  const github = profile.socials.find((social) => social.kind === "github");

  return (
    <section
      id="top"
      className="relative flex min-h-svh flex-col items-center justify-start overflow-hidden"
      style={{
        /*
         * The wave field overhangs ~35 cells above the block it is anchored to,
         * so the hero has to reserve that much room or the arch is clipped by
         * the navbar. The design measured the nav in JavaScript and reflowed
         * twice on every resize to work this out; because every term is in
         * `--cell` units it is just arithmetic.
         *
         * Capped at 33vh: the top rows of the field are nearly empty and the
         * first 15% is masked to transparent anyway, so on a short viewport
         * losing a few rows costs nothing and buys back the ~80px that was
         * pushing the socials row below the fold on a 14" laptop.
         */
        paddingTop: HERO_PAD_TOP,
        paddingBottom: HERO_PAD_BOTTOM,
      }}
    >
      {/* Dot grid, masked to an ellipse — straight from the design. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(180 186 196 / 0.10) 1px, transparent 1px)",
          backgroundSize: "17px 17px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, #000 20%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, #000 20%, transparent 78%)",
        }}
      />
      <div
        aria-hidden="true"
        className="animate-haze pointer-events-none absolute left-1/2 top-[34%] size-[760px] max-h-[520px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(closest-side, rgb(146 154 168 / 0.10), transparent 72%)",
        }}
      />

      <div id="about" className="relative flex scroll-mt-24 flex-col items-center">
        <div className="relative flex w-full justify-center">
          <AsciiWaveField still={STILL} />

          {/*
            The spacer keeps the design's 11.2 × 13 cell flow box. The wave
            field is anchored to this row's bottom edge, so growing the portrait
            directly would drag the whole arch down with it — the disc is
            centred on the spacer instead and free to be any size.
          */}
          <div
            className="relative z-2"
            style={{
              width: "calc(11.2 * var(--cell))",
              height: "calc(13 * var(--cell))",
              top: "calc(-2 * var(--cell))",
            }}
          >
            <MediaSlot
              src={profile.avatar}
              alt={profile.avatar ? `Portrait of ${profile.name}` : ""}
              label="Developer illustration"
              fit="cover"
              priority
              sizes="(max-width: 768px) 150px, 220px"
              // A face, at the largest single element on the page. The default
              // 75 shows compression mush around the eyes and hairline.
              quality={90}
              /*
               * Centred by translation, which is size-agnostic — half-size
               * margins would have to repeat the `min()` and silently go wrong
               * the moment the cap engaged. `inset-0 m-auto` is not an option
               * either: the disc is deliberately larger than the spacer it sits
               * on, and `margin: auto` only centres an element that fits;
               * over-constrained it collapses to zero and aligns left/top,
               * which put the portrait 21px right and 11px low.
               *
               * Tailwind v4 emits these as the standalone `translate` property.
               * Safe here because nothing animates this element's `transform` —
               * unlike the wave field beside it.
               */
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${PORTRAIT_GLASS}`}
              style={{ width: PORTRAIT_SIZE, height: PORTRAIT_SIZE }}
            />
          </div>
        </div>

        <div
          className="relative z-3 flex flex-col items-center"
          style={{ marginTop: "clamp(10px, 2.4vh, 26px)", gap: STACK_GAP }}
        >
          <p className="font-mono text-[10px] font-medium uppercase leading-none tracking-[0.34em] text-ink-faint">
            {profile.eyebrow}
          </p>

          {/*
            Was `clamp(42px, 9.4vw, 150px)`, sized for the single word "Alwin".
            The full name is four words and ~9.1em wide, so 9.4vw ran it into
            the edges and 150px made it the only thing on screen. The `vh` term
            is what keeps it off the socials row on a short display.
          */}
          <h1
            className="m-0 bg-gradient-to-b from-white from-[12%] to-[#9ea3ac] to-[96%] bg-clip-text text-center font-display text-[clamp(26px,min(5.6vw,10.6vh),74px)] font-semibold leading-[0.9] tracking-[-0.045em] text-transparent"
            style={{ textShadow: "0 0.2em 0.6em rgb(255 255 255 / 0.06)" }}
          >
            {profile.name}
          </h1>

          <p className="m-0 text-center font-display text-[clamp(15px,1.5vw,22px)] font-semibold leading-[1.3] tracking-[-0.01em] text-[#e4e6e9]">
            {profile.role}
          </p>

          {/*
            Root-relative and via `next/link`, like every other internal link —
            even though the hero only ever renders on `/`.
          */}
          <div
            className="flex flex-wrap justify-center gap-3"
            style={{ marginTop: "clamp(6px, 1.6vh, 14px)" }}
          >
            <Link
              href="/#projects"
              className="rounded-pill bg-ink px-[22px] py-3 font-mono text-[12.5px] font-semibold leading-none tracking-[0.04em] text-void transition-all duration-200 hover:-translate-y-px hover:shadow-[0_12px_30px_rgb(255_255_255/0.14)]"
            >
              View work
            </Link>
            <Link
              href="/#contact"
              className="rounded-pill border border-[rgb(255_255_255/0.12)] bg-glass px-[22px] py-3 font-mono text-[12.5px] font-semibold leading-none tracking-[0.04em] text-[#e4e6e9] backdrop-blur-[var(--glass-blur)] transition-colors duration-300 hover:bg-glass-hover hover:text-ink-bright"
            >
              Get in touch
            </Link>
          </div>

          {/* The row the whole height budget above exists to keep on screen. */}
          <div
            className="flex flex-wrap items-center justify-center gap-[14px]"
            style={{ marginTop: "clamp(10px, 2vh, 20px)" }}
          >
            {linkedin ? (
              <a href={linkedin.href} aria-label="LinkedIn profile" className={socialTile}>
                <BrandIcon name="linkedin" className="size-[15px]" />
              </a>
            ) : null}
            {github ? (
              <a href={github.href} aria-label="GitHub profile" className={socialTile}>
                <BrandIcon name="github" className="size-[15px]" />
              </a>
            ) : null}
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-2 border-b border-[rgb(255_255_255/0.16)] pb-[3px] font-mono text-[12.5px] leading-none tracking-[0.02em] text-ink-muted transition-colors duration-300 hover:border-[rgb(255_255_255/0.5)] hover:text-ink-bright"
            >
              <MailIcon className="size-[13px]" />
              {profile.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

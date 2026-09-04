"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { ResumeMeta } from "@portfolio/shared";

import { EmailLink } from "@/components/ui/EmailLink";
import { Logo } from "@/components/ui/Logo";
import { CloseIcon, DownloadIcon, MailIcon, MenuIcon } from "@/components/ui/icons";
import { resumeUrl } from "@/lib/api";
import { cn } from "@/lib/cn";

/**
 * Every destination is now its own route, so the active item is a plain
 * pathname match.
 *
 * This used to carry `kind: "route" | "section"` with an IntersectionObserver
 * scroll spy for the home-page anchors. Research was the last section entry;
 * once it became a route, TypeScript pointed out that the section branch was
 * unreachable. Widening the type just to keep unreachable code compiling would
 * have made the types claim something the data no longer supports, so the spy
 * is gone — git has it if an anchor entry is ever wanted again.
 */
const NAV = [
  { key: "home", label: "Portfolio", href: "/" },
  { key: "experience", label: "Experience", href: "/experience" },
  { key: "projects", label: "Projects", href: "/projects" },
  { key: "research", label: "Research", href: "/research" },
] as const;

const linkClass =
  "relative z-10 whitespace-nowrap rounded-pill px-[17px] py-[10px] font-display text-[13.5px] font-medium leading-none tracking-[-0.005em] transition-colors duration-300";

export function SiteNav({ email, resume }: { email: string; resume: ResumeMeta }) {
  const pathname = usePathname();

  /*
   * The menu remembers which route it was opened on, so navigating away closes
   * it by derivation rather than by resetting state from an effect — which
   * would be a cascading render, and misses browser back/forward if you only
   * clear it from the link's onClick.
   */
  const [menu, setMenu] = useState({ open: false, path: pathname });
  const menuOpen = menu.open && menu.path === pathname;

  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const previousRect = useRef<DOMRect | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const active = NAV.find((item) => item.href === pathname)?.key;

  /*
   * The indicator is a single element that glides between links (FLIP: measure
   * the old box, jump to the new one, animate the difference away).
   */
  const positionIndicator = useCallback(
    (animate: boolean) => {
      const list = listRef.current;
      const indicator = indicatorRef.current;
      if (!list || !indicator) return;

      const listBox = list.getBoundingClientRect();

      // Below `md` the link row is `display: none`, so every rect measures zero.
      // Writing that through would collapse the pill to 0x0.
      if (listBox.width === 0) {
        indicator.style.opacity = "0";
        previousRect.current = null;
        return;
      }

      const target = active
        ? list.querySelector<HTMLElement>(`[data-nav="${active}"]`)
        : null;
      if (!target) {
        // Nothing is active at the top of the home page, now that About is gone.
        indicator.style.opacity = "0";
        previousRect.current = null;
        return;
      }

      const box = target.getBoundingClientRect();
      // The indicator lives inside the list's scrollable content, so the
      // viewport-relative delta has to be offset by however far it is scrolled.
      const next = new DOMRect(
        box.left - listBox.left + list.scrollLeft,
        box.top - listBox.top,
        box.width,
        box.height,
      );

      indicator.style.opacity = "1";
      indicator.style.width = `${next.width}px`;
      indicator.style.height = `${next.height}px`;
      indicator.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;

      const previous = previousRect.current;
      previousRect.current = next;

      if (!animate) return;
      if (!previous || previous.width === 0) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      indicator.animate(
        [
          {
            transform: `translate3d(${previous.x}px, ${previous.y}px, 0)`,
            width: `${previous.width}px`,
            height: `${previous.height}px`,
          },
          {
            transform: `translate3d(${next.x}px, ${next.y}px, 0)`,
            width: `${next.width}px`,
            height: `${next.height}px`,
          },
        ],
        { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    },
    [active],
  );

  useLayoutEffect(() => {
    positionIndicator(true);
  }, [positionIndicator]);

  /*
   * Crossing the `md` breakpoint has to re-measure.
   *
   * `active` doesn't change on resize, so the layout effect above never re-runs
   * — the pill would keep the 0×0 it was given while the row was hidden, and
   * come back from a phone width invisible. Snap rather than animate: this is a
   * layout correction, not a navigation.
   */
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(() => positionIndicator(false));
    observer.observe(list);
    return () => observer.disconnect();
  }, [positionIndicator]);

  const closeMenu = useCallback(() => {
    setMenu((current) => ({ ...current, open: false }));
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || menuButtonRef.current?.contains(target)) {
        return;
      }
      setMenu((current) => ({ ...current, open: false }));
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    // Move focus into the panel so the menu is usable from the keyboard.
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen, closeMenu]);

  return (
    <div className="fixed left-1/2 top-[22px] z-60 flex max-w-[calc(100vw-20px)] -translate-x-1/2 flex-col items-center">
      <nav
        aria-label="Primary"
        className="flex max-w-full flex-nowrap items-center justify-center gap-1 rounded-pill border border-line bg-[rgb(24_25_28/0.6)] py-2 pl-[14px] pr-[10px] shadow-nav backdrop-blur-[var(--glass-blur)] backdrop-saturate-[1.4]"
      >
        <Link
          href="/"
          // Matches the nav item's label — the logo and that link go to the
          // same place, so they shouldn't announce two different names.
          aria-label="Portfolio"
          className="mr-2 flex size-[34px] shrink-0 items-center justify-center rounded-full text-ink transition-opacity hover:opacity-80"
        >
          <Logo className="size-[30px]" />
        </Link>

        {/* Hidden below `md`, where the hamburger takes over. */}
        <div
          ref={listRef}
          className="relative hidden flex-nowrap items-center justify-start gap-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden"
        >
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 rounded-pill bg-ink opacity-0"
          />
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              data-nav={item.key}
              aria-current={active === item.key ? "page" : undefined}
              className={cn(
                linkClass,
                active === item.key
                  ? "text-void"
                  : "text-ink-faint hover:bg-glass hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div aria-hidden="true" className="mx-2 h-[22px] w-px shrink-0 bg-[rgb(255_255_255/0.1)]" />

        <EmailLink
          email={email}
          className="flex size-[34px] shrink-0 items-center justify-center rounded-full border border-[rgb(255_255_255/0.12)] text-ink-muted transition-colors duration-300 hover:border-line-strong hover:bg-glass hover:text-ink-bright"
        >
          <MailIcon className="size-4" />
          <span className="sr-only">Email {email}</span>
        </EmailLink>

        {/*
          Always present, as in the design. The label collapses to just the
          download glyph below `sm` — at 375px the full pill eats the room the
          rest of the bar needs.
        */}
        <a
          href={resumeUrl}
          {...(resume.available
            ? { download: resume.filename ?? "resume.pdf" }
            : { title: "CV PDF hasn't been published yet" })}
          aria-label={resume.available ? "Download CV (PDF)" : "CV"}
          className="inline-flex shrink-0 items-center gap-[9px] whitespace-nowrap rounded-pill border border-[rgb(255_255_255/0.14)] bg-[rgb(255_255_255/0.06)] px-3 py-[10px] font-display text-[13px] font-medium leading-none text-ink transition-colors duration-300 hover:border-line-strong hover:bg-glass-hover hover:text-ink-bright sm:px-[18px]"
        >
          <span className="hidden sm:inline">CV</span>
          <DownloadIcon className="size-[13px]" />
        </a>

        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMenu({ open: !menuOpen, path: pathname })}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="ml-1 flex size-[34px] shrink-0 items-center justify-center rounded-full border border-[rgb(255_255_255/0.12)] text-ink-muted transition-colors duration-300 hover:border-line-strong hover:bg-glass hover:text-ink-bright md:hidden"
        >
          {menuOpen ? <CloseIcon className="size-[17px]" /> : <MenuIcon className="size-[17px]" />}
        </button>
      </nav>

      {/*
        Drops beneath the pill on the same glass recipe. Rendered only when open
        so its links stay out of the tab order the rest of the time — the desktop
        row above is the canonical copy for assistive tech at wider widths.
      */}
      {menuOpen ? (
        <div
          ref={panelRef}
          id="site-menu"
          className="mt-2 w-[min(320px,calc(100vw-20px))] origin-top rounded-panel border border-line bg-[rgb(20_21_24/0.92)] p-2 shadow-nav backdrop-blur-[var(--glass-blur)] backdrop-saturate-[1.4] motion-safe:animate-[reveal-rise_0.28s_var(--ease-out-soft)_both] md:hidden"
        >
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {NAV.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={active === item.key ? "page" : undefined}
                  onClick={() => setMenu((current) => ({ ...current, open: false }))}
                  className={cn(
                    "block rounded-[14px] px-4 py-3 font-display text-[15px] font-medium tracking-[-0.005em] transition-colors duration-200",
                    active === item.key
                      ? "bg-ink text-void"
                      : "text-ink-muted hover:bg-glass hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

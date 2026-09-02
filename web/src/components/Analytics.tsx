"use client";

import { useEffect } from "react";


/**
 * Reports one pageview per navigation.
 *
 * There is no third-party script and no cookie: the API stores a path, a
 * referrer host and a daily-rotating salted hash. Browsers sending DNT or
 * Global Privacy Control are skipped here as well as server-side, so an
 * opted-out visitor doesn't even make the request.
 */
/**
 * Paths already reported in this document.
 *
 * Module scope on purpose. React's StrictMode mounts effects twice in
 * development, and any future remount would do the same — without this guard
 * a single visit shows up as two pageviews, which was observable in the
 * database during development.
 */
const reported = new Set<string>();

export function Analytics() {
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;

    const path = window.location.pathname;
    if (reported.has(path)) return;
    reported.add(path);

    void fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path,
        referrer: document.referrer || undefined,
      }),
    }).catch(() => {
      // Analytics is never worth surfacing an error for.
    });
  }, []);

  return null;
}

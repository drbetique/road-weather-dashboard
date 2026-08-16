"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps data fresh without the user reaching for reload.
 *
 * A bare setInterval is not enough on its own. Browsers — mobile ones
 * especially — throttle or suspend timers in a backgrounded tab, and a page
 * restored from the back/forward cache comes back with its timers dead. The
 * result is a dashboard showing readings from whenever the phone was last
 * unlocked.
 *
 * So the interval is paired with the events that mean "the user is looking at
 * this again": visibilitychange, window focus, bfcache restore, and regaining
 * a connection. Each triggers an immediate refresh.
 *
 * While the page is hidden the interval skips its work, which keeps a phone in
 * a pocket from spending battery and free-tier request quota on data nobody is
 * reading.
 */
export function useLiveRefresh(
  refresh: () => void | Promise<void>,
  intervalMs: number,
  enabled = true
): void {
  // Held in a ref so a re-created callback does not tear down the listeners.
  // Written in an effect rather than during render: a ref mutated mid-render
  // can be torn between React's render and commit phases.
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  const lastRunRef = useRef(0);

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    /**
     * Several wake events fire together — returning to a tab emits both
     * visibilitychange and focus — so collapse anything inside this window
     * into a single request.
     */
    const MIN_GAP_MS = 5_000;

    const run = (force: boolean) => {
      const now = Date.now();
      if (!force && now - lastRunRef.current < MIN_GAP_MS) return;
      lastRunRef.current = now;
      void refreshRef.current();
    };

    const onWake = () => {
      if (document.visibilityState === "visible") run(false);
    };

    const onPageShow = (event: PageTransitionEvent) => {
      // persisted means the page came from the back/forward cache with its
      // timers frozen, so the data on screen is as old as the last visit.
      if (event.persisted) run(true);
    };

    const id = setInterval(() => {
      if (document.visibilityState === "visible") run(true);
    }, intervalMs);

    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("online", onWake);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("online", onWake);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [enabled, intervalMs]);
}

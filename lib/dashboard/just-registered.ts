'use client';

import { useSyncExternalStore } from 'react';

/**
 * One-shot hand-off from the end of the registration flow to the dashboard.
 *
 * Finishing registration leaves the SPA entirely (`window.location.href`), so
 * React state cannot carry "this person just signed up" across the hop - the
 * dashboard boots fresh and would greet a brand-new participant with "Welcome
 * back". A flag in `sessionStorage` survives the navigation and nothing else:
 * it is scoped to the tab that did the registering, and the dashboard consumes
 * it on arrival, so the congratulations show exactly once and every later visit
 * falls back to the usual greeting.
 */
const KEY = 'trsyp:just-registered';

/** Called as registration completes, right before leaving for the dashboard. */
export function markJustRegistered(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    // Private mode / storage disabled - the greeting is cosmetic, so a failure
    // here just means the participant sees the regular welcome instead.
  }
}

/**
 * Answer for this page load, resolved on first read and then frozen. Caching it
 * is what makes the flag one-shot *and* makes `snapshot` a stable value React
 * can read as often as it likes without the answer changing mid-render.
 */
let cached: boolean | null = null;

function snapshot(): boolean {
  if (cached === null) {
    try {
      cached = sessionStorage.getItem(KEY) !== null;
      // Clear on read: a refresh, a back-navigation, or any later visit in this
      // tab must fall through to the regular greeting.
      if (cached) sessionStorage.removeItem(KEY);
    } catch {
      cached = false;
    }
  }
  return cached;
}

const emptySubscribe = () => () => {};

/**
 * `true` only on the dashboard visit that directly follows registering.
 *
 * Built like `useHydrated`: the server snapshot is always `false`, so the
 * prerendered markup and the hydrating render agree and React swaps in the real
 * answer right after - no hydration warning, and no `setState` in an effect.
 */
export function useJustRegistered(): boolean {
  return useSyncExternalStore(emptySubscribe, snapshot, () => false);
}

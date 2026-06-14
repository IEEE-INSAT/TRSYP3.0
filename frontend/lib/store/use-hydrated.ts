'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns `false` during SSR and the first client render, then `true` once the
 * client has mounted — without calling `setState` inside an effect. Use it to
 * gate rendering of client-only state (e.g. persisted Zustand stores) so the
 * server markup and first client render match and there is no hydration warning.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

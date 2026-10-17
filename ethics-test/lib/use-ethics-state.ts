'use client';

import { useEffect, useState } from 'react';
import { api, type EthicsState } from './api';

/**
 * The moderators' current step, re-read every few seconds and as soon as the
 * tab comes back into view. `stale` is true while the last read failed - the
 * last known state is kept meanwhile.
 *
 * `setState` lets the control page show its own change at once. A value
 * older than the one already shown is ignored: the CDN may still serve the
 * previous state for a few seconds after a change.
 */
export function useEthicsState(pollMs = 3000) {
  const [state, setStateRaw] = useState<EthicsState | null>(null);
  const [stale, setStale] = useState(false);

  const setState = (next: EthicsState) =>
    setStateRaw((prev) => (prev && next.updatedAt < prev.updatedAt ? prev : next));

  useEffect(() => {
    let cancelled = false;

    const read = async () => {
      try {
        const next = await api.getState();
        if (cancelled) return;
        setStateRaw((prev) => (prev && next.updatedAt < prev.updatedAt ? prev : next));
        setStale(false);
      } catch {
        if (!cancelled) setStale(true);
      }
    };

    void read();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void read();
    }, pollMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void read();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pollMs]);

  return { state, stale, setState };
}

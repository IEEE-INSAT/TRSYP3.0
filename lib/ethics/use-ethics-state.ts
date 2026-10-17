'use client';

import { useEffect, useState } from 'react';
import { ethicsService } from '@/lib/api/ethics.service';
import type { EthicsState } from '@/lib/api/types';

/** How often a screen asks which scenario the moderators are on. */
const POLL_MS = 2500;

/**
 * The moderators' current step, re-read every few seconds and as soon as the
 * tab comes back into view. `stale` is true while the last read failed - the
 * last known state is kept meanwhile.
 */
export function useEthicsState(pollMs = POLL_MS) {
  const [state, setState] = useState<EthicsState | null>(null);
  const [stale, setStale] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const read = async () => {
      try {
        const next = await ethicsService.getState();
        if (cancelled) return;
        setState(next);
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
  }, [pollMs, refreshKey]);

  /** Re-read now and restart the timer, e.g. right after a moderator change. */
  const refresh = () => setRefreshKey((k) => k + 1);

  return { state, stale, setState, refresh };
}

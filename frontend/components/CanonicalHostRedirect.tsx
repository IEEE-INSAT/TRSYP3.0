'use client';

import { useEffect } from 'react';

const LEGACY_HOSTS = new Set(['trsyp.ieee.tn', 'www.trsyp.ieee.tn']);
const CANONICAL_HOST = 'rtc.ieee.tn';

/**
 * The site is a static export, so it cannot inspect request hosts on a server.
 * This client-side guard keeps legacy links on the canonical RTC hostname.
 */
export function CanonicalHostRedirect() {
  useEffect(() => {
    if (!LEGACY_HOSTS.has(window.location.hostname.toLowerCase())) return;

    const destination = new URL(window.location.href);
    destination.protocol = 'https:';
    destination.host = CANONICAL_HOST;
    window.location.replace(destination.toString());
  }, []);

  return null;
}

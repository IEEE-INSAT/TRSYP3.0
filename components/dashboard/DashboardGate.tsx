'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { hasFullAvatar } from '@/lib/avatar';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRegistrationStore } from '@/lib/store/registration-store';
import { AVATAR_SECTION_HREF, activeSection } from '@/lib/dashboard/sections';

/**
 * Holds a registered participant on the avatar section until they have created
 * one. The avatar used to be demanded before registration, which meant the very
 * first thing a stranger met was a 20-field character editor; it now sits after
 * the ticket is bought, where it reads as setup rather than as a toll.
 *
 * Scope is deliberately the dashboard only. Elsewhere on the site a missing
 * avatar is harmless - `UserAvatar` falls back to initials.
 */
export default function DashboardGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const initialized = useAuthStore((state) => state.initialized);
  const account = useAuthStore((state) => state.account);
  const hydrating = useRegistrationStore((state) => state.hydrating);

  const section = activeSection(pathname);
  const needsAvatar = !!account && !hasFullAvatar(account.avatar);

  useEffect(() => {
    // Same settle guard the dashboard itself uses: `hydrateFromBackend` leaves
    // the profile briefly incomplete, and redirecting into an in-flight
    // navigation makes both abort ("this page couldn't load").
    if (!initialized || hydrating) return;
    if (!needsAvatar) return;
    // A section we don't recognise (a future sub-route) is left alone rather
    // than swallowed by the gate.
    if (!section?.gated) return;

    router.replace(AVATAR_SECTION_HREF);
  }, [initialized, hydrating, needsAvatar, section, router]);

  // Don't paint a gated section for a frame before the redirect lands.
  if (initialized && !hydrating && needsAvatar && section?.gated) return null;

  return <>{children}</>;
}

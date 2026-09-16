'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { hasFullAvatar } from '@/lib/avatar';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRegistrationStore } from '@/lib/store/registration-store';
import { AVATAR_SECTION_HREF, activeSection } from '@/lib/dashboard/sections';
import LoadingScreen from '@/components/LoadingScreen';

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
  // A section we don't recognise (a future sub-route) is left alone rather than
  // swallowed by the gate.
  const gatedHere = !!section?.gated;
  // `hydrateFromBackend` leaves the profile briefly incomplete, and redirecting
  // into an in-flight navigation makes both abort ("this page couldn't load"),
  // so the *redirect* waits for the stores to settle - the same guard the
  // dashboard itself uses.
  const settled = initialized && !hydrating;

  useEffect(() => {
    if (!settled || !needsAvatar || !gatedHere) return;
    router.replace(AVATAR_SECTION_HREF);
  }, [settled, needsAvatar, gatedHere, router]);

  // Withholding the section, though, must NOT wait for `settled`. It used to,
  // which left the overview painted for the whole settling window before the
  // redirect could fire - the dashboard appearing for a moment and then being
  // yanked away. As soon as we know an avatar is missing there is no version of
  // this page the user gets to keep, so we show the loading screen instead and
  // the hand-off to the editor reads as one continuous step.
  if (needsAvatar && gatedHere) return <LoadingScreen message="Setting up your avatar" />;

  return <>{children}</>;
}

'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from './auth-store';
import { useHydrated } from './use-hydrated';

/**
 * Initializes auth state on mount and gates rendering until the client has
 * hydrated. Returning `null` on the first paint keeps the server markup and the
 * first client render identical (both empty), which avoids hydration mismatches
 * for components that read the persisted registration store.
 *
 * Note: this used to also force every avatar-less user to `/avatar` from
 * anywhere on the site. That gate now lives in `DashboardGate` and only applies
 * inside the dashboard, so the avatar is asked for after registration rather
 * than as the price of signing in.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();

  useEffect(() => {
    void useAuthStore.getState().initialize();
  }, []);

  if (!hydrated) return null;
  return <>{children}</>;
}

'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from './auth-store';
import { useHydrated } from './use-hydrated';

/**
 * Initializes auth state on mount and gates rendering until the client has
 * hydrated. Returning `null` on the first paint keeps the server markup and the
 * first client render identical (both empty), which avoids hydration mismatches
 * for components that read the persisted registration store.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();

  useEffect(() => {
    void useAuthStore.getState().initialize();
  }, []);

  if (!hydrated) return null;
  return <>{children}</>;
}

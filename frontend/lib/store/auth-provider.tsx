'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from './auth-store';

/**
 * Initializes auth state on mount. Does NOT gate rendering — the page renders
 * immediately with its static/prerendered content, and auth state resolves in
 * the background. Components that read persisted, client-only state (e.g. the
 * registration store) are responsible for guarding their own hydration
 * mismatch locally with `useHydrated()`, instead of the whole app paying for
 * a blank first paint on every single page.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useAuthStore.getState().initialize();
  }, []);

  return <>{children}</>;
}

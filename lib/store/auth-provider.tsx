'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  const router = useRouter();
  const pathname = usePathname();
  const initialized = useAuthStore((state) => state.initialized);
  const accessToken = useAuthStore((state) => state.accessToken);
  const account = useAuthStore((state) => state.account);

  useEffect(() => {
    void useAuthStore.getState().initialize();
  }, []);

  useEffect(() => {
    if (
      initialized &&
      accessToken &&
      account &&
      !account.avatar &&
      pathname !== '/avatar' &&
      !pathname.startsWith('/verify-email') &&
      !pathname.startsWith('/auth/callback')
    ) {
      router.replace('/avatar');
    }
  }, [account, accessToken, initialized, pathname, router]);

  if (!hydrated) return null;
  return <>{children}</>;
}

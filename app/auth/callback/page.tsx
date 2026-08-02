'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { waitForEmailCallbackSession } from '@/lib/supabase/email-callback';
import { useRegistrationStore } from '@/lib/store';
import { useAuthStore } from '@/lib/store/auth-store';
import { authService } from '@/lib/api/auth.service';
import { clearNext, readNext, resolvePostAuth } from '@/lib/auth/post-auth';
import LoadingScreen from '@/components/LoadingScreen';

/**
 * Landing route for auth round-trips that leave the site - currently the Google
 * OAuth redirect. It establishes the session, reconciles the backend profile so
 * we know whether this is an existing participant, and then forwards to the
 * route the user was originally heading for.
 *
 * Its whole reason to exist is that this decision cannot be made before the
 * redirect: the React state holding the destination is gone by the time we get
 * here, and "already registered → dashboard" is only knowable after the profile
 * comes back.
 */
export default function AuthCallbackPage() {
  // Resolved during render rather than in the effect: with no Supabase client
  // there is nothing to wait for, and the answer is already known.
  const [failure, setFailure] = useState<string | null>(() =>
    getSupabaseClient()
      ? null
      : 'Supabase authentication is not configured.',
  );

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let cancelled = false;
    // Read before anything async - the URL is about to change.
    const next = readNext();

    void (async () => {
      const { session, error } = await waitForEmailCallbackSession(supabase);
      if (cancelled) return;
      if (!session) {
        setFailure(error ?? 'Supabase did not return a session.');
        return;
      }
      useAuthStore.setState({
        accessToken: session.access_token,
        email: session.user.email ?? null,
      });

      try {
        const account = await authService.getMe(session.access_token);
        useAuthStore.setState({ account });
      } catch {
        setFailure(
          'Your session was created, but the TRSYP API could not load your account.',
        );
        return;
      }
      // Settle the registration profile so an existing participant goes to
      // their dashboard instead of being walked through Step 1 again.
      await useRegistrationStore.getState().hydrateFromBackend();
      if (cancelled) return;

      clearNext();
      const destination = resolvePostAuth({
        isRegistered: useRegistrationStore.getState().isRegistered,
        next,
      });
      // `replace` so Back doesn't bounce the user through the callback again.
      window.location.replace(destination);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!failure) return <LoadingScreen message="Signing you in…" />;

  return (
    <main className="trsyp-auth-page">
      <section className="trsyp-auth-card" aria-live="polite">
        <h1>Could not finish signing in</h1>
        <p>
          {failure} Return to the home page and try signing in again.
        </p>
        <Link className="trsyp-auth-page-link" href="/">
          Return to TRSYP 3.0
        </Link>
      </section>
    </main>
  );
}

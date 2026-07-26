'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { waitForEmailCallbackSession } from '@/lib/supabase/email-callback';
import { useRegistrationStore } from '@/lib/store';
import { clearNext, readNext, resolvePostAuth } from '@/lib/auth/post-auth';
import LoadingScreen from '@/components/LoadingScreen';

/**
 * Landing route for auth round-trips that leave the site — currently the Google
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
  const [failed, setFailed] = useState(() => getSupabaseClient() === null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let cancelled = false;
    // Read before anything async — the URL is about to change.
    const next = readNext();

    void (async () => {
      const { session } = await waitForEmailCallbackSession(supabase);
      if (cancelled) return;
      if (!session) {
        setFailed(true);
        return;
      }

      // Settle the registration profile first, so an existing participant goes
      // to their dashboard instead of being walked through Step 1 again.
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

  if (!failed) return <LoadingScreen message="Signing you in…" />;

  return (
    <main className="trsyp-auth-page">
      <section className="trsyp-auth-card" aria-live="polite">
        <h1>Sign-in link unavailable</h1>
        <p>
          We could not complete your sign-in. The link may have expired — please
          try again from the TRSYP 3.0 home page.
        </p>
        <Link className="trsyp-auth-page-link" href="/">
          Return to TRSYP 3.0
        </Link>
      </section>
    </main>
  );
}

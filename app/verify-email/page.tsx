'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { waitForEmailCallbackSession } from '@/lib/supabase/email-callback';
import { useRegistrationStore } from '@/lib/store';
import { clearNext, readNext, resolvePostAuth } from '@/lib/auth/post-auth';

type VerificationState = 'checking' | 'verified' | 'invalid';

export default function VerifyEmailPage() {
  const [state, setState] = useState<VerificationState>(() =>
    getSupabaseClient() ? 'checking' : 'invalid',
  );
  const [destination, setDestination] = useState('/register');
  // The verification link already establishes a session, so there is nothing
  // left for the user to do by hand — continue them into the flow they were in.
  const continued = useRef(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let mounted = true;
    // Read before any await: consuming the callback strips the query string,
    // which would take `?next=` with it.
    const next = readNext();

    const checkVerification = async () => {
      const { session, error } = await waitForEmailCallbackSession(supabase);
      if (!mounted) return;

      const verified = !error && !!session?.user.email_confirmed_at;
      setState(verified ? 'verified' : 'invalid');
      if (!verified || continued.current) return;
      continued.current = true;

      await useRegistrationStore.getState().hydrateFromBackend();
      if (!mounted) return;

      clearNext();
      const target = resolvePostAuth({
        isRegistered: useRegistrationStore.getState().isRegistered,
        next,
      });
      setDestination(target);
      // Short beat so the "Email verified" confirmation is actually readable.
      setTimeout(() => {
        if (mounted) window.location.replace(target);
      }, 1500);
    };

    void checkVerification();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void checkVerification();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="trsyp-auth-page">
      <section className="trsyp-auth-card" aria-live="polite">
        {state === 'checking' && (
          <>
            <h1>Verifying your email</h1>
            <p>Please wait while we activate your TRSYP 3.0 account.</p>
          </>
        )}
        {state === 'verified' && (
          <>
            <h1>Email verified</h1>
            <p>
              Your TRSYP 3.0 account is active. Taking you back to where you
              left off…
            </p>
            <Link className="trsyp-auth-page-link" href={destination}>
              Continue
            </Link>
          </>
        )}
        {state === 'invalid' && (
          <>
            <h1>Verification link unavailable</h1>
            <p>
              This link may be invalid or expired. Return to TRSYP 3.0 and
              create your account again.
            </p>
            <Link className="trsyp-auth-page-link" href="/">
              Return to TRSYP 3.0
            </Link>
          </>
        )}
      </section>
    </main>
  );
}

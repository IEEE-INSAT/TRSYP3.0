'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { consumeEmailCallback } from '@/lib/supabase/email-callback';

type VerificationState = 'checking' | 'verified' | 'invalid';

export default function VerifyEmailPage() {
  const [state, setState] = useState<VerificationState>('checking');

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setState('invalid');
      return;
    }

    let mounted = true;
    const checkVerification = async () => {
      const callbackError = await consumeEmailCallback(supabase);
      if (callbackError) {
        if (mounted) setState('invalid');
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      setState(
        !error && data.session?.user.email_confirmed_at
          ? 'verified'
          : 'invalid',
      );
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
              Your TRSYP 3.0 account is active. You can now log in and continue
              your registration.
            </p>
            <a className="trsyp-auth-page-link" href="/">
              Go to TRSYP 3.0
            </a>
          </>
        )}
        {state === 'invalid' && (
          <>
            <h1>Verification link unavailable</h1>
            <p>
              This link may be invalid or expired. Return to TRSYP 3.0 and
              create your account again.
            </p>
            <a className="trsyp-auth-page-link" href="/">
              Return to TRSYP 3.0
            </a>
          </>
        )}
      </section>
    </main>
  );
}

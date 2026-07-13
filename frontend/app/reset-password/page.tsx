'use client';

import { FormEvent, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Include an uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Include a lowercase letter.';
  if (!/\d/.test(password)) return 'Include a number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Include a special character.';
  return null;
}

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Password reset is not configured.');
      return;
    }

    let mounted = true;
    const checkSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!mounted) return;

      if (sessionError || !data.session) {
        setError(
          'This password-reset link is invalid or expired. Request a new one from Log In.',
        );
        return;
      }

      setReady(true);
    };

    void checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) setReady(true);
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Password reset is not configured.');
      return;
    }

    setSubmitting(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    setComplete(true);
    setSubmitting(false);
  };

  return (
    <main className="trsyp-auth-page">
      <section className="trsyp-auth-card" aria-live="polite">
        <h1>{complete ? 'Password updated' : 'Set a new password'}</h1>
        {complete ? (
          <>
            <p>
              Your TRSYP 3.0 password has been updated. You can now log in with
              it.
            </p>
            <a className="trsyp-auth-page-link" href="/">
              Go to TRSYP 3.0
            </a>
          </>
        ) : error && !ready ? (
          <>
            <p>{error}</p>
            <a className="trsyp-auth-page-link" href="/">
              Return to Log In
            </a>
          </>
        ) : !ready ? (
          <p>Preparing your secure password reset…</p>
        ) : (
          <form className="trsyp-form" onSubmit={handleSubmit}>
            <div className="trsyp-form-group">
              <label className="trsyp-label" htmlFor="new-password">
                New password
              </label>
              <input
                id="new-password"
                className="trsyp-input"
                type="password"
                name="new-password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="trsyp-form-group">
              <label className="trsyp-label" htmlFor="confirm-password">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                className="trsyp-input"
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
              />
            </div>
            {error && <p className="trsyp-field-error">{error}</p>}
            <button
              className="trsyp-auth-page-link"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

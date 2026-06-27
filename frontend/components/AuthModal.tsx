'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { getSupabaseClient } from '@/lib/supabase/client';

// ── Validation helpers ──────────────────────────────────────────────────────

/**
 * Map of mistyped email domains → correct domain.
 * Covers the most popular providers with their common misspellings.
 */
const DOMAIN_TYPO_MAP: Record<string, string> = {
  // Gmail
  'gmaail.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmial.com': 'gmail.com',
  'gmali.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com', 'gmill.com': 'gmail.com', 'gmil.com': 'gmail.com',
  'gmaill.com': 'gmail.com', 'gmaiil.com': 'gmail.com', 'gmaul.com': 'gmail.com',
  'gmale.com': 'gmail.com', 'gmeil.com': 'gmail.com', 'gmaile.com': 'gmail.com',
  'gimail.com': 'gmail.com', 'gmaol.com': 'gmail.com', 'gemail.com': 'gmail.com',
  'ggmail.com': 'gmail.com', 'gmailc.com': 'gmail.com', 'gmall.com': 'gmail.com',
  'gmaik.com': 'gmail.com', 'gamail.com': 'gmail.com', 'hmail.com': 'gmail.com',
  'g]mail.com': 'gmail.com',
  // Yahoo
  'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yhoo.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com', 'yaoo.com': 'yahoo.com', 'yahooo.fr': 'yahoo.fr',
  'yaho.fr': 'yahoo.fr', 'tahoo.com': 'yahoo.com', 'yaboo.com': 'yahoo.com',
  'yanoo.com': 'yahoo.com', 'uahoo.com': 'yahoo.com', 'yahho.com': 'yahoo.com',
  'yahhoo.com': 'yahoo.com', 'yahool.com': 'yahoo.com',
  // Hotmail
  'hotmal.com': 'hotmail.com', 'hotmial.com': 'hotmail.com', 'hotmil.com': 'hotmail.com',
  'hotmale.com': 'hotmail.com', 'hotamil.com': 'hotmail.com', 'hotmai.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com', 'hotmaul.com': 'hotmail.com', 'hotmall.com': 'hotmail.com',
  'hotmeil.com': 'hotmail.com', 'hotmaol.com': 'hotmail.com', 'hotnail.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com', 'hotmil.fr': 'hotmail.fr', 'hotmal.fr': 'hotmail.fr',
  // Outlook
  'outlok.com': 'outlook.com', 'outllok.com': 'outlook.com', 'outloo.com': 'outlook.com',
  'outlool.com': 'outlook.com', 'outloook.com': 'outlook.com', 'outlokk.com': 'outlook.com',
  'putlook.com': 'outlook.com', 'outlock.com': 'outlook.com', 'ourlook.com': 'outlook.com',
  'otulook.com': 'outlook.com', 'outlok.fr': 'outlook.fr',
  // iCloud
  'icoud.com': 'icloud.com', 'iclod.com': 'icloud.com', 'iclould.com': 'icloud.com',
  'icluod.com': 'icloud.com', 'iclould.com': 'icloud.com',
  // Live
  'live.co': 'live.com', 'liv.com': 'live.com',
  // Protonmail
  'protonmal.com': 'protonmail.com', 'protonmial.com': 'protonmail.com',
  'protonmaill.com': 'protonmail.com', 'protonail.com': 'protonmail.com',
};

/** Common TLD typos (applied after domain-level check). */
const TLD_TYPOS: Record<string, string> = {
  '.cpm': '.com', '.con': '.com', '.cmo': '.com', '.ocm': '.com', '.vom': '.com',
  '.xom': '.com', '.co,': '.com', '.comm': '.com', '.om': '.com',
  '.nt': '.net', '.nte': '.net', '.met': '.net', '.nett': '.net',
  '.ogr': '.org', '.prg': '.org', '.orgg': '.org',
  '.fre': '.fr', '.fe': '.fr',
};

/** Instant client-side checks (format + typo detection). */
function validateEmailFormat(value: string): string | null {
  if (!value) return 'Email is required.';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(value)) return 'Please enter a valid email address.';

  const lower = value.toLowerCase();
  const domain = lower.split('@')[1];

  // 1) Check against known domain misspellings
  if (domain && DOMAIN_TYPO_MAP[domain]) {
    const corrected = lower.replace(domain, DOMAIN_TYPO_MAP[domain]);
    return `Did you mean "${corrected}"?`;
  }

  // 2) Check for TLD typos
  for (const [typo, fix] of Object.entries(TLD_TYPOS)) {
    if (lower.endsWith(typo)) {
      return `Did you mean "${value.slice(0, -typo.length)}${fix}"?`;
    }
  }

  return null;
}

/** Async server-side check — verifies the domain has real MX records via DNS. */
async function validateEmailDomain(email: string): Promise<string | null> {
  try {
    const res = await fetch('/api/validate-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!data.valid) return data.reason || 'This email domain is not valid.';
    return null;
  } catch {
    // Network error — don't block the user, let the backend handle it
    return null;
  }
}

interface PasswordCheck {
  label: string;
  passed: boolean;
}

function getPasswordChecks(value: string): PasswordCheck[] {
  return [
    { label: 'At least 8 characters', passed: value.length >= 8 },
    { label: 'One uppercase letter (A–Z)', passed: /[A-Z]/.test(value) },
    { label: 'One lowercase letter (a–z)', passed: /[a-z]/.test(value) },
    { label: 'One digit (0–9)', passed: /\d/.test(value) },
    { label: 'One special character (!@#$…)', passed: /[^A-Za-z0-9]/.test(value) },
  ];
}

function validatePassword(value: string): string | null {
  if (!value) return 'Password is required.';
  const checks = getPasswordChecks(value);
  const failing = checks.filter((c) => !c.passed);
  if (failing.length > 0) return 'Password does not meet the requirements.';
  return null;
}

// ── Component ───────────────────────────────────────────────────────────────

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onRegister: () => void;
  pendingRoute?: string | null;
}

export default function AuthModal({ onClose, onSuccess, onRegister, pendingRoute }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field-level validation state
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Async email domain validation
  const [emailDomainError, setEmailDomainError] = useState<string | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const lastCheckedEmail = useRef('');

  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  // Instant (synchronous) checks
  const emailFormatError = useMemo(() => validateEmailFormat(email), [email]);
  const passwordError = useMemo(() => validatePassword(password), [password]);
  const passwordChecks = useMemo(() => getPasswordChecks(password), [password]);

  // Combined email error: format first, then domain
  const emailError = emailFormatError || emailDomainError;

  const { signIn, signUp } = useAuthStore();

  /** Run DNS MX check when the email field loses focus. */
  const handleEmailBlur = useCallback(async () => {
    setEmailTouched(true);

    // Skip DNS check if format is already invalid or if we already checked this value
    if (emailFormatError || !email || email === lastCheckedEmail.current) return;

    lastCheckedEmail.current = email;
    setEmailChecking(true);
    setEmailDomainError(null);

    const domainErr = await validateEmailDomain(email);
    setEmailDomainError(domainErr);
    setEmailChecking(false);
  }, [email, emailFormatError]);

  /** Reset touched state when switching between login / signup. */
  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setEmailTouched(false);
    setPasswordTouched(false);
    setEmailDomainError(null);
    setEmailChecking(false);
    setEmailConfirmationSent(false);
    lastCheckedEmail.current = '';
    setError(null);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Authentication is not configured.');
      setLoading(false);
      return;
    }
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: pendingRoute ? `${window.location.origin}${pendingRoute}` : window.location.origin,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
    // On success, Supabase redirects to Google — the page will reload after callback
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);

    // Instant format check
    if (emailFormatError) { setError(emailFormatError); return; }

    // Run async domain check if not done yet
    if (email !== lastCheckedEmail.current) {
      setEmailChecking(true);
      lastCheckedEmail.current = email;
      const domainErr = await validateEmailDomain(email);
      setEmailDomainError(domainErr);
      setEmailChecking(false);
      if (domainErr) { setError(domainErr); return; }
    } else if (emailDomainError) {
      setError(emailDomainError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);

    // Instant format check
    if (emailFormatError) { setError(emailFormatError); return; }
    if (passwordError) { setError(passwordError); return; }

    // Run async domain check if not done yet
    if (email !== lastCheckedEmail.current) {
      setEmailChecking(true);
      lastCheckedEmail.current = email;
      const domainErr = await validateEmailDomain(email);
      setEmailDomainError(domainErr);
      setEmailChecking(false);
      if (domainErr) { setError(domainErr); return; }
    } else if (emailDomainError) {
      setError(emailDomainError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await signUp({
        email,
        password,
        name: firstName.trim(),
        lastName: lastName.trim(),
        provider: 'email',
      });

      if (result.emailConfirmationPending) {
        // Supabase requires email verification — show confirmation message
        setEmailConfirmationSent(true);
      } else {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ains-overlay" onClick={onClose}>
      <div className="ains-popup" onClick={(e) => e.stopPropagation()}>
        <button className="ains-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {emailConfirmationSent ? (
          /* ── Email confirmation sent — success view ── */
          <div className="ains-confirmation">
            <div className="ains-confirmation-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h3 className="ains-popup-title" style={{ textAlign: 'center' }}>Check your email</h3>
            <p className="ains-confirmation-text">
              We&apos;ve sent a verification link to <strong>{email}</strong>. Please click the link to activate your account before logging in.
            </p>
            <button
              type="button"
              className="ains-btn-login"
              onClick={() => switchMode(true)}
              style={{ width: '100%' }}
            >
              Go to Login
            </button>
          </div>
        ) : (
          /* ── Normal auth forms ── */
          <>
            <div className="ains-popup-header">
              <h3 className="ains-popup-title">{isLogin ? 'Authenticate' : 'Create Account'}</h3>
              <p className="ains-popup-sub">{isLogin ? 'Access the restricted TRSYP portal.' : 'Join the TRSYP network.'}</p>
            </div>

            <button type="button" className="ains-btn-google" onClick={handleGoogleLogin} disabled={loading}>
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? 'Connecting...' : 'Connect with Google'}
            </button>

            <div className="ains-divider">
              <span>OR</span>
            </div>

            {error && <p style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '12px', textAlign: 'center' }}>{error}</p>}

            {isLogin ? (
              <form className="ains-form" onSubmit={handleLogin}>
                <div className="ains-form-group">
                  <label className="ains-label" htmlFor="ains-email">Email *</label>
                  <div className="ains-input-wrapper">
                    <input
                      id="ains-email"
                      className={`ains-input${emailTouched && emailError ? ' ains-input-error' : ''}`}
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailDomainError(null); lastCheckedEmail.current = ''; }}
                      onBlur={handleEmailBlur}
                      required
                    />
                  </div>
                  {emailChecking && (
                    <p className="ains-field-checking">Verifying email domain…</p>
                  )}
                  {emailTouched && !emailChecking && emailError && (
                    <p className="ains-field-error">{emailError}</p>
                  )}
                </div>
                <div className="ains-form-group">
                  <label className="ains-label" htmlFor="ains-password">Password *</label>
                  <div className="ains-input-wrapper">
                    <input
                      id="ains-password"
                      className="ains-input ains-input-pw"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="ains-pw-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password"
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07l14.14 14.14" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <button type="submit" className="ains-btn-login" disabled={loading}>{loading ? 'Logging in…' : 'Log In'}</button>
              </form>
            ) : (
              <form className="ains-form" onSubmit={handleSignup}>
                <div className="ains-row" style={{ display: 'flex', gap: '12px' }}>
                  <div className="ains-form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="ains-label" htmlFor="ains-first-name">First Name *</label>
                    <div className="ains-input-wrapper">
                      <input
                        id="ains-first-name"
                        className="ains-input"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="ains-form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="ains-label" htmlFor="ains-last-name">Last Name *</label>
                    <div className="ains-input-wrapper">
                      <input
                        id="ains-last-name"
                        className="ains-input"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="ains-form-group">
                  <label className="ains-label" htmlFor="ains-email-reg">Email *</label>
                  <div className="ains-input-wrapper">
                    <input
                      id="ains-email-reg"
                      className={`ains-input${emailTouched && emailError ? ' ains-input-error' : ''}`}
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailDomainError(null); lastCheckedEmail.current = ''; }}
                      onBlur={handleEmailBlur}
                      required
                    />
                  </div>
                  {emailChecking && (
                    <p className="ains-field-checking">Verifying email domain…</p>
                  )}
                  {emailTouched && !emailChecking && emailError && (
                    <p className="ains-field-error">{emailError}</p>
                  )}
                </div>
                <div className="ains-form-group">
                  <label className="ains-label" htmlFor="ains-password-reg">Password *</label>
                  <div className="ains-input-wrapper">
                    <input
                      id="ains-password-reg"
                      className={`ains-input ains-input-pw${passwordTouched && passwordError ? ' ains-input-error' : ''}`}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setPasswordTouched(true)}
                      required
                    />
                    <button
                      type="button"
                      className="ains-pw-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07l14.14 14.14" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Password strength checklist — always visible once user starts typing */}
                  {password.length > 0 && (
                    <ul className="ains-pw-checklist">
                      {passwordChecks.map((check) => (
                        <li key={check.label} className={check.passed ? 'ains-pw-pass' : 'ains-pw-fail'}>
                          <span className="ains-pw-icon">{check.passed ? '✓' : '✗'}</span>
                          {check.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button type="submit" className="ains-btn-login" disabled={loading}>{loading ? 'Creating…' : 'Create Account'}</button>
              </form>
            )}

            <div className="ains-popup-footer">
              {isLogin ? (
                <>Don&apos;t have an account? <button type="button" onClick={() => switchMode(false)} style={{ background: 'none', border: 'none', color: '#fff', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0, marginLeft: '4px' }}>Register here</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={() => switchMode(true)} style={{ background: 'none', border: 'none', color: '#fff', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0, marginLeft: '4px' }}>Log in here</button></>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

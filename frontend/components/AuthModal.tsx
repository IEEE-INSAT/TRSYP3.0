'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { getSupabaseClient } from '@/lib/supabase/client';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onRegister: () => void;
  pendingRoute?: string | null;
}

export default function AuthModal({ onClose, onSuccess, onRegister, pendingRoute }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn, signUp } = useAuthStore();

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
    setLoading(true);
    setError(null);
    try {
      const [firstName, ...rest] = fullName.trim().split(' ');
      await signUp({
        email,
        password,
        name: firstName || '',
        lastName: rest.join(' ') || '',
        provider: 'email',
      });
      onSuccess();
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
                  className="ains-input"
                  type="email"
                  placeholder="user@trsyp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="ains-form-group">
              <label className="ains-label" htmlFor="ains-password">Password *</label>
              <div className="ains-input-wrapper">
                <input
                  id="ains-password"
                  className="ains-input ains-input-pw"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
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
            <div className="ains-form-group">
              <label className="ains-label" htmlFor="ains-name">Full Name *</label>
              <div className="ains-input-wrapper">
                <input
                  id="ains-name"
                  className="ains-input"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="ains-form-group">
              <label className="ains-label" htmlFor="ains-email-reg">Email *</label>
              <div className="ains-input-wrapper">
                <input
                  id="ains-email-reg"
                  className="ains-input"
                  type="email"
                  placeholder="user@trsyp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="ains-form-group">
              <label className="ains-label" htmlFor="ains-password-reg">Password *</label>
              <div className="ains-input-wrapper">
                <input
                  id="ains-password-reg"
                  className="ains-input ains-input-pw"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>
            <button type="submit" className="ains-btn-login" disabled={loading}>{loading ? 'Creating…' : 'Create Account'}</button>
          </form>
        )}

        <div className="ains-popup-footer">
          {isLogin ? (
            <>Don&apos;t have an account? <button type="button" onClick={() => setIsLogin(false)} style={{ background: 'none', border: 'none', color: '#fff', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0, marginLeft: '4px' }}>Register here</button></>
          ) : (
            <>Already have an account? <button type="button" onClick={() => setIsLogin(true)} style={{ background: 'none', border: 'none', color: '#fff', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0, marginLeft: '4px' }}>Log in here</button></>
          )}
        </div>
      </div>
    </div>
  );
}

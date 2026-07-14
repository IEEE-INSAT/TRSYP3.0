'use client';

import { useState, useEffect, ReactNode } from 'react';
import { motion } from 'motion/react';
import { useAdminStore } from '@/lib/store';
import { useAuthStore } from '@/lib/store/auth-store';
import AuthModal from '../AuthModal';
import LoadingScreen from '../LoadingScreen';

/**
 * AdminGate — protects admin pages with real Supabase + backend authentication.
 *
 * Flow:
 * 1. Wait for auth store to initialise (avoid flash)
 * 2. If not authenticated → show AuthModal to sign in
 * 3. Once authenticated → call GET /admin/me to verify admin status
 * 4. If admin → render children
 * 5. If not admin → show "Access Denied"
 */
export default function AdminGate({ children }: { children: ReactNode }) {
  const { accessToken, initialized } = useAuthStore();
  const isAuthenticated = !!accessToken;
  const authed = useAdminStore((s) => s.authed);
  const verifying = useAdminStore((s) => s.verifying);
  const verifyAdmin = useAdminStore((s) => s.verifyAdmin);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [denied, setDenied] = useState(false);

  // Once the user is authenticated with Supabase, verify admin status
  useEffect(() => {
    if (!initialized || !isAuthenticated || authed) return;
    verifyAdmin().then((isAdmin) => {
      if (!isAdmin) setDenied(true);
    });
  }, [initialized, isAuthenticated, authed, verifyAdmin]);

  // Still loading auth state
  if (!initialized) return <LoadingScreen />;

  // Not logged in — show auth modal
  if (!isAuthenticated) {
    if (showAuthModal) {
      return (
        <div className="adm-gate">
          <AuthModal
            onClose={() => {
              setShowAuthModal(false);
              window.location.href = '/';
            }}
            onSuccess={() => setShowAuthModal(false)}
            onRegister={() => setShowAuthModal(false)}
            pendingRoute="/admin"
            allowWhenClosed
          />
        </div>
      );
    }

    return (
      <div className="adm-gate">
        <motion.div
          className="adm-gate-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="adm-gate-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="adm-gate-title">Admin Access</h2>
          <p className="adm-gate-sub">Sign in with your admin account to continue</p>
          <button className="adm-gate-btn" onClick={() => setShowAuthModal(true)}>
            Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  // Verifying admin status...
  if (verifying || (!authed && !denied)) {
    return (
      <div className="adm-gate">
        <motion.div
          className="adm-gate-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="adm-gate-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="adm-gate-title">Verifying Access…</h2>
          <p className="adm-gate-sub">Checking admin permissions</p>
        </motion.div>
      </div>
    );
  }

  // Not an admin
  if (denied) {
    return (
      <div className="adm-gate">
        <motion.div
          className="adm-gate-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="adm-gate-icon" style={{ color: '#ef4444' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="adm-gate-title">Access Denied</h2>
          <p className="adm-gate-sub">Your account does not have admin privileges.</p>
          <button className="adm-gate-btn" onClick={() => { window.location.href = '/'; }}>
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  // Admin verified — render the admin panel
  return <>{children}</>;
}

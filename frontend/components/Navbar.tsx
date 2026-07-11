'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from './AuthContext';
import AuthModal from './AuthModal';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRegistrationStore } from '@/lib/store/registration-store';

// Shared fade/slide used to crossfade the auth actions so state changes
// (login → dashboard, etc.) don't pop.
const AUTH_FADE = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
  transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] as const },
};

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Challenge', href: '/challenge' },
  { label: 'Program', href: '/program' },
  { label: 'Venue', href: '/venue' },
  { label: 'About Us', href: '/about' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { isRegistered, logout } = useAuth();
  const { accessToken, error: authError } = useAuthStore();
  const hydrating = useRegistrationStore((s) => s.hydrating);
  const isAuthenticated = !!accessToken;
  const pathname = usePathname();

  // Just after login we're authenticated but the profile sync hasn't resolved
  // yet — hold a neutral state instead of flashing "Register Now" before the
  // dashboard link appears.
  const authResolving = isAuthenticated && !isRegistered && hydrating;
  const showGuestActions = !isRegistered && !authResolving && !pathname.startsWith('/register');

  // Dismiss the global auth error (e.g. after OAuth 409)
  const dismissAuthError = () => useAuthStore.setState({ error: null });

  const handleRegisterClick = (e: React.MouseEvent, route: string) => {
    e.preventDefault();
    setShowRegister(false);

    if (isAuthenticated) {
      window.location.href = route;
    } else {
      setPendingRoute(route);
      setShowAuthModal(true);
    }
  };

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 50);
  }, []);

  const isActiveLink = (href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    handleScroll(); // check on mount
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleOpenModal = () => setShowRegister(true);
    window.addEventListener('open-register-modal', handleOpenModal);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-register-modal', handleOpenModal);
    };
  }, [handleScroll]);

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        {/* Animated bottom border glow */}
        <div className="navbar-glow-line" />

        <a className="navbar-logo" href="/">
          <Image
            src="/trsyp-logo.png"
            loading="eager"
            alt="TRSYP 3.0"
            width={240}
            height={82}
            priority
            style={{ height: '146px', width: 'auto', objectFit: 'contain' }}
          />
        </a>

        <ul className="navbar-links">
          {NAV_LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className={isActiveLink(l.href) ? 'active' : ''}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="navbar-right-group">
          <AnimatePresence initial={false}>
            {isAuthenticated && (
              <motion.button
                key="signout"
                className="navbar-signout"
                onClick={() => logout()}
                aria-label="Sign out"
                {...AUTH_FADE}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign Out</span>
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            {authResolving ? (
              <motion.span key="resolving" className="navbar-auth-loading" aria-hidden {...AUTH_FADE} />
            ) : isRegistered ? (
              <motion.a key="dashboard" className="navbar-dashboard" href="/dashboard" {...AUTH_FADE}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                My Dashboard
              </motion.a>
            ) : showGuestActions ? (
              <motion.div key="guest" className="navbar-guest-actions" {...AUTH_FADE}>
                {!isAuthenticated && (
                  <button className="navbar-login" onClick={() => { setPendingRoute(null); setShowAuthModal(true); }}>
                    Log In
                  </button>
                )}
                <button className="navbar-register" onClick={() => setShowRegister(true)}>
                  <span className="navbar-register-pulse" />
                  Register Now
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
          {/* <a className="navbar-admin-link" href="/admin">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </a> */}
        </div>

        <button
          className="navbar-hamburger"
          onClick={() => setOpen((p) => !p)}
          aria-label="Toggle menu"
        >
          <span style={open ? { transform: 'rotate(45deg) translate(5px, 5px)' } : {}} />
          <span style={open ? { opacity: 0 } : {}} />
          <span style={open ? { transform: 'rotate(-45deg) translate(5px, -5px)' } : {}} />
        </button>
      </nav>

      <div className={`navbar-mobile-menu ${open ? 'open' : ''}`}>
        {NAV_LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            className={isActiveLink(l.href) ? 'active' : ''}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </a>
        ))}
        {isAuthenticated && (
          <button className="navbar-mobile-signout" onClick={() => { setOpen(false); logout(); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        )}
        {isRegistered ? (
          <a className="navbar-mobile-register navbar-mobile-dashboard" href="/dashboard" onClick={() => setOpen(false)}>
            My Dashboard
          </a>
        ) : showGuestActions && (
          <>
            {!isAuthenticated && (
              <button
                className="navbar-mobile-register navbar-mobile-login"
                onClick={() => { setOpen(false); setPendingRoute(null); setShowAuthModal(true); }}
              >
                Log In
              </button>
            )}
            <button
              className="navbar-mobile-register"
              onClick={() => { setOpen(false); setShowRegister(true); }}
            >
              Register Now
            </button>
          </>
        )}
      </div>

      {showRegister && !isRegistered && (
        <div className="reg-overlay" onClick={() => setShowRegister(false)}>
          <div className="reg-popup" onClick={(e) => e.stopPropagation()}>
            <button className="reg-close" onClick={() => setShowRegister(false)} aria-label="Close">
              &times;
            </button>
            <div className="reg-popup-header">
              <span className="reg-popup-badge">TRSYP 3.0</span>
              <h3 className="reg-popup-title">Register As</h3>
              <p className="reg-popup-sub">Choose your registration type</p>
            </div>
            <div className="reg-popup-buttons">
              <button disabled className="reg-btn reg-btn-participant" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Participant (Closed)</span>
              </button>
              <a href="/register/challenger" className="reg-btn reg-btn-challenger" onClick={(e) => handleRegisterClick(e, '/register/challenger')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Challenger</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            if (pendingRoute) window.location.href = pendingRoute;
          }}
          onRegister={() => {
            setShowAuthModal(false);
            if (pendingRoute) window.location.href = pendingRoute;
          }}
          pendingRoute={pendingRoute}
        />
      )}

      {authError && (
        <div className="auth-error-toast">
          <div className="auth-error-toast-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{authError}</span>
            <button onClick={dismissAuthError} aria-label="Dismiss">&times;</button>
          </div>
        </div>
      )}
    </>
  );
}

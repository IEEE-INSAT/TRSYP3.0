'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/store/use-auth';
import AuthModal from './AuthModal';
import ModalPortal from './ModalPortal';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRegistrationStore } from '@/lib/store/registration-store';
import { REGISTRATION_OPEN, LOGIN_OPEN } from '@/lib/config';
import { resolvePostAuth } from '@/lib/auth/post-auth';
import UserAvatar from './UserAvatar';
import ProfileMenu from './ProfileMenu';
import { hasFullAvatar } from '@/lib/avatar';
import { DASHBOARD_SECTIONS, activeSection } from '@/lib/dashboard/sections';

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
  { label: 'Visa', href: '/visa' },
  { label: 'About Us', href: '/about' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isRegistered, logout } = useAuth();
  const { accessToken, initialized, error: authError } = useAuthStore();
  const account = useAuthStore((state) => state.account);
  const hydrating = useRegistrationStore((s) => s.hydrating);
  const isAuthenticated = !!accessToken;
  const pathname = usePathname();

  // Just after login we're authenticated but the profile sync hasn't resolved
  // yet - hold a neutral state instead of flashing "Register Now" before the
  // dashboard link appears.
  const authResolving =
    !initialized || (isAuthenticated && !isRegistered && hydrating);
  const showRegistrationActions =
    initialized &&
    !isRegistered &&
    !pathname.startsWith('/register');

  // Inside the dashboard the navbar stops being the site's menu and becomes the
  // dashboard's own: the marketing links step aside for the sections, and the
  // avatar menu offers the way back out. Leaving via "Back to main website"
  // restores the normal navbar simply by leaving /dashboard.
  const inDashboard = pathname.startsWith('/dashboard');
  const sectionsLocked = !!account && !hasFullAvatar(account.avatar);
  const currentSection = activeSection(pathname);

  // Dismiss the global auth error (e.g. after OAuth 409)
  const dismissAuthError = () => useAuthStore.setState({ error: null });

  const isActiveLink = (href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    let frame = 0;
    const updateNavbar = () => {
      frame = 0;
      setScrolled((wasScrolled) =>
        wasScrolled ? window.scrollY > 28 : window.scrollY > 72,
      );
    };
    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateNavbar);
    };

    updateNavbar();
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleOpenModal = () => { if (REGISTRATION_OPEN) setShowRegister(true); };
    window.addEventListener('open-register-modal', handleOpenModal);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-register-modal', handleOpenModal);
    };
  }, []);

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        {/* Animated bottom border glow */}
        <div className="navbar-glow-line" />

        <Link className="navbar-logo" href="/">
          <Image
            src="/trsyp-logo.png"
            loading="eager"
            alt="TRSYP 3.0"
            width={240}
            height={82}
            priority
            style={{ height: '146px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>

        <ul className="navbar-links">
          {inDashboard
            ? DASHBOARD_SECTIONS.map((section) => {
                const unavailable =
                  !section.enabled || (sectionsLocked && section.gated);
                return (
                  <li key={section.id}>
                    {unavailable ? (
                      <span
                        className="navbar-links-locked"
                        aria-disabled="true"
                        title={
                          !section.enabled
                            ? `${section.label} is not open yet`
                            : 'Create your avatar first'
                        }
                      >
                        {section.label}
                        <em>{!section.enabled ? 'Soon' : 'Locked'}</em>
                      </span>
                    ) : (
                      <Link
                        href={section.href}
                        className={currentSection?.id === section.id ? 'active' : ''}
                        aria-current={currentSection?.id === section.id ? 'page' : undefined}
                      >
                        {section.label}
                      </Link>
                    )}
                  </li>
                );
              })
            : NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className={isActiveLink(l.href) ? 'active' : ''}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
        </ul>

        <div className="navbar-right-group">
          {/* Sign Out and My Dashboard used to stand here as two permanent
              buttons; they now live inside the avatar's account menu below. */}
          <AnimatePresence mode="wait" initial={false}>
            {authResolving ? (
              <motion.span key="resolving" className="navbar-auth-loading" aria-hidden {...AUTH_FADE} />
            ) : isRegistered ? null : showRegistrationActions ? (
              <motion.div
                key="guest"
                className={`navbar-guest-actions ${isAuthenticated ? 'navbar-guest-actions--single' : ''}`}
                {...AUTH_FADE}
              >
                {!isAuthenticated && (
                  <button
                    className="navbar-login"
                    onClick={() => setShowAuthModal(true)}
                    disabled={!LOGIN_OPEN}
                    title={LOGIN_OPEN ? undefined : 'Log in opens soon'}
                    style={LOGIN_OPEN ? undefined : { opacity: 0.5, cursor: 'not-allowed' }}
                  >
                    Log In
                  </button>
                )}
                <button
                  className="navbar-register"
                  onClick={() => setShowRegister(true)}
                  disabled={!REGISTRATION_OPEN}
                  title={REGISTRATION_OPEN ? undefined : 'Registration opens soon'}
                  style={REGISTRATION_OPEN ? undefined : { opacity: 0.5, cursor: 'not-allowed' }}
                >
                  {REGISTRATION_OPEN && <span className="navbar-register-pulse" />}
                  {REGISTRATION_OPEN ? 'Register Now' : 'Registration Soon'}
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {isAuthenticated && account && (
            <ProfileMenu
              account={account}
              isRegistered={isRegistered}
              inDashboard={inDashboard}
              onSignOut={() => logout()}
            />
          )}
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
        {inDashboard
          ? DASHBOARD_SECTIONS.map((section) => {
              const unavailable =
                !section.enabled || (sectionsLocked && section.gated);
              return unavailable ? (
                <span key={section.id} className="navbar-links-locked" aria-disabled="true">
                  {section.label}
                  <em>{!section.enabled ? 'Soon' : 'Locked'}</em>
                </span>
              ) : (
                <Link
                  key={section.id}
                  href={section.href}
                  className={currentSection?.id === section.id ? 'active' : ''}
                  onClick={() => setOpen(false)}
                >
                  {section.label}
                </Link>
              );
            })
          : NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={isActiveLink(l.href) ? 'active' : ''}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
        {authResolving ? (
          <div className="ld-spinner navbar-mobile-loading" aria-label="Loading" role="status">
            <span className="ld-spinner-dot ld-spinner-dot--green" />
            <span className="ld-spinner-dot ld-spinner-dot--pink" />
            <span className="ld-spinner-dot ld-spinner-dot--green" />
          </div>
        ) : isRegistered ? (
          // Nothing: the profile row below is itself the way into the dashboard,
          // so a separate "My Dashboard" button would just say it twice.
          null
        ) : showRegistrationActions && (
          <>
            {!isAuthenticated && (
              <button
                className="navbar-mobile-register navbar-mobile-login"
                onClick={() => { setOpen(false); setShowAuthModal(true); }}
                disabled={!LOGIN_OPEN}
                style={LOGIN_OPEN ? undefined : { opacity: 0.5, cursor: 'not-allowed' }}
              >
                Log In
              </button>
            )}
            <button
              className="navbar-mobile-register"
              onClick={() => { setOpen(false); setShowRegister(true); }}
              disabled={!REGISTRATION_OPEN}
              style={REGISTRATION_OPEN ? undefined : { opacity: 0.5, cursor: 'not-allowed' }}
            >
              {REGISTRATION_OPEN ? 'Register Now' : 'Registration Soon'}
            </button>
          </>
        )}
        {isAuthenticated && account && (
          <Link
            className="navbar-mobile-profile"
            href={isRegistered ? '/dashboard' : '/register'}
            onClick={() => setOpen(false)}
          >
            <UserAvatar account={account} className="navbar-user-avatar" />
            <span>
              <strong>{`${account.name} ${account.lastName}`.trim()}</strong>
              <small>{account.email}</small>
            </span>
          </Link>
        )}
        {inDashboard && (
          <Link
            className="navbar-mobile-register navbar-mobile-login"
            href="/"
            onClick={() => setOpen(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M19 12H5" />
              <polyline points="11 18 5 12 11 6" />
            </svg>
            Back to main website
          </Link>
        )}
        {isAuthenticated && (
          <button
            className="navbar-mobile-register navbar-mobile-login"
            onClick={() => { setOpen(false); logout(); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        )}
      </div>

      {showRegister && !isRegistered && (
        <ModalPortal>
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
              {/* Straight to the registration page - it runs its own auth gate,
                  so authenticating there keeps the user on the destination
                  instead of bouncing them through a redirect. */}
              <Link href="/register/challenger" className="reg-btn reg-btn-challenger" onClick={() => setShowRegister(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Challenger</span>
              </Link>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {showAuthModal && (
        <AuthModal
          initialMode="login"
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            // An already-registered account goes to its dashboard; anyone else
            // continues into the registration flow. Never back to the landing
            // page - that reads as "nothing happened".
            window.location.href = resolvePostAuth({
              isRegistered: useRegistrationStore.getState().isRegistered,
            });
          }}
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

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import type { BackendUser } from '@/lib/api/types';
import UserAvatar from './UserAvatar';

/**
 * The avatar in the navbar, doubling as the account menu.
 *
 * "My Dashboard" and "Sign Out" used to sit in the bar as two standing buttons,
 * which spent permanent header space on actions taken once a session. They now
 * live behind the avatar - the thing a user already reads as "me".
 */
export default function ProfileMenu({
  account,
  isRegistered,
  onSignOut,
}: {
  account: BackendUser;
  isRegistered: boolean;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fullName = `${account.name} ${account.lastName}`.trim();

  // Navigating away closes the menu without extra bookkeeping: menu items close
  // it themselves, and anything else the user clicks - a navbar link included -
  // is an outside click caught by the listener below.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="navbar-profile-menu" ref={wrapRef}>
      <button
        type="button"
        className="navbar-profile-icon"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${fullName || account.email} account menu`}
        title={fullName}
      >
        <UserAvatar account={account} className="navbar-user-avatar" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="navbar-profile-dropdown"
            role="menu"
            aria-label="Account"
            // Opacity only: animating y/scale leaves a transform on the panel
            // at rest, which keeps it on a composited layer and renders the
            // text soft. A plain fade keeps every glyph on the pixel grid.
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="navbar-profile-dropdown-head">
              <strong>{fullName || 'Your account'}</strong>
              <small>{account.email}</small>
            </div>

            {/* An unregistered account has no dashboard to go to yet, so the
                first item points at the thing they actually still owe us. */}
            <Link
              href={isRegistered ? '/dashboard' : '/register'}
              className="navbar-profile-dropdown-item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                <rect x="3" y="3" width="7" height="9" rx="1.5" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" />
                <rect x="3" y="16" width="7" height="5" rx="1.5" />
              </svg>
              {isRegistered ? 'My Dashboard' : 'Complete registration'}
            </Link>

            <button
              type="button"
              className="navbar-profile-dropdown-item navbar-profile-dropdown-item--danger"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

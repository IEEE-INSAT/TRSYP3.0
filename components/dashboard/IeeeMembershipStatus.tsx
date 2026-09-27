'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRegistrationStore } from '@/lib/store';
import type { UserData } from '@/lib/store/registration-store';

/** While a check is pending, reload the profile this often, a few times. */
const PENDING_REFRESH_MS = 15_000;
const PENDING_REFRESH_TRIES = 4;

type Tone = 'ok' | 'pending' | 'warn';

/** What to tell the participant about their IEEE check, in plain words. */
function describe(user: UserData): { title: string; detail?: string; tone: Tone; suggestNumber?: boolean } {
  const check = user.ieeeVerification;
  if (!check) {
    return {
      title: 'Checking your IEEE membership',
      detail: "We're looking you up in IEEE's records. This can take a minute.",
      tone: 'pending',
    };
  }
  if (check.stale) {
    return {
      title: 'Re-checking your IEEE membership',
      detail: "Your details changed, so we're checking them with IEEE again.",
      tone: 'pending',
    };
  }
  switch (check.standing) {
    case 'MEMBER':
      return { title: check.isRas ? 'IEEE membership verified · RAS' : 'IEEE membership verified', tone: 'ok' };
    case 'APPLICANT':
      return {
        title: "Your IEEE application is pending; you're counted as a member",
        detail: 'Once IEEE activates your membership, re-check to pick up your society memberships (such as RAS).',
        tone: 'ok',
      };
    case 'LAPSED':
      return { title: 'Your IEEE membership has lapsed; renew it, then re-check', tone: 'warn' };
    default:
      return user.ieeeId
        ? {
            title: "We couldn't find an active IEEE membership for your IEEE Member Number",
            detail: "If you're a member, check the IEEE Member Number in your profile and re-check your membership.",
            tone: 'warn',
            suggestNumber: true,
          }
        : {
            title: "We couldn't find an active IEEE membership for this email",
            detail: "If you're a member, add your IEEE member number and re-check.",
            tone: 'warn',
            suggestNumber: true,
          };
  }
}

/**
 * The participant's IEEE standing, as IEEE's records answer it, with a way to
 * ask again. Their fee follows this, not anything they entered.
 */
export default function IeeeMembershipStatus() {
  const user = useRegistrationStore((s) => s.user);
  const recheck = useRegistrationStore((s) => s.recheckIeeeMembership);
  const hydrate = useRegistrationStore((s) => s.hydrateFromBackend);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The first check runs in the background right after registration: pick
  // its answer up without making the participant reload.
  const pending = !user?.ieeeVerification || user.ieeeVerification.stale;
  const tries = useRef(0);
  useEffect(() => {
    if (!pending || checking || tries.current >= PENDING_REFRESH_TRIES) return;
    const timer = setTimeout(() => {
      tries.current += 1;
      void hydrate();
    }, PENDING_REFRESH_MS);
    return () => clearTimeout(timer);
  }, [pending, checking, hydrate, user]);

  if (!user) return null;
  const { title, detail, tone, suggestNumber } = describe(user);

  const onRecheck = async () => {
    setChecking(true);
    setError(null);
    try {
      await recheck();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach IEEE. Please try again in a few minutes.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className={`dash-detail-row dash-ieee-status dash-ieee-status--${tone}`}>
      <span className="dash-detail-label">IEEE Membership</span>
      <span className="dash-detail-value">{title}</span>
      {detail && <span className="dash-ieee-detail">{detail}</span>}
      {user.ieeeId && <span className="dash-ieee-detail">IEEE member number: {user.ieeeId}</span>}
      <div className="dash-ieee-actions">
        <button type="button" className="dash-ieee-recheck" onClick={onRecheck} disabled={checking}>
          {checking ? 'Checking with IEEE…' : 'Check my IEEE membership'}
        </button>
        {suggestNumber && (
          <Link className="dash-ieee-link" href="/dashboard/profile">
            {user.ieeeId ? 'Edit member number' : 'Add member number'}
          </Link>
        )}
      </div>
      {checking && <span className="dash-ieee-detail">IEEE can take up to a minute to answer.</span>}
      {error && <span className="reg-error">{error}</span>}
    </div>
  );
}

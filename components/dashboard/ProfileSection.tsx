'use client';

import Link from 'next/link';
import { useRegistrationStore } from '@/lib/store';
import { PAYMENT_ENABLED } from '@/lib/dashboard/sections';
import ProfileForm from './ProfileForm';

/**
 * The profile section of the dashboard - the one place a participant can
 * correct anything they told us at registration, at any point after it (team
 * or no team).
 */
export default function ProfileSection() {
  const user = useRegistrationStore((s) => s.user);
  const hydrating = useRegistrationStore((s) => s.hydrating);

  // Editing is only meaningful once there is a participant row to edit.
  const notRegistered = !user && !hydrating;

  return (
    <section className="dash-page dash-section">
      <div className="dash-container">
        <header className="dash-section-head">
          <span className="dash-section-kicker">Your details</span>
          <h1 className="dash-section-title">Edit your profile</h1>
          <p className="dash-section-blurb">
            Keep your information up to date - we use it to reach you before and during
            TRSYP 3.0.
          </p>
        </header>

        {notRegistered ? (
          <div className="dash-card dash-noteam-card">
            <div className="dash-card-title">Not registered yet</div>
            <p className="dash-noteam-msg">
              You don&apos;t have a participant profile to edit yet. Complete your
              registration first.
            </p>
            <div className="dash-noteam-actions">
              <Link href="/register" className="dash-noteam-btn dash-noteam-btn-primary">
                Go to registration
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Payment freezes the record server-side (403), so warn before a
                user fills the form out and loses the edit at the last step. */}
            {PAYMENT_ENABLED && user?.status !== 'waiting_for_payment' && (
              <p className="dash-section-blurb dash-profile-locked-note">
                Your registration is already being processed - if a change is rejected,
                contact us and we&apos;ll update it for you.
              </p>
            )}
            {user && <ProfileForm />}
          </>
        )}
      </div>
    </section>
  );
}

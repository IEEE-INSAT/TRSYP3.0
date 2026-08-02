'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { hasFullAvatar } from '@/lib/avatar';
import AvatarEditor from './AvatarEditor';

/**
 * The avatar section of the dashboard.
 *
 * It reads as two different screens depending on where the user is: a required
 * setup step for someone who has just registered, and an ordinary editor for
 * someone coming back to change their look. Only the first case navigates on
 * save - sending a returning user away from a page they deliberately opened
 * would be rude.
 */
export default function AvatarSection() {
  const router = useRouter();
  const account = useAuthStore((state) => state.account);
  const firstTime = !!account && !hasFullAvatar(account.avatar);

  return (
    <section className="dash-page dash-section">
      <div className="dash-container">
        <header className="dash-section-head">
          <span className="dash-section-kicker">
            {firstTime ? 'Required · Step 1' : 'Your identity'}
          </span>
          <h1 className="dash-section-title">
            {firstTime ? 'Create your hybrid' : 'Your hybrid'}
          </h1>
          <p className="dash-section-blurb">
            {firstTime
              ? 'One last thing before your dashboard opens up. Randomize it until it feels like you.'
              : 'Change any part of your avatar and save - it updates everywhere on the site.'}
          </p>
        </header>

        <div className="dash-card dash-avatar-card">
          <AvatarEditor onSaved={firstTime ? () => router.replace('/dashboard') : undefined} />
        </div>
      </div>
    </section>
  );
}

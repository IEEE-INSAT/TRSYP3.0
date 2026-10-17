import type { Metadata } from 'next';
import Control from '@/components/Control';

export const metadata: Metadata = {
  title: 'Control · Ethical Decision Test',
  robots: { index: false, follow: false },
};

/** The moderators' remote. Needs the moderator key. */
export default function ControlPage() {
  return (
    <main className="mod-page">
      <Control />
    </main>
  );
}

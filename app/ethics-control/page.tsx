import type { Metadata } from 'next';
import EthicsControl from '@/components/EthicsControl';

export const metadata: Metadata = {
  title: 'Ethics Test Control · TRSYP 3.0',
  robots: { index: false, follow: false },
};

/** The moderators' remote for the live Ethical Decision Test. Needs the moderator key. */
export default function EthicsControlPage() {
  return (
    <main className="mod-page">
      <EthicsControl />
    </main>
  );
}

import type { Metadata } from 'next';
import SmashRoomSection from '@/components/dashboard/SmashRoomSection';

export const metadata: Metadata = {
  title: 'Smash Room · TRSYP 3.0',
  description: 'Send your Smash Room form for TRSYP 3.0',
};

// Chrome (navbar, section nav, footer) comes from app/dashboard/layout.tsx.
export default function DashboardSmashRoom() {
  return <SmashRoomSection />;
}

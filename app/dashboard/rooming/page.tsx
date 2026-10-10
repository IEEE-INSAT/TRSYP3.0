import type { Metadata } from 'next';
import RoomingSection from '@/components/dashboard/RoomingSection';

export const metadata: Metadata = {
  title: 'Your Room · TRSYP 3.0',
  description: 'Pick your roommate for TRSYP 3.0',
};

// Chrome (navbar, section nav, footer) comes from app/dashboard/layout.tsx.
export default function DashboardRooming() {
  return <RoomingSection />;
}

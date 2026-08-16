import type { Metadata } from 'next';
import ProfileSection from '@/components/dashboard/ProfileSection';

export const metadata: Metadata = {
  title: 'Your Profile · TRSYP 3.0',
  description: 'Edit your TRSYP 3.0 participant information',
};

// Chrome (navbar, section nav, footer) comes from app/dashboard/layout.tsx.
export default function DashboardProfile() {
  return <ProfileSection />;
}

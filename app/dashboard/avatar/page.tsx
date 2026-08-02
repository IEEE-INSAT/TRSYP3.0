import type { Metadata } from 'next';
import AvatarSection from '@/components/dashboard/AvatarSection';

export const metadata: Metadata = {
  title: 'Your Avatar · TRSYP 3.0',
  description: 'Create and customize your TRSYP 3.0 hybrid avatar',
};

// Chrome (navbar, section nav, footer) comes from app/dashboard/layout.tsx.
export default function DashboardAvatar() {
  return <AvatarSection />;
}

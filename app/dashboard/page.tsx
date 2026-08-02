import type { Metadata } from 'next';
import Dashboard from '@/components/Dashboard';

export const metadata: Metadata = {
  title: 'Dashboard · TRSYP 3.0',
  description: 'Your TRSYP 3.0 registration dashboard',
};

// Chrome (navbar, section nav, footer) comes from app/dashboard/layout.tsx.
export default function DashboardPage() {
  return <Dashboard />;
}

import type { Metadata } from 'next';
import WorkshopsSection from '@/components/dashboard/WorkshopsSection';

export const metadata: Metadata = {
  title: 'Workshops · TRSYP 3.0',
  description: 'Book your workshop seats for day 3 of TRSYP 3.0',
};

// Chrome (navbar, section nav, footer) comes from app/dashboard/layout.tsx.
export default function DashboardWorkshops() {
  return <WorkshopsSection />;
}

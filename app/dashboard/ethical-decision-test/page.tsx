import type { Metadata } from 'next';
import EthicsTestSection from '@/components/dashboard/EthicsTestSection';

export const metadata: Metadata = {
  title: 'Ethical Decision Test · TRSYP 3.0',
  description: 'Allow or override five decisions made by automated systems',
};

// Chrome (navbar, section nav, footer) comes from app/dashboard/layout.tsx.
export default function DashboardEthicsTest() {
  return <EthicsTestSection />;
}

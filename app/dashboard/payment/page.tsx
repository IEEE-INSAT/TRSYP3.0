import type { Metadata } from 'next';
import PaymentPage from '@/components/PaymentPage';

export const metadata: Metadata = {
  title: 'Submit Payment · TRSYP 3.0',
  description: 'Submit your payment proof for TRSYP 3.0',
};

// Chrome (navbar, section nav, footer) comes from app/dashboard/layout.tsx.
export default function Payment() {
  return <PaymentPage />;
}

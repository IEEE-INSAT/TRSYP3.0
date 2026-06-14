import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import PaymentPage from '@/components/PaymentPage';
import Footer from '@/components/Footer';
import GridBeam from '@/components/GridBeam';

export const metadata: Metadata = {
  title: 'Submit Payment · TRSYP 3.0',
  description: 'Submit your payment proof for TRSYP 3.0',
};

export default function Payment() {
  return (
    <>
      <Navbar />
      <GridBeam>
        <main>
          <PaymentPage />
        </main>
        <Footer />
      </GridBeam>
    </>
  );
}

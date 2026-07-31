import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import VisaPage from '@/components/VisaPage';
import Footer from '@/components/Footer';
import GridBeam from '@/components/GridBeam';

export const metadata: Metadata = {
  title: 'Visa · TRSYP 3.0',
  description: 'Visa requirements and travel guidance for participants attending TRSYP 3.0 in Tunisia',
};

export default function Visa() {
  return (
    <>
      <Navbar />
      <GridBeam>
        <main>
          <VisaPage />
        </main>
        <Footer />
      </GridBeam>
    </>
  );
}
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import VenuePage from '@/components/VenuePage';
import Footer from '@/components/Footer';
import GridBeam from '@/components/GridBeam';

export const metadata: Metadata = {
  title: 'Venue · TRSYP 3.0',
  description: 'Venue, travel info, and currency converter for TRSYP 3.0',
};

export default function Venue() {
  return (
    <>
      <Navbar />
      <GridBeam>
        <main>
          <VenuePage />
        </main>
        <Footer />
      </GridBeam>
    </>
  );
}

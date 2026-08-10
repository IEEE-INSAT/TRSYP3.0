import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import SpeakersPage from '@/components/SpeakersPage';
import Footer from '@/components/Footer';
import GridBeam from '@/components/GridBeam';

export const metadata: Metadata = {
  title: 'Speakers · TRSYP 3.0',
  description: 'Meet the distinguished speakers of TRSYP 3.0 — leading researchers and industry pioneers in robotics and AI.',
};

export default function Speakers() {
  return (
    <>
      <Navbar />
      <GridBeam>
        <main>
          <SpeakersPage />
        </main>
        <Footer />
      </GridBeam>
    </>
  );
}

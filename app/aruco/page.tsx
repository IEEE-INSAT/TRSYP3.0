import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import ArucoPage from '@/components/ArucoPage';
import Footer from '@/components/Footer';
import GridBeam from '@/components/GridBeam';

export const metadata: Metadata = {
  title: 'ArUco · TRSYP 3.0',
  description: 'Scan the ArUco markers, collect the clues, and find the word.',
};

export default function Page() {
  return (
    <>
      <Navbar />
      <GridBeam>
        <main>
          <ArucoPage />
        </main>
        <Footer />
      </GridBeam>
    </>
  );
}

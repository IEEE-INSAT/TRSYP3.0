import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import ChallengePage from '@/components/ChallengePage';
import Footer from '@/components/Footer';
import GridBeam from '@/components/GridBeam';
import ComingSoon from '@/components/ComingSoon';
export const metadata: Metadata = {
  title: 'Challenge · TRSYP 3.0',
  description: 'Robotics challenges at TRSYP 3.0',
};

export default function Challenge() {
  return (
    <>
      <Navbar />
      <GridBeam>
        <main>
          <ComingSoon />
        </main>
        <Footer />
      </GridBeam>
    </>
  );
}

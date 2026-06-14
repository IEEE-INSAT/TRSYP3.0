import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import ChallengerForm from '@/components/ChallengerForm';
import Footer from '@/components/Footer';
import GridBeam from '@/components/GridBeam';

export const metadata: Metadata = {
  title: 'Challenge Registration · TRSYP 3.0',
  description: 'Register your team for the TRSYP 3.0 Robotics Challenge',
};

export default function ChallengerPage() {
  return (
    <>
      <Navbar />
      <GridBeam>
        <main>
          <ChallengerForm />
        </main>
        <Footer />
      </GridBeam>
    </>
  );
}

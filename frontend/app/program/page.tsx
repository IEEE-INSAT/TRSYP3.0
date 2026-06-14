import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import ProgramPage from '@/components/ProgramPage';
import Footer from '@/components/Footer';
import GridBeam from '@/components/GridBeam';

export const metadata: Metadata = {
  title: 'Program · TRSYP 3.0',
  description: 'Full schedule for TRSYP 3.0 — Pre-Conference, Day 01, Day 02',
};

export default function Program() {
  return (
    <>
      <Navbar />
      <GridBeam>
        <main>
          <ProgramPage />
        </main>
        <Footer />
      </GridBeam>
    </>
  );
}

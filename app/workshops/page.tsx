import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import WorkshopsPage from '@/components/WorkshopsPage';
import Footer from '@/components/Footer';
import GridBeam from '@/components/GridBeam';

export const metadata: Metadata = {
  title: 'Workshops · TRSYP 3.0',
  description: 'Workshops held on the road to TRSYP 3.0 and the ones still to come.',
};

// Rebuilt hourly so a workshop moves from Upcoming to Completed on its own.
export const revalidate = 3600;

export default function Workshops() {
  // `en-CA` formats as YYYY-MM-DD; the event runs on Tunis time.
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Tunis' });

  return (
    <>
      <Navbar />
      <GridBeam>
        <main>
          <WorkshopsPage today={today} />
        </main>
        <Footer />
      </GridBeam>
    </>
  );
}

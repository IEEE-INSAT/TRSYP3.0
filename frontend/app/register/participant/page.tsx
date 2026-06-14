import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import ParticipantForm from '@/components/ParticipantForm';
import Footer from '@/components/Footer';
import GridBeam from '@/components/GridBeam';

export const metadata: Metadata = {
  title: 'Participant Registration · TRSYP 3.0',
  description: 'Register as a participant for TRSYP 3.0',
};

export default function ParticipantPage() {
  return (
    <>
      <Navbar />
      <GridBeam>
        <main>
          <ParticipantForm />
        </main>
        <Footer />
      </GridBeam>
    </>
  );
}

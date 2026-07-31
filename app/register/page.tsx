import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import RegisterFlow from '@/components/RegisterFlow';
import Footer from '@/components/Footer';
import GridBeam from '@/components/GridBeam';

export const metadata: Metadata = {
  title: 'Registration · TRSYP 3.0',
  description: 'Register for TRSYP 3.0',
};

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <GridBeam>
        <main>
          <RegisterFlow />
        </main>
        <Footer />
      </GridBeam>
    </>
  );
}

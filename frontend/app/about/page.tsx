import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import AboutPage from '@/components/AboutPage';
import Footer from '@/components/Footer';
import GridBeam from '@/components/GridBeam';

export const metadata: Metadata = {
  title: 'About Us · TRSYP 3.0',
  description: 'Meet the team behind TRSYP 3.0',
};

export default function About() {
  return (
    <>
      <Navbar />
      <GridBeam>
        <main>
          <AboutPage />
        </main>
        <Footer />
      </GridBeam>
    </>
  );
}

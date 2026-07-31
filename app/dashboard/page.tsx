import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Dashboard from '@/components/Dashboard';
import Footer from '@/components/Footer';
import GridBeam from '@/components/GridBeam';

export const metadata: Metadata = {
  title: 'Dashboard · TRSYP 3.0',
  description: 'Your TRSYP 3.0 registration dashboard',
};

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <GridBeam>
        <main>
          <Dashboard />
        </main>
        <Footer />
      </GridBeam>
    </>
  );
}

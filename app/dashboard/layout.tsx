import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GridBeam from '@/components/GridBeam';
import DashboardGate from '@/components/dashboard/DashboardGate';

/**
 * Shared chrome for every dashboard section. Section switching lives in the
 * navbar itself - inside /dashboard it swaps the marketing links for the
 * sections - so all this layout adds is the avatar gate.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <GridBeam>
        <main className="dash-shell">
          <DashboardGate>{children}</DashboardGate>
        </main>
        <Footer />
      </GridBeam>
    </>
  );
}

import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GridBeam from '@/components/GridBeam';
import DashboardNav from '@/components/dashboard/DashboardNav';
import DashboardGate from '@/components/dashboard/DashboardGate';

/**
 * Shared chrome for every dashboard section. The site navbar, the section
 * switcher and the avatar gate live here so each section page is just its own
 * content - and so switching sections never re-mounts the chrome.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <GridBeam>
        <main className="dash-shell">
          <DashboardNav />
          <DashboardGate>{children}</DashboardGate>
        </main>
        <Footer />
      </GridBeam>
    </>
  );
}

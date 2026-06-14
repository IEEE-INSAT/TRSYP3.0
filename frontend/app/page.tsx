import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import ThemeSection from '@/components/ThemeSection';
import WhyJoinSection from '@/components/WhyJoinSection';
import PartnersSection from '@/components/PartnersSection';
import PreviousEditionSection from '@/components/PreviousEditionSection';
import Footer from '@/components/Footer';
import GridBeam from '@/components/GridBeam';

export default function Home() {
  return (
    <>
      <Navbar />
      <GridBeam>
        <main>
          <HeroSection />
          <AboutSection />
          <ThemeSection />
          <WhyJoinSection />
          <PartnersSection />
          <PreviousEditionSection />
        </main>
        <Footer />
      </GridBeam>
    </>
  );
}

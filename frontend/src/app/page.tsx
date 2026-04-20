import Navbar from "@/components/ui/Navbar";
import HeroSection from "@/components/ui/HeroSection";
import AboutSection from "@/components/ui/AboutSection";
import WhyJoinSection from "@/components/ui/WhyJoinSection";
import Footer from "@/components/ui/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <WhyJoinSection />

      {/* Register section placeholder */}
      <section
        id="register"
        className="py-24 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #000 0%, #051212 50%, #000 100%)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0,229,200,0.5) 40px, rgba(0,229,200,0.5) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,229,200,0.5) 40px, rgba(0,229,200,0.5) 41px)",
            }}
          />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="flex justify-center gap-2 mb-6">
            <span className="w-2 h-2 bg-[#00e5c8] rotate-45 inline-block" />
            <span className="w-2 h-2 bg-[#ff2d8a] rotate-45 inline-block" />
            <span className="w-2 h-2 bg-[#00e5c8] rotate-45 inline-block" />
          </div>
          <h2
            className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase mb-4"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            READY TO JOIN?
          </h2>
          <p
            className="text-gray-400 text-sm tracking-widest uppercase mb-8"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            17–18 OCTOBER 2026 · TUNISIA
          </p>
          <a href="#" className="btn-cyan text-base px-10 py-4">
            REGISTER NOW
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}

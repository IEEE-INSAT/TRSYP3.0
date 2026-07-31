import { useState, useEffect } from "react";
import Navbar from "../imports/Navbar";
import Hero from "../imports/Hero";
import AboutSection from "../imports/Frame1000001124";
import WhyJoinSection from "../imports/Frame1000001129";
import Footer from "../imports/Frame1000001128";
import AiButton from "../imports/Ai";

export default function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0018] text-white overflow-x-hidden">
      {/* Sticky Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "backdrop-blur-md bg-[#0f0018]/80 shadow-lg" : ""
        }`}
      >
        <div className="h-[72px]">
          <Navbar />
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="min-h-screen relative">
        <Hero />
      </section>

      {/* About Section */}
      <section id="trsyp" className="bg-[#0f0018] relative">
        <div className="max-w-[1440px] mx-auto">
          <AboutSection />
        </div>
      </section>

      {/* Why Join Section */}
      <section id="program" className="bg-[#0f0018] relative">
        <div className="max-w-[1440px] mx-auto">
          <WhyJoinSection />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative">
        <div className="max-w-[1440px] mx-auto">
          <Footer />
        </div>
      </footer>

      {/* AI Chatbot Button */}
      <div className="fixed bottom-6 right-6 z-50 w-[64px] h-[64px] cursor-pointer hover:scale-110 transition-transform">
        <AiButton />
      </div>
    </div>
  );
}
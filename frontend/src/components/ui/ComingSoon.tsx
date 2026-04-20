"use client";

import Image from "next/image";

export default function ComingSoon() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden scanlines">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #000000 0%, #0a1515 40%, #050a0a 100%)",
        }}
      />

      {/* Glowing background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[55%] h-full opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 80% 30%, rgba(0,229,200,0.15) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[40%] h-[50%] opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 20% 80%, rgba(255,45,138,0.12) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 opacity-20 -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(circle, rgba(0,229,200,0.2) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl px-6">
        {/* Logo */}
        <div className="mb-12 animate-fade-up">
          <Image
            src="/logo.png"
            alt="TRSYP Logo"
            width={250}
            height={80}
            className="mx-auto mb-8"
          />
        </div>

        {/* Heading */}
        <h1
          className="text-5xl md:text-7xl font-black text-white tracking-widest uppercase mb-6 animate-fade-up-delay-1"
          style={{
            fontFamily: "var(--font-orbitron)",
            textShadow: "0 0 30px rgba(0,229,200,0.5), 0 0 60px rgba(0,229,200,0.3)",
          }}
        >
          Coming Soon
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg md:text-xl text-gray-300 tracking-widest uppercase mb-12 animate-fade-up-delay-2"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          Something incredible is on the horizon
        </p>

        {/* Divider */}
        <div className="flex justify-center gap-2 mb-12 animate-fade-up-delay-2">
          <span className="w-2 h-2 bg-[#00e5c8] rotate-45 inline-block" />
          <span className="w-2 h-2 bg-[#ff2d8a] rotate-45 inline-block" />
          <span className="w-2 h-2 bg-[#00e5c8] rotate-45 inline-block" />
        </div>

        {/* Description */}
        <p
          className="text-sm md:text-base text-gray-400 max-w-xl mx-auto mb-8 animate-fade-up-delay-3 leading-relaxed"
          style={{ fontFamily: "var(--font-rajdhani)" }}
        >
          We're preparing to showcase the future of robotics and innovation. Stay tuned for announcements and updates.
        </p>

   
     
      </div>

      {/* Animated corner accents */}
      
    </section>
  );
}

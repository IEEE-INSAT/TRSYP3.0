export default function AboutSection() {
  return (
    <section id="about" className="py-24 bg-black relative overflow-hidden">
      {/* Background accent */}
      <div
        className="absolute top-0 left-0 w-[1px] h-full opacity-20"
        style={{ background: "linear-gradient(to bottom, transparent, #00e5c8, transparent)" }}
      />

      <div className="max-w-6xl mx-auto px-6 ">
        {/* Section header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-3">
            <h2
              className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              TRSYP 3.0
            </h2>
            <span className="w-2 h-2 bg-[#00e5c8] rotate-45 inline-block" />
            <h2
              className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              ABOUT
            </h2>
          </div>
          {/* Diamond decorators */}
          <div className="flex gap-2">
            <span className="w-2 h-2 bg-[#00e5c8] rotate-45 inline-block" />
            <span className="w-2 h-2 bg-[#ff2d8a] rotate-45 inline-block" />
            <span className="w-2 h-2 bg-[#00e5c8] rotate-45 inline-block" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-20 items-start">
          {/* Left: text content */}
          <div className="space-y-5">
            {[
              "THE TUNISIAN RAS STUDENT AND YOUNG PROFESSIONAL CONGRESS (TRSYP), ORGANIZED BY THE IEEE INSAT STUDENT BRANCH IN COLLABORATION WITH THE IEEE RAS TUNISIA SECTION, SERVES AS THE ANNUAL FLAGSHIP GATHERING OF ROBOTICS ENTHUSIASTS, BRINGING TOGETHER PARTICIPANTS FROM ACROSS TUNISIA AND BEYOND.",
              "IN ITS THIRD EDITION, TRSYP 3.0 HIGHLIGHTS HUMAN–ROBOT SYMBIOSIS AS A FOUNDATIONAL PARADIGM FOR NEXT-GENERATION ROBOTIC SYSTEMS. THE CONGRESS EXPLORES THE CO-DESIGN OF HUMAN-CENTERED SOLUTIONS THAT INTEGRATE ROBOTIC CAPABILITIES PERCEPTION, AUTONOMY, AND PRECISION WITH HUMAN STRENGTHS SUCH AS DECISION-MAKING, ETHICS, AND ADAPTABILITY.",
              "THROUGH WORKSHOPS AND COMPETITIONS BASED ON REAL-WORLD NEEDS, PARTICIPANTS DEVELOP ROBOTIC SYSTEMS EVALUATED NOT ONLY FOR TECHNICAL PERFORMANCE, BUT ALSO FOR SOCIETAL IMPACT, INCLUSIVE DESIGN, AND ETHICAL COMPLIANCE. TRSYP 3.0 THUS PROVIDES TECHNICAL PARTNERS WITH A STRATEGIC PLATFORM TO EXPERIMENT WITH, VALIDATE, AND DEPLOY ROBOTICS TECHNOLOGIES THAT DELIVER MEANINGFUL SOCIETAL IMPACT.",
            ].map((para, i) => (
              <p
                key={i}
                className="text-gray-400 text-lg leading-relaxed tracking-wide"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                {para}
              </p>
            ))}

          
          </div>

          {/* Right: Event theme card */}
          <div className="relative">
            <img
              src="/event-theme.png"
              alt="Human-Robot Symbiosis Event Theme"
              className="w-full h-auto "
            />
          </div>
        </div>
      </div>
    </section>
  );
}

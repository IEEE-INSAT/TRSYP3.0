import { useState } from "react";
import svgPaths from "./svg-f2x8v2z1hd";
import imgNavbar from "figma:asset/ee1c469b3b5862c8cf43823ebcba6292b71dd1bf.png";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "TRSYP", href: "#trsyp" },
  { label: "Program", href: "#program" },
  { label: "Sponsors", href: "#sponsors" },
  { label: "IEEE Partners", href: "#partners" },
  { label: "FAQ", href: "#faq" },
];

function scrollTo(href: string) {
  const el = document.querySelector(href);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="content-stretch flex items-center justify-center px-[48px] max-md:px-[16px] py-[24px] relative size-full" data-name="navbar">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgNavbar} />
        <div className="flex-[1_0_0] max-w-[1280px] min-h-px min-w-px relative">
          <div className="flex flex-row items-center max-w-[inherit] size-full">
            <div className="content-stretch flex items-center justify-between max-w-[inherit] px-[32px] max-md:px-[8px] relative w-full">
              {/* Logo */}
              <div className="content-stretch flex items-center relative shrink-0 w-[320px] max-md:w-auto">
                <a href="#home" onClick={(e) => { e.preventDefault(); scrollTo("#home"); }} className="h-[24px] relative shrink-0 w-[135.161px]">
                  <div className="absolute h-[24px] left-0 top-0 w-[135.161px]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 135.161 24">
                      <g id="Group 3">
                        <g id="Subtract">
                          <path d={svgPaths.p1551d600} fill="var(--fill-0, white)" />
                          <path d={svgPaths.p108e6500} fill="var(--fill-0, white)" />
                          <path d={svgPaths.p3a294e80} fill="var(--fill-0, white)" />
                        </g>
                        <g id="Frame 2">
                          <path d={svgPaths.p29d4b700} fill="var(--fill-0, #FF2298)" id="Vector" />
                          <path d={svgPaths.p22841f00} fill="var(--fill-0, #FF2298)" id="Vector_2" />
                          <path d={svgPaths.p2fba7000} fill="var(--fill-0, #FF2298)" id="Vector_3" />
                        </g>
                        <g id="Frame 2_2">
                          <path d={svgPaths.pdc07580} fill="var(--fill-0, #00EFA7)" id="Vector_4" />
                          <path d={svgPaths.p2d985570} fill="var(--fill-0, #00EFA7)" id="Vector_5" />
                        </g>
                      </g>
                    </svg>
                  </div>
                </a>
              </div>

              {/* Desktop Nav Links */}
              <div className="content-stretch flex font-['Host_Grotesk',sans-serif] gap-[24px] items-center leading-[1.2] not-italic relative shrink-0 text-[16px] text-white uppercase max-lg:hidden">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => { e.preventDefault(); scrollTo(link.href); }}
                    className="relative shrink-0 cursor-pointer hover:text-[#00efa7] transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              {/* Desktop Right */}
              <div className="content-stretch flex gap-[24px] items-center justify-end relative shrink-0 w-[320px] max-lg:hidden">
                <p className="font-['Host_Grotesk',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[16px] text-white cursor-pointer hover:text-[#00efa7] transition-colors" style={{ fontWeight: 700 }} dir="auto">
                  FR
                </p>
                <a href="#" className="bg-[#00efa7] content-stretch flex flex-col items-center justify-center px-[16px] py-[12px] relative shrink-0 hover:bg-[#00d696] transition-colors cursor-pointer">
                  <p className="font-['Host_Grotesk',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[#0f0018] text-[16px] uppercase" style={{ fontWeight: 800 }}>Register Now</p>
                </a>
              </div>

              {/* Mobile Hamburger */}
              <button
                className="lg:hidden relative text-white p-2"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0f0018]/95 backdrop-blur-md absolute top-full left-0 right-0 z-50 border-t border-[#00efa7]/20">
          <div className="flex flex-col p-6 gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => { e.preventDefault(); scrollTo(link.href); setMobileOpen(false); }}
                className="font-['Host_Grotesk',sans-serif] text-white text-[18px] uppercase hover:text-[#00efa7] transition-colors"
                style={{ fontWeight: 600 }}
              >
                {link.label}
              </a>
            ))}
            <a href="#" className="bg-[#00efa7] text-center py-3 px-6 mt-2">
              <span className="font-['Host_Grotesk',sans-serif] text-[#0f0018] text-[16px] uppercase" style={{ fontWeight: 800 }}>Register Now</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}

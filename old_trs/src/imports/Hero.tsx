import svgPaths from "./svg-3qoa4kbrlz";
import imgHero from "figma:asset/0833409de347b069f666a5d838ece512327760df.png";

function KeyKpisBackgroundImage() {
  return (
    <div style={{ "--transform-inner-width": "1200", "--transform-inner-height": "21" } as React.CSSProperties} className="flex items-center justify-center relative shrink-0 size-[14.28px]">
      <div className="-rotate-45 flex-none">
        <div className="relative size-[10.098px]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.0975 10.0975">
            <path d={svgPaths.p27886740} fill="var(--fill-0, #00EFA7)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}
type BackgroundImageProps = {
  text: string;
  text1: string;
};

function BackgroundImage({ text, text1 }: BackgroundImageProps) {
  return (
    <div className="content-stretch flex flex-col font-['Host_Grotesk:ExtraBold',sans-serif] gap-[4px] items-start justify-center leading-[1.2] not-italic relative shrink-0 text-white uppercase">
      <p className="relative shrink-0 text-[42px]">{text}</p>
      <p className="relative shrink-0 text-[20px]">{text1}</p>
    </div>
  );
}

export default function Hero() {
  return (
    <div className="content-stretch flex flex-col gap-[32px] items-start justify-center px-[120px] max-lg:px-[48px] max-md:px-[20px] py-[160px] max-md:py-[120px] max-md:pt-[100px] relative size-full min-h-screen" data-name="Hero">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img alt="" className="absolute max-w-none object-cover size-full" src={imgHero} />
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(180deg, rgba(0, 0, 0, 0) 20.305%, rgb(11, 7, 13) 100%), linear-gradient(90deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.3) 100%)" }} />
      </div>
      <div className="content-stretch flex flex-col gap-[32px] items-start max-w-[1280px] py-[32px] relative shrink-0 w-full" data-name="Hero content">
        <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
          <div className="col-1 h-[71.026px] ml-0 mt-0 relative row-1 w-[400px]">
            <div className="absolute h-[71.026px] left-0 top-0 w-[400px]">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 400 71.0263">
                <g id="Group 3">
                  <g id="Subtract">
                    <path d={svgPaths.p9d78580} fill="var(--fill-0, white)" />
                    <path d={svgPaths.peb745f0} fill="var(--fill-0, white)" />
                    <path d={svgPaths.p11aa0e00} fill="var(--fill-0, white)" />
                  </g>
                  <g id="Frame 2">
                    <path d={svgPaths.p2082a600} fill="var(--fill-0, #FF2298)" id="Vector" />
                    <path d={svgPaths.p3e3e1700} fill="var(--fill-0, #FF2298)" id="Vector_2" />
                    <path d={svgPaths.p216d2100} fill="var(--fill-0, #FF2298)" id="Vector_3" />
                  </g>
                  <g id="Frame 2_2">
                    <path d={svgPaths.p2e2cdd00} fill="var(--fill-0, #00EFA7)" id="Vector_4" />
                    <path d={svgPaths.p22c98200} fill="var(--fill-0, #00EFA7)" id="Vector_5" />
                  </g>
                </g>
              </svg>
            </div>
          </div>
          <div className="col-1 font-['Host_Grotesk:Medium',sans-serif] leading-none ml-[34.34px] mt-[86.64px] not-italic relative row-1 text-[19.69px] text-white whitespace-nowrap">
            <p className="font-['Host_Grotesk:ExtraBold',sans-serif] mb-0">{`IEEE Tunisian RAS `}</p>
            <p className="font-['Host_Grotesk:Light',sans-serif]">{`Student & Young Professional Congress`}</p>
          </div>
        </div>
        <div className="relative shrink-0 w-full">
          <div className="flex flex-col justify-center size-full">
            <div className="content-stretch flex flex-col gap-[24px] items-start justify-center px-[32px] relative w-full">
              <p className="font-['Host_Grotesk',sans-serif] leading-none not-italic relative shrink-0 text-[32px] max-md:text-[24px] text-white uppercase" style={{ fontWeight: 700 }}>200 days left</p>
              <div className="content-stretch flex gap-[24px] max-md:flex-col max-md:gap-[12px] items-start relative shrink-0">
                <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
                  <div className="overflow-clip relative shrink-0 size-[24px]" data-name="calendar">
                    <div className="absolute inset-[12.5%_16.67%]" data-name="Vector">
                      <div className="absolute inset-[-5.56%_-6.25%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 20">
                          <path d={svgPaths.p14aaf80} id="Vector" stroke="var(--stroke-0, #00EFA7)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="font-['Host_Grotesk:Medium',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[18px] text-center text-white uppercase">3-4 October 2026</p>
                </div>
                <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
                  <div className="overflow-clip relative shrink-0 size-[24px]" data-name="map-pin">
                    <div className="absolute inset-[12.5%_16.67%_10.48%_16.67%]" data-name="Vector">
                      <div className="absolute inset-[-5.41%_-6.25%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 20.4848">
                          <g id="Vector">
                            <path d={svgPaths.p1c31f500} stroke="var(--stroke-0, #00EFA7)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            <path d={svgPaths.p19089d00} stroke="var(--stroke-0, #00EFA7)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="font-['Host_Grotesk:Medium',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[18px] text-center text-white uppercase">TBD</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] max-md:flex-col items-start px-[32px] relative shrink-0">
          <a href="#" className="bg-[#00efa7] content-stretch flex flex-col items-center justify-center px-[24px] py-[14px] relative shrink-0 hover:bg-[#00d696] transition-colors cursor-pointer" data-name="Button">
            <p className="font-['Host_Grotesk',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[#0f0018] text-[20px] uppercase" style={{ fontWeight: 800 }}>Register Now</p>
          </a>
          <a href="#trsyp" className="content-stretch flex flex-col items-center justify-center px-[24px] py-[14px] relative shrink-0 hover:bg-[#00efa7]/10 transition-colors cursor-pointer" data-name="Button">
            <div aria-hidden="true" className="absolute border border-[#00efa7] border-solid inset-0 pointer-events-none" />
            <p className="font-['Host_Grotesk',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[#00efa7] text-[20px] uppercase" style={{ fontWeight: 800 }}>Learn More</p>
          </a>
        </div>
      </div>
      <div className="max-w-[1280px] relative shrink-0 w-full" data-name="Key kpis">
        <div className="flex flex-row items-center max-w-[inherit] size-full">
          <div className="content-stretch flex gap-[24px] max-md:gap-[16px] max-md:flex-wrap items-center max-w-[inherit] px-[32px] relative w-full">
            <BackgroundImage text="2 Days" text1="of innovation" />
            <KeyKpisBackgroundImage />
            <BackgroundImage text="350+" text1="Participants" />
            <KeyKpisBackgroundImage />
            <div className="content-stretch flex flex-col font-['Host_Grotesk',sans-serif] gap-[4px] items-start justify-center leading-[1.2] not-italic relative shrink-0 text-white uppercase">
              <p className="relative shrink-0 text-[42px] max-md:text-[32px]" style={{ fontWeight: 800 }}>20+</p>
              <p className="relative shrink-0 text-[20px] max-md:text-[16px]" style={{ fontWeight: 800 }}>{`Speakers & Experts`}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import svgPaths from "./svg-xt5uij7fst";
import imgRobotsPhotoByTaraWinstead1 from "figma:asset/9e74036a2838ecea0a1562b8579f905ef5e029de.png";
import imgGrainTexture from "figma:asset/c4ca218c190ba94e9ffc887f18d4f849a05f975d.png";

function BackgroundImage2({ children }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ "--transform-inner-width": "1200", "--transform-inner-height": "21" } as React.CSSProperties} className="flex items-center justify-center relative shrink-0">
      {children}
    </div>
  );
}
type BackgroundImage1Props = {
  additionalClassNames?: string;
};

function BackgroundImage1({ children, additionalClassNames = "" }: React.PropsWithChildren<BackgroundImage1Props>) {
  return (
    <BackgroundImage2 additionalClassNames={additionalClassNames}>
      <div className="-rotate-45 flex-none">{children}</div>
    </BackgroundImage2>
  );
}

function BackgroundImage() {
  return (
    <BackgroundImage1 additionalClassNames="size-[13.388px]">
      <div className="relative size-[9.466px]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.46642 9.46641">
          <path d={svgPaths.p196e6480} fill="var(--fill-0, #00EFA7)" id="Vector" />
        </svg>
      </div>
    </BackgroundImage1>
  );
}
type BackgroundImageAndTextProps = {
  text: string;
};

function BackgroundImageAndText({ text }: BackgroundImageAndTextProps) {
  return (
    <BackgroundImage2 additionalClassNames="h-[420.938px] w-full">
      <div className="-rotate-90 flex-none w-full">
        <p className="font-['Host_Grotesk:ExtraBold',sans-serif] h-[39.375px] leading-[1.2] not-italic relative text-[32.685px] text-white uppercase w-full whitespace-pre-wrap">{text}</p>
      </div>
    </BackgroundImage2>
  );
}

export default function Frame() {
  return (
    <div className="content-stretch flex max-lg:flex-col gap-[64px] max-md:gap-[32px] items-center justify-center px-[32px] max-md:px-[20px] py-[48px] relative size-full">
      <div className="content-stretch flex flex-[1_0_0] max-lg:flex-none max-lg:w-full flex-col gap-[12px] items-start justify-center min-h-px min-w-px relative">
        <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
          <p className="font-['Host_Grotesk:Bold',sans-serif] leading-none not-italic relative shrink-0 text-[36px] text-white">TRSYP 3.0</p>
          <BackgroundImage1 additionalClassNames="size-[14.28px]">
            <div className="relative size-[10.098px]" data-name="Vector">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.0975 10.0975">
                <path d={svgPaths.p27886740} fill="var(--fill-0, #00EFA7)" id="Vector" />
              </svg>
            </div>
          </BackgroundImage1>
          <p className="font-['Host_Grotesk:Bold',sans-serif] leading-none not-italic relative shrink-0 text-[36px] text-white uppercase">About</p>
        </div>
        <div className="h-[14.28px] relative shrink-0 w-[58.84px]">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 58.8401 14.28">
            <g id="Frame 1000001176">
              <path d={svgPaths.p3c9211c0} fill="var(--fill-0, #FF2298)" id="Vector" />
              <path d={svgPaths.p37da580} fill="var(--fill-0, #FF2298)" id="Vector_2" />
              <path d={svgPaths.p15bf6200} fill="var(--fill-0, #FF2298)" id="Vector_3" />
            </g>
          </svg>
        </div>
        <p className="font-['Host_Grotesk:Medium',sans-serif] leading-[1.6] min-w-full not-italic relative shrink-0 text-[18px] text-white uppercase w-[min-content] whitespace-pre-wrap">The Tunisian RAS Student and Young Professional Congress (TRSYP), organized by the IEEE INSAT Student Branch in collaboration with the IEEE RAS Tunisia Section, serves as the annual flagship gathering of robotics enthusiasts, bringing together participants from across Tunisia and beyond.</p>
        <p className="font-['Host_Grotesk:Medium',sans-serif] leading-[1.6] min-w-full not-italic relative shrink-0 text-[18px] text-white uppercase w-[min-content] whitespace-pre-wrap">In its third edition, TRSYP 3.0 highlights Human–Robot Symbiosis as a foundational paradigm for next-generation robotic systems. The congress explores the co-design of human-centered solutions that integrate robotic capabilities perception, autonomy, and precision with human strengths such as decision-making, ethics, and adaptability.</p>
        <p className="font-['Host_Grotesk:Medium',sans-serif] leading-[1.6] min-w-full not-italic relative shrink-0 text-[18px] text-white uppercase w-[min-content] whitespace-pre-wrap">Through workshops and competitions based on real-world needs, participants develop robotic systems evaluated not only for technical performance, but also for societal impact, inclusive design, and ethical compliance. TRSYP 3.0 thus provides technical partners with a strategic platform to experiment with, validate, and deploy robotics technologies that deliver meaningful societal impact.</p>
        <div className="bg-[#00efa7] content-stretch flex flex-col items-center justify-center px-[24px] py-[14px] relative shrink-0" data-name="Button">
          <p className="font-['Host_Grotesk:ExtraBold',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[#0f0018] text-[20px] uppercase">Register now</p>
        </div>
      </div>
      <div className="bg-[#0f0018] h-[600px] max-lg:h-[500px] max-md:h-[400px] relative shrink-0 w-[448.249px] max-lg:w-full max-lg:max-w-[448px]" data-name="Logo - Full - Texture">
        <div className="overflow-clip relative rounded-[inherit] size-full">
          <div className="absolute h-[1894.592px] left-[-575.88px] top-0 w-[1821.012px]">
            <div className="absolute inset-[-1.81%_0_-3.19%_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1821.01 1989.41">
                <g id="Group 2">
                  <path d={svgPaths.p1dc60fc0} id="Vector 1" stroke="url(#paint0_linear_1_425)" strokeOpacity="0.7" strokeWidth="541.634" />
                  <rect data-figma-bg-blur-radius="389.105" fill="var(--fill-0, black)" fillOpacity="0.01" height="1245.14" id="Grain-Texture" transform="matrix(4.37114e-08 1 1 -4.37114e-08 575.875 34.298)" width="933.852" />
                </g>
                <defs>
                  <clipPath id="bgblur_0_1_425_clip_path" transform="translate(-186.77 354.807)">
                    <rect height="1245.14" transform="matrix(4.37114e-08 1 1 -4.37114e-08 575.875 34.298)" width="933.852" />
                  </clipPath>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_425" x1="1101.32" x2="809.396" y1="183.18" y2="1845.29">
                    <stop stopColor="#00F482" />
                    <stop offset="0.351446" stopColor="#00EFA7" />
                    <stop offset="1" stopColor="#FE1F8F" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <div className="-translate-y-1/2 absolute h-[537.743px] left-[62.26px] pointer-events-none top-[calc(50%-31.13px)] w-[396.109px]" data-name="Robots Photo by Tara Winstead 1">
            <img alt="" className="absolute inset-0 max-w-none object-cover size-full" src={imgRobotsPhotoByTaraWinstead1} />
            <div aria-hidden="true" className="absolute border-[#ff2298] border-[3.113px] border-solid inset-[-3.113px]" />
          </div>
          <div className="absolute flex inset-[0_-177.78%_-55.64%_0] items-center justify-center mix-blend-overlay">
            <div className="-scale-y-100 flex-none h-[1245.136px] rotate-90 w-[933.852px]">
              <div className="opacity-50 relative size-full" data-name="Grain-Texture">
                <div aria-hidden="true" className="absolute bg-size-[171.20623588562012px_171.20623588562012px] bg-top-left inset-0 opacity-50 pointer-events-none" style={{ backgroundImage: `url('${imgGrainTexture}')` }} />
              </div>
            </div>
          </div>
          <div className="absolute content-stretch flex flex-col gap-[14.063px] items-center left-[9.34px] top-[-302.62px] w-[39.375px]">
            <BackgroundImageAndText text="Human–Robot Symbiosis" />
            <BackgroundImage />
            <BackgroundImageAndText text="Human–Robot Symbiosis" />
          </div>
          <div className="absolute bottom-[11.85px] flex h-[39.375px] items-center justify-center left-[57.99px] w-[704.9px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "84" } as React.CSSProperties}>
            <div className="flex-none rotate-90">
              <div className="content-stretch flex flex-col gap-[14.063px] items-center relative w-[39.375px]">
                <BackgroundImageAndText text="event the,e" />
                <BackgroundImage />
                <BackgroundImage2 additionalClassNames="h-[215px] w-[39px]">
                  <div className="-rotate-90 flex-none">
                    <p className="font-['Host_Grotesk:ExtraBold',sans-serif] leading-[1.2] not-italic relative text-[32.685px] text-white uppercase">event theme</p>
                  </div>
                </BackgroundImage2>
                <BackgroundImage />
              </div>
            </div>
          </div>
          <div className="absolute h-[25.564px] right-[19.16px] top-[19.08px] w-[143.969px]">
            <div className="absolute h-[25.564px] left-0 top-0 w-[143.969px]">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 143.969 25.564">
                <g id="Group 3">
                  <g id="Subtract">
                    <path d={svgPaths.p3eeb2540} fill="var(--fill-0, white)" />
                    <path d={svgPaths.p35513000} fill="var(--fill-0, white)" />
                    <path d={svgPaths.p33bf6d00} fill="var(--fill-0, white)" />
                  </g>
                  <g id="Frame 2">
                    <path d={svgPaths.pa2ba580} fill="var(--fill-0, white)" id="Vector" />
                    <path d={svgPaths.paae3100} fill="var(--fill-0, white)" id="Vector_2" />
                    <path d={svgPaths.p3f818600} fill="var(--fill-0, white)" id="Vector_3" />
                  </g>
                  <g id="Frame 2_2">
                    <path d={svgPaths.p143fe900} fill="var(--fill-0, white)" id="Vector_4" />
                    <path d={svgPaths.p93d9280} fill="var(--fill-0, white)" id="Vector_5" />
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="absolute border-[#ff2298] border-[3.113px] border-solid inset-0 pointer-events-none" />
      </div>
    </div>
  );
}
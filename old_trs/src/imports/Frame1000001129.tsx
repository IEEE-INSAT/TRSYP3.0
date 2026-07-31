import svgPaths from "./svg-at6mh7iacm";
import imgGoldStarIcon1 from "figma:asset/583645c46a72fb685eb7a0aab71f1242bc238106.png";
import img3DStarCoinIcon1 from "figma:asset/1db880e81b05a8ccf61408b6f497138d1a77a1e4.png";
import img3DMicrophoneIcon1 from "figma:asset/fdcaa80dbb627e5642471cdee93cc5d0f6940934.png";

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-[rgba(255,185,34,0.1)] flex-[1_0_0] h-full min-h-px min-w-px relative">
      <div aria-hidden="true" className="absolute border border-[#ffb922] border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col gap-[20px] items-start p-[20px] relative size-full">{children}</div>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start justify-center px-[32px] max-md:px-[20px] py-[48px] relative size-full">
      <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0">
        <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
          <p className="font-['Host_Grotesk:Bold',sans-serif] leading-none not-italic relative shrink-0 text-[36px] text-white uppercase">Why Join Us?</p>
          <div className="flex items-center justify-center relative shrink-0 size-[14.28px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "21" } as React.CSSProperties}>
            <div className="-rotate-45 flex-none">
              <div className="relative size-[10.098px]" data-name="Vector">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.0975 10.0975">
                  <path d={svgPaths.p27886740} fill="var(--fill-0, #00EFA7)" id="Vector" />
                </svg>
              </div>
            </div>
          </div>
          <p className="font-['Host_Grotesk:Bold',sans-serif] leading-none not-italic relative shrink-0 text-[36px] text-white uppercase">{`Compete & Grow`}</p>
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
      </div>
      <div className="content-stretch flex gap-[16px] max-md:flex-col h-auto max-md:h-auto items-center relative shrink-0 w-full">
        <div className="flex flex-[1_0_0] max-md:flex-none max-md:w-full flex-row items-center self-stretch">
          <Wrapper>
            <div className="relative shrink-0 size-[120px]" data-name="Gold Star Icon 1">
              <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgGoldStarIcon1} />
            </div>
            <p className="font-['Host_Grotesk:ExtraBold',sans-serif] leading-[1.2] min-w-full not-italic relative shrink-0 text-[32px] text-white w-[min-content] whitespace-pre-wrap">{`NETWORK WITH 350+ ENGINEERS, STUDENTS, & YPs FROM TUNISIA`}</p>
          </Wrapper>
        </div>
        <div className="flex flex-[1_0_0] max-md:flex-none max-md:w-full flex-row items-center self-stretch">
          <Wrapper>
            <div className="relative shrink-0 size-[120px] max-md:size-[80px]" data-name="3D Star Coin Icon 1">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img alt="" className="absolute left-[-9.17%] max-w-none size-[117.5%] top-[-8.72%]" src={img3DStarCoinIcon1} />
              </div>
            </div>
            <p className="font-['Host_Grotesk:ExtraBold',sans-serif] leading-[1.2] min-w-full not-italic relative shrink-0 text-[32px] text-white uppercase w-[min-content] whitespace-pre-wrap">{`Compete in real-world robotics challenges `}</p>
          </Wrapper>
        </div>
        <div className="flex flex-[1_0_0] max-md:flex-none max-md:w-full flex-row items-center self-stretch">
          <Wrapper>
            <div className="relative shrink-0 size-[120px] max-md:size-[80px]" data-name="3D Microphone Icon 1">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img alt="" className="absolute left-[-8.33%] max-w-none size-[116.67%] top-[-8.4%]" src={img3DMicrophoneIcon1} />
              </div>
            </div>
            <p className="font-['Host_Grotesk:ExtraBold',sans-serif] leading-[1.2] min-w-full not-italic relative shrink-0 text-[32px] text-white uppercase w-[min-content] whitespace-pre-wrap">{`Learn from 20+ industry experts & researchers`}</p>
          </Wrapper>
        </div>
      </div>
    </div>
  );
}
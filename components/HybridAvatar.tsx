'use client';

import { useId } from 'react';
import {
  Avatar as AvatarSvg,
  OptionContext,
  OptionsContext,
  allOptions,
} from '@gschoppe/avataaars';
import type { AvatarConfig } from '@/lib/api/types';

const PALETTES = {
  Cobalt: { main: '#3867d6', shadow: '#233b83', glow: '#82e9ff' },
  Ember: { main: '#e56b3f', shadow: '#9e3127', glow: '#ffcf66' },
  Jade: { main: '#22a67a', shadow: '#126052', glow: '#8dffd2' },
  Violet: { main: '#8354c7', shadow: '#4c287e', glow: '#e6a6ff' },
  Graphite: { main: '#56616f', shadow: '#29313b', glow: '#b7f4ff' },
} as const;

const HUMAN_OPTION_KEYS = [
  'topType',
  'accessoriesType',
  'hatColor',
  'hairColor',
  'facialHairType',
  'facialHairColor',
  'clotheType',
  'clotheColor',
  'graphicType',
  'eyeType',
  'eyebrowType',
  'mouthType',
  'skinColor',
] as const;

function HumanAvatar({
  avatar,
  uid,
}: {
  avatar: AvatarConfig;
  uid: string;
}) {
  // The package's default AvatarComponent memoizes this mutable context and
  // calls setData during render. Its mounted Selectors are subscribed to that
  // context, so any ordinary parent re-render becomes setState-during-render.
  // A fresh, fully populated context has no mounted listeners to notify.
  const context = new OptionContext(allOptions);
  const data: Record<string, string> = {
    backdropType: avatar.avatarStyle === 'Transparent' ? 'NoBackdrop' : 'Circle',
  };
  for (const key of HUMAN_OPTION_KEYS) {
    data[key] = avatar[key];
  }
  context.setData(data);

  return (
    <OptionsContext.Provider value={context}>
      <AvatarSvg
        uid={uid}
        style={{ width: '264px', height: '280px' }}
      />
    </OptionsContext.Provider>
  );
}

export function HybridAvatar({
  avatar,
  className,
}: {
  avatar: AvatarConfig;
  className?: string;
}) {
  const palette = PALETTES[avatar.robotColor] ?? PALETTES.Cobalt;
  const instanceId = useId().replace(/:/g, '');
  const shellGradientId = `${instanceId}-hybrid-shell`;
  const robotClipId = `${instanceId}-hybrid-robot-face`;

  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="264"
      height="280"
      viewBox="0 0 264 280"
      role="img"
      aria-label="Half human, half robot avatar"
    >
      <defs>
        <linearGradient id={shellGradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={palette.main} />
          <stop offset="1" stopColor={palette.shadow} />
        </linearGradient>
        <clipPath id={robotClipId}>
          <path d="M132 36c30.928 0 56 25.072 56 56v6.166c5.675.952 10 5.888 10 11.834v14c0 6.052-4.48 11.058-10.305 11.881-2.067 19.806-14.458 36.542-31.695 44.73-5 2-13 3-24 3V36z" />
        </clipPath>
      </defs>
      <HumanAvatar avatar={avatar} uid={`${instanceId}-human`} />
      <g clipPath={`url(#${robotClipId})`}>
        <rect x="128" y="32" width="74" height="153" fill={`url(#${shellGradientId})`} />
        <path d="M132 44c25 4 45 24 49 49" fill="none" stroke="white" strokeWidth="5" opacity=".18" />
        <rect x="126" y="95" width="71" height="42" rx="20" fill="#17202d" />
        {avatar.robotEyes === 'Mono' ? (
          <rect x="142" y="108" width="43" height="14" rx="7" fill={palette.glow} />
        ) : avatar.robotEyes === 'Sensor' ? (
          <><circle cx="166" cy="116" r="13" fill={palette.glow} /><circle cx="166" cy="116" r="5" fill="#fff" /></>
        ) : (
          <><circle cx="165" cy="116" r="10" fill={palette.glow} /><circle cx="165" cy="116" r="3" fill="#fff" /></>
        )}
        {avatar.robotMouth === 'Smile' ? (
          <path d="M136 153c8 9 18 10 29 1" fill="none" stroke={palette.glow} strokeWidth="5" strokeLinecap="round" />
        ) : avatar.robotMouth === 'Signal' ? (
          <g fill={palette.glow}><rect x="140" y="153" width="5" height="9" rx="2" /><rect x="150" y="149" width="5" height="17" rx="2" /><rect x="160" y="145" width="5" height="25" rx="2" /></g>
        ) : (
          <g stroke={palette.glow} strokeWidth="4" strokeLinecap="round"><path d="M139 152h27" /><path d="M143 160h23" /></g>
        )}
        <rect x="188" y="105" width="12" height="30" rx="6" fill={palette.shadow} />
        <circle cx="193" cy="120" r="4" fill={palette.glow} />
      </g>
    </svg>
  );
}

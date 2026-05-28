// Ícones SVG inline. Herdam a cor via currentColor para reagir ao glow do CSS.

import React from 'react';

function Svg({ size = 18, children, ...rest }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconPlay({ size }) {
  return (
    <Svg size={size}>
      <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconPause({ size }) {
  return (
    <Svg size={size}>
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconPrev({ size }) {
  return (
    <Svg size={size}>
      <polygon points="18 5 9 12 18 19 18 5" fill="currentColor" stroke="none" />
      <rect x="5" y="5" width="2.4" height="14" rx="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconNext({ size }) {
  return (
    <Svg size={size}>
      <polygon points="6 5 15 12 6 19 6 5" fill="currentColor" stroke="none" />
      <rect x="16.6" y="5" width="2.4" height="14" rx="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconClose({ size }) {
  return (
    <Svg size={size}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </Svg>
  );
}

export function IconTrash({ size }) {
  return (
    <Svg size={size}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </Svg>
  );
}

// Logo: onda sonora dentro de um losango (geométrico, estilo NAVI)
export function IconLogo({ size = 26 }) {
  return (
    <Svg size={size} strokeWidth="1.6">
      <path d="M12 2.5 21.5 12 12 21.5 2.5 12 12 2.5z" opacity="0.55" />
      <path d="M7 12.5v-1M10 15v-6M13 16.5v-9M16 13.5v-3" stroke="currentColor" strokeWidth="2" />
    </Svg>
  );
}

export function IconVolume({ size = 16 }) {
  return (
    <Svg size={size} strokeWidth="1.8">
      <polygon points="4 9 8 9 12 5 12 19 8 15 4 15 4 9" fill="currentColor" stroke="none" />
      <path d="M16 8.5a4 4 0 0 1 0 7" />
    </Svg>
  );
}

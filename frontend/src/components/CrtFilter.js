// Filtro SVG de warp CRT: abaulamento tipo barril via feDisplacementMap.
// O mapa de deslocamento e um gradiente 2D (R = posicao x, G = posicao y),
// montado a partir de dois gradientes lineares combinados em screen — feito
// com a primitiva feBlend (no grafo do filtro) em vez de mix-blend-mode dentro
// do SVG rasterizado, que o Chrome nao aplica de forma confiavel via feImage.
// Aplicado em .crt-screen.crt-on via filter: url(#crt-warp).

import React from 'react';

// gradiente vermelho horizontal: R cresce 0->1 da esquerda pra direita
const GRAD_X =
  "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>" +
  "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='0'>" +
  "<stop offset='0' stop-color='#000'/><stop offset='1' stop-color='#f00'/>" +
  "</linearGradient></defs><rect width='100' height='100' fill='url(#g)'/></svg>";

// gradiente verde vertical: G cresce 0->1 de cima pra baixo
const GRAD_Y =
  "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>" +
  "<defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>" +
  "<stop offset='0' stop-color='#000'/><stop offset='1' stop-color='#0f0'/>" +
  "</linearGradient></defs><rect width='100' height='100' fill='url(#g)'/></svg>";

const HREF_X = 'data:image/svg+xml,' + encodeURIComponent(GRAD_X);
const HREF_Y = 'data:image/svg+xml,' + encodeURIComponent(GRAD_Y);

function CrtFilter() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      style={{ position: 'absolute', pointerEvents: 'none' }}
    >
      <defs>
        <filter
          id="crt-warp"
          colorInterpolationFilters="sRGB"
          x="-6%"
          y="-6%"
          width="112%"
          height="112%"
        >
          <feImage
            href={HREF_X}
            result="mx"
            preserveAspectRatio="none"
            x="0"
            y="0"
            width="100%"
            height="100%"
          />
          <feImage
            href={HREF_Y}
            result="my"
            preserveAspectRatio="none"
            x="0"
            y="0"
            width="100%"
            height="100%"
          />
          <feBlend in="mx" in2="my" mode="screen" result="map" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="34"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

export default CrtFilter;

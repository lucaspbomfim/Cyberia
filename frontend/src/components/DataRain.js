// Fundo decorativo: caracteres mono caindo lentamente (estilo Wired/NAVI).
// Puramente visual, fixo atrás do conteúdo, opacity baixa via CSS (.data-rain).

import React, { useRef, useEffect } from 'react';

const GLYPHS = 'アイウエオカキクサシスセソ0123456789<>/[]{}=+*#';

function DataRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let columns = [];
    const fontSize = 16;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      const count = Math.floor(width / fontSize);
      columns = Array.from({ length: count }, () => Math.random() * height);
    }

    resize();
    window.addEventListener('resize', resize);

    let raf;
    let last = 0;
    function draw(now) {
      raf = requestAnimationFrame(draw);
      if (now - last < 90) return; // ~11fps: lento e sutil
      last = now;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#4ecdc4';
      ctx.font = `${fontSize}px 'IBM Plex Mono', monospace`;

      for (let i = 0; i < columns.length; i++) {
        const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        const x = i * fontSize;
        const y = columns[i];
        ctx.fillText(ch, x, y);
        columns[i] = y > height + Math.random() * 400 ? 0 : y + fontSize;
      }
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="data-rain" aria-hidden="true" />;
}

export default DataRain;

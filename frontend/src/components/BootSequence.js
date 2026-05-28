// Boot / power-on: roda uma vez por carregamento.
//   (1) flash branco + colapso pra linha e expansao (ligar do tubo)
//   (2) log mono curto, linha a linha
//   (3) fade-out -> pointer-events:none
// Clicar pula. Puramente apresentacao, nao bloqueia o app por baixo.

import React, { useState, useEffect } from 'react';

const LOG_LINES = [
  'CYBERIA OS v1.99',
  '> connecting to the wired...',
  '> sync OK',
];

function BootSequence() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [lines, setLines]     = useState(0);

  useEffect(() => {
    if (!visible) return;

    // Revela uma linha de log por vez (apos o power-on do tubo, ~600ms).
    const lineTimers = LOG_LINES.map((_, i) =>
      setTimeout(() => setLines(n => Math.max(n, i + 1)), 650 + i * 380)
    );

    // Inicia o fade e depois desmonta.
    const fadeTimer   = setTimeout(() => setLeaving(true), 2050);
    const removeTimer = setTimeout(() => setVisible(false), 2450);

    return () => {
      lineTimers.forEach(clearTimeout);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [visible]);

  if (!visible) return null;

  function skip() {
    setLeaving(true);
    setTimeout(() => setVisible(false), 300);
  }

  return (
    <div
      className={leaving ? 'boot leaving' : 'boot'}
      onClick={skip}
      role="presentation"
    >
      <div className="boot-tube" />
      <div className="boot-log">
        {LOG_LINES.slice(0, lines).map((line, i) => (
          <div key={i} className="boot-line">{line}</div>
        ))}
      </div>
    </div>
  );
}

export default BootSequence;

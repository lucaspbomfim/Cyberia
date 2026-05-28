// Botao fixo (canto inferior-esquerdo) que liga/desliga o modo CRT.
// Nunca fica dentro de .crt-screen, entao nao deforma com o warp.
// Persiste a escolha em localStorage 'crt_mode'.

import React from 'react';

function CrtToggle({ value, onChange }) {
  function toggle() {
    const next = !value;
    localStorage.setItem('crt_mode', next ? 'on' : 'off');
    onChange(next);
  }

  return (
    <button
      type="button"
      className={value ? 'crt-toggle on' : 'crt-toggle'}
      onClick={toggle}
      title={value ? 'CRT ligado (clique para desligar)' : 'CRT desligado (clique para ligar)'}
      aria-pressed={value}
    >
      <span className="crt-led" aria-hidden="true" />
      <span className="crt-toggle-label">CRT</span>
    </button>
  );
}

export default CrtToggle;

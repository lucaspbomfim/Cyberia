// ─────────────────────────────────────────────────────────────────────────────
// App.js — componente raiz da aplicação
//
// COMO FUNCIONA:
//   Controla qual "tela" está sendo exibida usando um estado simples.
//   Não usa react-router porque não está instalado no projeto.
//   O fluxo é: Login → Home (músicas + playlists)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import DataRain from './components/DataRain';
import CrtFilter from './components/CrtFilter';
import CrtToggle from './components/CrtToggle';
import BootSequence from './components/BootSequence';

function App() {
  // Estado de autenticação: guarda o user_id e token
  const [auth, setAuth] = useState(null);

  // Modo CRT (warp + efeitos pesados). Default ligado; persistido em localStorage.
  const [crtOn, setCrtOn] = useState(() => localStorage.getItem('crt_mode') !== 'off');

  // Ao iniciar, verifica se já existe um login salvo no navegador
  useEffect(() => {
    const token  = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    if (token && userId) {
      setAuth({ token, userId: Number(userId) });
    }
  }, []);

  // Chamado após login ou registro com sucesso
  function handleLogin(token, userId) {
    localStorage.setItem('token', token);
    localStorage.setItem('user_id', userId);
    setAuth({ token, userId });
  }

  // Chamado ao clicar em "Sair"
  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    setAuth(null);
  }

  return (
    <>
      <CrtFilter />
      <DataRain />
      {/* Tela do tubo: recebe o warp via filter quando crt-on. O conteudo do app
          (login/home) vive aqui dentro. O player sai daqui via portal pra nao borrar. */}
      <div className={crtOn ? 'crt-screen crt-on' : 'crt-screen'}>
        <div className="app-content">
          {!auth
            ? <LoginPage onLogin={handleLogin} />
            : <HomePage userId={auth.userId} onLogout={handleLogout} />}
        </div>
      </div>
      {/* Scanlines + VHS + flicker + roll + vignette/glare: fora do warp, sempre nitido. */}
      <div className={crtOn ? 'crt-overlay crt-on' : 'crt-overlay'} />
      <CrtToggle value={crtOn} onChange={setCrtOn} />
      <BootSequence />
    </>
  );
}

export default App;

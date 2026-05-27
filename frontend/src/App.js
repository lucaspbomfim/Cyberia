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

function App() {
  // Estado de autenticação: guarda o user_id e token
  const [auth, setAuth] = useState(null);

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

  // Se não está logado, mostra a tela de login
  if (!auth) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Se está logado, mostra a tela principal
  return <HomePage userId={auth.userId} onLogout={handleLogout} />;
}

export default App;

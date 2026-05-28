// ─────────────────────────────────────────────────────────────────────────────
// LoginPage.js — tela de login e cadastro
//
// O QUE ELA FAZ:
//   - Mostra um formulário de login (email + senha)
//   - Tem um botão para alternar para o formulário de cadastro
//   - Ao enviar, chama a API (user-service) e avisa o App.js se deu certo
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { login, register } from '../api';
import { IconLogo } from '../components/Icons';

// "onLogin" é uma função passada pelo App.js para avisar que o usuário logou
function LoginPage({ onLogin }) {
  const [mode, setMode]       = useState('login'); // 'login' ou 'register'
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); // impede o reload da página
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        // Primeiro registra o usuário...
        await register({ name, email, password });
        // ...depois faz login automaticamente para pegar o token
      }

      // Faz o login para obter o token JWT
      const data = await login({ email, password });
      // data = { token: "...", user_id: 1 }

      // Avisa o App.js que o login funcionou
      onLogin(data.token, data.user_id);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card glass win-panel">
        <div className="win-titlebar">
          <span className="win-title">CYBERIA.SYS</span>
          <span className="win-controls" aria-hidden="true">
            <span className="win-dot">_</span>
            <span className="win-dot">{'□'}</span>
            <span className="win-dot">{'×'}</span>
          </span>
        </div>
        <div className="win-body login-body">
        <div className="login-logo">
          <IconLogo size={30} />
          <span className="logo-text">CYBERIA</span>
        </div>
        <p className="login-subtitle">connecting to the wired...</p>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
            <div className="field">
              <label className="label">Nome</label>
              <input
                className="input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Seu nome"
              />
            </div>
          )}

          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </div>

          <div className="field">
            <label className="label">Senha</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          {/* Mensagem de erro vinda do servidor */}
          {error && <p className="field-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        {/* Alterna entre login e cadastro */}
        <p className="login-toggle">
          {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <span
            className="login-link"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'Cadastrar' : 'Entrar'}
          </span>
        </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

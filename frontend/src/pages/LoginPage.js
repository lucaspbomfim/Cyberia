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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎵 Cyberia</h1>
        <p style={styles.subtitle}>
          {mode === 'login' ? 'Faça login para continuar' : 'Crie sua conta'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'register' && (
            <div style={styles.field}>
              <label style={styles.label}>Nome</label>
              <input
                style={styles.input}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Seu nome"
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Senha</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          {/* Mensagem de erro vinda do servidor */}
          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        {/* Alterna entre login e cadastro */}
        <p style={styles.toggle}>
          {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <span
            style={styles.link}
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'Cadastrar' : 'Entrar'}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f0f0f',
    fontFamily: 'sans-serif',
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
  },
  title: { color: '#fff', margin: '0 0 8px', fontSize: '28px', textAlign: 'center' },
  subtitle: { color: '#888', marginBottom: '28px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#ccc', fontSize: '14px' },
  input: {
    background: '#252525',
    border: '1px solid #444',
    borderRadius: '8px',
    color: '#fff',
    padding: '10px 14px',
    fontSize: '16px',
    outline: 'none',
  },
  button: {
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: { color: '#f87171', fontSize: '14px', margin: 0 },
  toggle: { color: '#888', textAlign: 'center', marginTop: '20px', marginBottom: 0 },
  link: { color: '#7c3aed', cursor: 'pointer', textDecoration: 'underline' },
};

export default LoginPage;

// ─────────────────────────────────────────────────────────────────────────────
// api.js — camada de comunicação com os 3 backends
//
// COMO FUNCIONA:
//   O frontend nunca fala direto com a internet "aleatória".
//   Ele sempre manda pedidos HTTP para endereços conhecidos (as URLs abaixo).
//   Cada função aqui é responsável por UMA operação específica.
//   O componente React só precisa chamar a função e usar o resultado.
// ─────────────────────────────────────────────────────────────────────────────

// Lê as variáveis de ambiente do arquivo .env
// Em desenvolvimento: http://localhost:8001, etc.
// Em produção (Render/Vercel): a URL real do deploy
const USER_URL    = process.env.REACT_APP_USER_SERVICE_URL    || 'http://localhost:8001';
const MUSIC_URL   = process.env.REACT_APP_MUSIC_SERVICE_URL   || 'http://localhost:8002';
const PLAYLIST_URL = process.env.REACT_APP_PLAYLIST_SERVICE_URL || 'http://localhost:8003';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Pega o token JWT que foi salvo no localStorage após o login
function getToken() {
  return localStorage.getItem('token');
}

// Monta o cabeçalho Authorization com o token
function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Função auxiliar: faz um fetch e lança um erro se a resposta não for OK
async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    // Tenta ler a mensagem de erro do servidor
    let errorMessage = `Erro ${response.status}`;
    try {
      const data = await response.json();
      errorMessage = data.detail || data.error || errorMessage;
    } catch (_) {}
    throw new Error(errorMessage);
  }

  // Se o status for 204 (No Content), não tenta parsear JSON
  if (response.status === 204) return null;

  return response.json();
}

// ─── USER SERVICE (porta 8001) ────────────────────────────────────────────────

// Registra um novo usuário
// body: { name, email, password }
// retorna: { id, name, email }
export async function register(body) {
  return request(`${USER_URL}/register`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Faz login
// body: { email, password }
// retorna: { token, user_id }
export async function login(body) {
  return request(`${USER_URL}/login`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Busca dados de um usuário
// retorna: { id, name, email, created_at }
export async function getUser(userId) {
  return request(`${USER_URL}/users/${userId}`);
}

// Busca estatísticas do usuário (total de músicas e playlists)
// retorna: { total_songs, total_playlists }
export async function getUserStats(userId) {
  return request(`${USER_URL}/users/${userId}/stats`);
}

// ─── MUSIC SERVICE (porta 8002) ───────────────────────────────────────────────

// Lista músicas (todas ou de um usuário específico)
// retorna: [{ id, title, artist, user_id, created_at }, ...]
export async function getSongs(userId = null) {
  const url = userId
    ? `${MUSIC_URL}/songs?user_id=${userId}`
    : `${MUSIC_URL}/songs`;
  return request(url);
}

// Busca uma música específica
// retorna: { id, title, artist, file_path, user_id, created_at }
export async function getSong(id) {
  return request(`${MUSIC_URL}/songs/${id}`);
}

// Faz upload de uma música (envia como FormData, não JSON)
// formData deve conter: file (arquivo), title (texto), artist (texto, opcional), user_id
// retorna: { id, title, artist, user_id, created_at }
export async function uploadSong(formData) {
  const token = getToken();
  const response = await fetch(`${MUSIC_URL}/songs`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    // NÃO define Content-Type aqui — o browser define automaticamente com boundary para FormData
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Erro ${response.status}`;
    try {
      const data = await response.json();
      errorMessage = data.error || errorMessage;
    } catch (_) {}
    throw new Error(errorMessage);
  }

  return response.json();
}

// Deleta uma música
export async function deleteSong(id) {
  return request(`${MUSIC_URL}/songs/${id}`, { method: 'DELETE' });
}

// Retorna a URL de streaming de uma música (usada direto no elemento <audio>)
export function getStreamUrl(songId) {
  return `${MUSIC_URL}/songs/${songId}/stream`;
}

// ─── PLAYLIST SERVICE (porta 8003) ────────────────────────────────────────────

// Lista playlists (todas ou de um usuário específico)
// retorna: [{ id, name, user_id, created_at }, ...]
export async function getPlaylists(userId = null) {
  const url = userId
    ? `${PLAYLIST_URL}/playlists?user_id=${userId}`
    : `${PLAYLIST_URL}/playlists`;
  return request(url);
}

// Busca detalhes de uma playlist com suas músicas
// retorna: { id, name, user_id, created_at, songs: [{ id, title, artist, position }] }
export async function getPlaylist(id) {
  return request(`${PLAYLIST_URL}/playlists/${id}`);
}

// Cria uma nova playlist
// body: { name, user_id }
// retorna: { id, name, user_id, created_at }
export async function createPlaylist(body) {
  return request(`${PLAYLIST_URL}/playlists`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Adiciona uma música a uma playlist
// body: { song_id }
// retorna: { playlist_id, song_id, position }
export async function addSongToPlaylist(playlistId, body) {
  return request(`${PLAYLIST_URL}/playlists/${playlistId}/songs`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Remove uma música de uma playlist
export async function removeSongFromPlaylist(playlistId, songId) {
  return request(`${PLAYLIST_URL}/playlists/${playlistId}/songs/${songId}`, {
    method: 'DELETE',
  });
}

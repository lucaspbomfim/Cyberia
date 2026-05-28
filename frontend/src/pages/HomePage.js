// ─────────────────────────────────────────────────────────────────────────────
// HomePage.js — tela principal após o login
//
// ABAS:
//   - Músicas: lista todas as músicas do usuário, permite upload e play
//   - Playlists: lista e cria playlists, permite adicionar músicas
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  getSongs, uploadSong, deleteSong, getStreamUrl,
  getPlaylists, getPlaylist, createPlaylist, addSongToPlaylist, removeSongFromPlaylist,
  getUser, getUserStats,
} from '../api';

function HomePage({ userId, onLogout }) {
  const [tab, setTab]           = useState('songs');
  const [user, setUser]         = useState(null);
  const [stats, setStats]       = useState(null);

  // Estado das músicas
  const [songs, setSongs]       = useState([]);

  // Fila de reprodução: queue = músicas na ordem da lista/playlist ativa,
  // currentIndex = posição tocando agora (-1 = nada tocando)
  const [queue, setQueue]               = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const currentSong = currentIndex >= 0 ? queue[currentIndex] ?? null : null;
  const nextSong    = currentIndex >= 0 && currentIndex + 1 < queue.length
    ? queue[currentIndex + 1]
    : null;

  // Estado de upload
  const [uploadTitle, setUploadTitle]   = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [uploadFile, setUploadFile]     = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState('');

  // Estado das playlists
  const [playlists, setPlaylists]       = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName]   = useState('');
  const [addingSongId, setAddingSongId]         = useState('');

  const [error, setError] = useState('');

  // Carrega dados iniciais
  useEffect(() => {
    loadUser();
    loadSongs();
    loadPlaylists();
  }, [userId]);

  async function loadUser() {
    try {
      const u = await getUser(userId);
      setUser(u);
      const s = await getUserStats(userId);
      setStats(s);
    } catch (_) {}
  }

  // ─── PLAYER / FILA ────────────────────────────────────────────────────────────

  // Toca a partir de uma lista (lista de músicas ou playlist), definindo a fila
  function playSong(list, index) {
    setQueue(list);
    setCurrentIndex(index);
  }

  // Ao terminar a música, avança para a próxima. No fim da fila, para (sem loop).
  function handleEnded() {
    if (currentIndex + 1 < queue.length) setCurrentIndex(i => i + 1);
  }

  function playNext() {
    if (currentIndex + 1 < queue.length) setCurrentIndex(i => i + 1);
  }

  function playPrev() {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }

  function closePlayer() {
    setQueue([]);
    setCurrentIndex(-1);
  }

  // ─── MÚSICAS ────────────────────────────────────────────────────────────────

  async function loadSongs() {
    try {
      const data = await getSongs(userId);
      setSongs(data);
    } catch (err) {
      setError('Erro ao carregar músicas: ' + err.message);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadFile) { setUploadError('Selecione um arquivo'); return; }
    if (!uploadTitle.trim()) { setUploadError('Informe o título'); return; }

    setUploadError('');
    setUploading(true);

    // FormData é necessário para enviar arquivo + campos de texto juntos
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle);
    formData.append('artist', uploadArtist);
    formData.append('user_id', userId);

    try {
      await uploadSong(formData);
      // Limpa o formulário
      setUploadTitle('');
      setUploadArtist('');
      setUploadFile(null);
      e.target.reset();
      // Recarrega a lista de músicas
      await loadSongs();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteSong(id) {
    if (!window.confirm('Remover esta música?')) return;
    try {
      await deleteSong(id);
      setSongs(prev => prev.filter(s => s.id !== id));
      if (currentSong?.id === id) closePlayer();
    } catch (err) {
      setError(err.message);
    }
  }

  // ─── PLAYLISTS ───────────────────────────────────────────────────────────────

  async function loadPlaylists() {
    try {
      const data = await getPlaylists(userId);
      setPlaylists(data);
    } catch (err) {
      setError('Erro ao carregar playlists: ' + err.message);
    }
  }

  async function handleCreatePlaylist(e) {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    try {
      await createPlaylist({ name: newPlaylistName, user_id: userId });
      setNewPlaylistName('');
      await loadPlaylists();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSelectPlaylist(id) {
    try {
      const data = await getPlaylist(id);
      setSelectedPlaylist(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddSong(e) {
    e.preventDefault();
    if (!addingSongId || !selectedPlaylist) return;
    try {
      await addSongToPlaylist(selectedPlaylist.id, { song_id: Number(addingSongId) });
      setAddingSongId('');
      await handleSelectPlaylist(selectedPlaylist.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemoveSongFromPlaylist(songId) {
    try {
      await removeSongFromPlaylist(selectedPlaylist.id, songId);
      await handleSelectPlaylist(selectedPlaylist.id);
    } catch (err) {
      setError(err.message);
    }
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <div style={s.container}>
      {/* Header */}
      <header style={s.header}>
        <span style={s.logo}>🎵 Cyberia</span>
        <div style={s.headerRight}>
          {user && <span style={s.username}>{user.name}</span>}
          {stats && (
            <span style={s.stats}>
              {stats.total_songs} músicas · {stats.total_playlists} playlists
            </span>
          )}
          <button style={s.logoutBtn} onClick={onLogout}>Sair</button>
        </div>
      </header>

      {/* Tabs */}
      <div style={s.tabs}>
        <button style={tab === 'songs' ? s.tabActive : s.tab} onClick={() => setTab('songs')}>
          Músicas
        </button>
        <button style={tab === 'playlists' ? s.tabActive : s.tab} onClick={() => setTab('playlists')}>
          Playlists
        </button>
      </div>

      {error && (
        <div style={s.errorBanner}>
          {error}
          <button onClick={() => setError('')} style={s.closeBtn}>✕</button>
        </div>
      )}

      <main style={s.main}>
        {/* ── TAB: MÚSICAS ── */}
        {tab === 'songs' && (
          <div>
            {/* Formulário de upload */}
            <section style={s.section}>
              <h2 style={s.sectionTitle}>Enviar música</h2>
              <form onSubmit={handleUpload} style={s.uploadForm}>
                <input
                  style={s.input}
                  type="text"
                  placeholder="Título *"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  required
                />
                <input
                  style={s.input}
                  type="text"
                  placeholder="Artista (opcional)"
                  value={uploadArtist}
                  onChange={e => setUploadArtist(e.target.value)}
                />
                <input
                  style={s.input}
                  type="file"
                  accept=".mp3,.wav,.ogg,.flac"
                  onChange={e => setUploadFile(e.target.files[0])}
                  required
                />
                {uploadError && <p style={s.error}>{uploadError}</p>}
                <button type="submit" style={s.btn} disabled={uploading}>
                  {uploading ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            </section>

            {/* Lista de músicas */}
            <section style={s.section}>
              <h2 style={s.sectionTitle}>Suas músicas ({songs.length})</h2>
              {songs.length === 0 && <p style={s.empty}>Nenhuma música ainda.</p>}
              <ul style={s.list}>
                {songs.map((song, idx) => (
                  <li key={song.id} style={s.item}>
                    <div style={s.itemInfo}>
                      <strong style={s.itemTitle}>{song.title}</strong>
                      <span style={s.itemSub}>{song.artist}</span>
                    </div>
                    <div style={s.itemActions}>
                      <button
                        style={s.playBtn}
                        onClick={() => playSong(songs, idx)}
                        title="Tocar"
                      >▶</button>
                      <button
                        style={s.deleteBtn}
                        onClick={() => handleDeleteSong(song.id)}
                        title="Remover"
                      >🗑</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {/* ── TAB: PLAYLISTS ── */}
        {tab === 'playlists' && (
          <div style={s.playlistLayout}>
            {/* Coluna esquerda: lista de playlists */}
            <div style={s.playlistSidebar}>
              <h2 style={s.sectionTitle}>Playlists</h2>
              <form onSubmit={handleCreatePlaylist} style={s.createForm}>
                <input
                  style={s.input}
                  type="text"
                  placeholder="Nome da playlist"
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  required
                />
                <button type="submit" style={s.btn}>Criar</button>
              </form>
              <ul style={s.list}>
                {playlists.map(pl => (
                  <li
                    key={pl.id}
                    style={selectedPlaylist?.id === pl.id ? s.playlistItemActive : s.playlistItem}
                    onClick={() => handleSelectPlaylist(pl.id)}
                  >
                    {pl.name}
                  </li>
                ))}
              </ul>
            </div>

            {/* Coluna direita: detalhe da playlist */}
            <div style={s.playlistDetail}>
              {!selectedPlaylist ? (
                <p style={s.empty}>Selecione uma playlist para ver as músicas.</p>
              ) : (
                <>
                  <h2 style={s.sectionTitle}>{selectedPlaylist.name}</h2>
                  {/* Adicionar música à playlist */}
                  <form onSubmit={handleAddSong} style={s.createForm}>
                    <select
                      style={s.input}
                      value={addingSongId}
                      onChange={e => setAddingSongId(e.target.value)}
                      required
                    >
                      <option value="">Selecionar música...</option>
                      {songs.map(song => (
                        <option key={song.id} value={song.id}>
                          {song.title} — {song.artist}
                        </option>
                      ))}
                    </select>
                    <button type="submit" style={s.btn}>Adicionar</button>
                  </form>

                  {/* Músicas da playlist */}
                  {selectedPlaylist.songs.length === 0 && (
                    <p style={s.empty}>Nenhuma música nesta playlist.</p>
                  )}
                  <ul style={s.list}>
                    {selectedPlaylist.songs.map((song, idx) => (
                      <li key={song.id} style={s.item}>
                        <div style={s.itemInfo}>
                          <span style={s.itemPos}>#{song.position}</span>
                          <strong style={s.itemTitle}>{song.title}</strong>
                          <span style={s.itemSub}>{song.artist}</span>
                        </div>
                        <div style={s.itemActions}>
                          <button
                            style={s.playBtn}
                            onClick={() => playSong(selectedPlaylist.songs, idx)}
                          >▶</button>
                          <button
                            style={s.deleteBtn}
                            onClick={() => handleRemoveSongFromPlaylist(song.id)}
                          >✕</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Player fixo na parte inferior */}
      {currentSong && (
        <div style={s.player}>
          <div style={s.playerInfo}>
            <span style={s.playerTitle}>{currentSong.title}</span>
            <span style={s.playerArtist}>{currentSong.artist}</span>
            {nextSong && <span style={s.playerNext}>próxima: {nextSong.title}</span>}
          </div>
          <button
            style={s.navBtn}
            onClick={playPrev}
            disabled={currentIndex <= 0}
            title="Anterior"
          >⏮</button>
          {/* O elemento <audio> usa a URL de streaming do music-service */}
          <audio
            controls
            autoPlay
            style={s.audioEl}
            src={getStreamUrl(currentSong.id)}
            key={currentSong.id} // força o React a recriar o elemento ao trocar música
            onEnded={handleEnded}
          />
          <button
            style={s.navBtn}
            onClick={playNext}
            disabled={!nextSong}
            title="Próxima"
          >⏭</button>
          <button style={s.closePlayer} onClick={closePlayer}>✕</button>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: '#0f0f0f', color: '#e5e5e5', fontFamily: 'sans-serif', paddingBottom: '100px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #222', background: '#111' },
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#fff' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  username: { color: '#ccc' },
  stats: { color: '#666', fontSize: '13px' },
  logoutBtn: { background: 'none', border: '1px solid #444', color: '#aaa', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
  tabs: { display: 'flex', gap: '0', borderBottom: '1px solid #222', padding: '0 24px' },
  tab: { background: 'none', border: 'none', color: '#888', padding: '14px 20px', cursor: 'pointer', fontSize: '15px', borderBottom: '2px solid transparent' },
  tabActive: { background: 'none', border: 'none', color: '#fff', padding: '14px 20px', cursor: 'pointer', fontSize: '15px', borderBottom: '2px solid #7c3aed' },
  errorBanner: { background: '#450a0a', color: '#fca5a5', padding: '12px 24px', display: 'flex', justifyContent: 'space-between' },
  closeBtn: { background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' },
  main: { padding: '24px' },
  section: { marginBottom: '32px' },
  sectionTitle: { color: '#fff', marginBottom: '16px', fontSize: '18px' },
  uploadForm: { display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-start' },
  createForm: { display: 'flex', gap: '10px', marginBottom: '16px' },
  input: { background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', color: '#fff', padding: '10px 14px', fontSize: '14px' },
  btn: { background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer', whiteSpace: 'nowrap' },
  error: { color: '#f87171', fontSize: '13px', margin: '0', width: '100%' },
  empty: { color: '#555' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px 16px' },
  itemInfo: { display: 'flex', gap: '12px', alignItems: 'center' },
  itemPos: { color: '#555', fontSize: '13px', minWidth: '24px' },
  itemTitle: { color: '#fff' },
  itemSub: { color: '#888', fontSize: '13px' },
  itemActions: { display: 'flex', gap: '8px' },
  playBtn: { background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' },
  deleteBtn: { background: 'none', border: '1px solid #333', color: '#888', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' },
  playlistLayout: { display: 'flex', gap: '24px' },
  playlistSidebar: { width: '280px', flexShrink: 0 },
  playlistDetail: { flex: 1 },
  playlistItem: { padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', color: '#ccc', background: '#1a1a1a', marginBottom: '6px' },
  playlistItemActive: { padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', color: '#fff', background: '#2d1f5e', marginBottom: '6px', border: '1px solid #7c3aed' },
  player: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#111', borderTop: '1px solid #333', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '20px', zIndex: 100 },
  playerInfo: { display: 'flex', flexDirection: 'column', minWidth: '160px' },
  playerTitle: { color: '#fff', fontWeight: 'bold' },
  playerArtist: { color: '#888', fontSize: '13px' },
  playerNext: { color: '#7c3aed', fontSize: '12px', marginTop: '2px' },
  navBtn: { background: 'none', border: '1px solid #444', color: '#ccc', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '14px' },
  audioEl: { flex: 1 },
  closePlayer: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '18px' },
};

export default HomePage;

// ─────────────────────────────────────────────────────────────────────────────
// HomePage.js — tela principal após o login
//
// ABAS:
//   - Músicas: lista todas as músicas do usuário, permite upload e play
//   - Playlists: lista e cria playlists, permite adicionar músicas
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  getSongs, uploadSong, deleteSong, getStreamUrl,
  getPlaylists, getPlaylist, createPlaylist, addSongToPlaylist, removeSongFromPlaylist,
  getUser, getUserStats,
} from '../api';
import {
  IconLogo, IconPlay, IconPause, IconPrev, IconNext, IconClose, IconTrash, IconVolume,
} from '../components/Icons';

// Barra de titulo Win9x/WMP decorativa (dots _ □ x sem funcao).
function Titlebar({ title }) {
  return (
    <div className="win-titlebar">
      <span className="win-title">{title}</span>
      <span className="win-controls" aria-hidden="true">
        <span className="win-dot">_</span>
        <span className="win-dot">{'□'}</span>
        <span className="win-dot">{'×'}</span>
      </span>
    </div>
  );
}

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

  // Estado de apresentação do player (não altera a fila nem a API)
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);
  const [volume, setVolume]           = useState(1);

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

  // Relogio mono no header (apresentacao apenas)
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

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

  // Transporte custom: controla o elemento <audio> via ref (só apresentação)
  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play(); else a.pause();
  }

  function handleSeek(e) {
    const t = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  }

  function handleVolume(e) {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }

  function formatTime(secs) {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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
    <div className="home-container">
      {/* Header — menu/title bar */}
      <header className="home-header">
        <span className="home-logo">
          <IconLogo size={22} />
          <span className="logo-text">CYBERIA</span>
          <span className="home-session">// wired session</span>
        </span>
        <div className="home-header-right">
          <span className="home-online"><span className="home-led" />online</span>
          <span className="home-clock">{clock.toLocaleTimeString('pt-BR', { hour12: false })}</span>
          {user && <span className="home-username">{user.name}</span>}
          {stats && (
            <span className="home-stats">
              {stats.total_songs} músicas · {stats.total_playlists} playlists
            </span>
          )}
          <button className="btn-ghost" onClick={onLogout}>Sair</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs">
        <button className={tab === 'songs' ? 'tab active' : 'tab'} onClick={() => setTab('songs')}>
          Músicas
        </button>
        <button className={tab === 'playlists' ? 'tab active' : 'tab'} onClick={() => setTab('playlists')}>
          Playlists
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')} className="error-close" title="Fechar">
            <IconClose size={16} />
          </button>
        </div>
      )}

      <main className="home-main">
        {/* ── TAB: MÚSICAS ── */}
        {tab === 'songs' && (
          <div>
            {/* Formulário de upload */}
            <section className="section win-panel">
              <Titlebar title="UPLOAD.EXE" />
              <form onSubmit={handleUpload} className="upload-form win-body">
                <input
                  className="input"
                  type="text"
                  placeholder="Título *"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  required
                />
                <input
                  className="input"
                  type="text"
                  placeholder="Artista (opcional)"
                  value={uploadArtist}
                  onChange={e => setUploadArtist(e.target.value)}
                />
                <input
                  className="input"
                  type="file"
                  accept=".mp3,.wav,.ogg,.flac"
                  onChange={e => setUploadFile(e.target.files[0])}
                  required
                />
                {uploadError && <p className="field-error">{uploadError}</p>}
                <button type="submit" className="btn-primary" disabled={uploading}>
                  {uploading ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            </section>

            {/* Lista de músicas */}
            <section className="section">
              <h2 className="section-title">Suas músicas ({songs.length})</h2>
              {songs.length === 0 && <p className="empty">▓▒░ nenhuma música ainda</p>}
              <ul className="list">
                {songs.map((song, idx) => (
                  <li key={song.id} className="card">
                    <div className="card-info">
                      <strong className="card-title">{song.title}</strong>
                      <span className="card-sub">{song.artist}</span>
                    </div>
                    <div className="card-actions">
                      <button
                        className="icon-btn play"
                        onClick={() => playSong(songs, idx)}
                        title="Tocar"
                      ><IconPlay size={16} /></button>
                      <button
                        className="icon-btn danger"
                        onClick={() => handleDeleteSong(song.id)}
                        title="Remover"
                      ><IconTrash size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {/* ── TAB: PLAYLISTS ── */}
        {tab === 'playlists' && (
          <div className="playlist-layout">
            {/* Coluna esquerda: lista de playlists */}
            <div className="playlist-sidebar win-panel">
              <Titlebar title="PLAYLISTS.DB" />
              <div className="win-body">
              <form onSubmit={handleCreatePlaylist} className="create-form">
                <input
                  className="input"
                  type="text"
                  placeholder="Nome da playlist"
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary">Criar</button>
              </form>
              {playlists.length === 0 && <p className="empty">░ vazio</p>}
              <ul className="list">
                {playlists.map(pl => (
                  <li
                    key={pl.id}
                    className={selectedPlaylist?.id === pl.id ? 'playlist-item active' : 'playlist-item'}
                    onClick={() => handleSelectPlaylist(pl.id)}
                  >
                    {pl.name}
                  </li>
                ))}
              </ul>
              </div>
            </div>

            {/* Coluna direita: detalhe da playlist */}
            <div className="playlist-detail">
              {!selectedPlaylist ? (
                <p className="empty win-panel win-empty">▓▒░ selecione uma playlist para ver as músicas</p>
              ) : (
                <div className="win-panel">
                  <Titlebar title={selectedPlaylist.name} />
                  <div className="win-body">
                  {/* Adicionar música à playlist */}
                  <form onSubmit={handleAddSong} className="create-form">
                    <select
                      className="input"
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
                    <button type="submit" className="btn-primary">Adicionar</button>
                  </form>

                  {/* Músicas da playlist */}
                  {selectedPlaylist.songs.length === 0 && (
                    <p className="empty">▓▒░ nenhuma música nesta playlist</p>
                  )}
                  <ul className="list">
                    {selectedPlaylist.songs.map((song, idx) => (
                      <li key={song.id} className="card">
                        <div className="card-info">
                          <span className="card-pos">#{song.position}</span>
                          <strong className="card-title">{song.title}</strong>
                          <span className="card-sub">{song.artist}</span>
                        </div>
                        <div className="card-actions">
                          <button
                            className="icon-btn play"
                            onClick={() => playSong(selectedPlaylist.songs, idx)}
                            title="Tocar"
                          ><IconPlay size={16} /></button>
                          <button
                            className="icon-btn danger"
                            onClick={() => handleRemoveSongFromPlaylist(song.id)}
                            title="Remover"
                          ><IconClose size={16} /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Player fixo na parte inferior — skin WMP.
          Via portal pra document.body: fora de .crt-screen o filter nao transforma
          o position:fixed em relativo nem borra o backdrop-filter. Todo o estado
          e os handlers continuam aqui no HomePage. */}
      {currentSong && createPortal(
        <div className={isPlaying ? 'player' : 'player paused'}>
          <div className="win-titlebar player-titlebar">
            <span className="win-title">NOW_PLAYING.WMP</span>
            <span className="win-controls" aria-hidden="true">
              <span className="win-dot">_</span>
              <span className="win-dot">{'□'}</span>
              <span className="win-dot">{'×'}</span>
            </span>
          </div>

          <div className="player-body">
            {/* visualizer / album art */}
            <div className="player-art">
              <span className="viz-bar" />
              <span className="viz-bar" />
              <span className="viz-bar" />
              <span className="viz-bar" />
            </div>

            <div className="player-main">
              <div className="player-info">
                <span className="player-title">{currentSong.title}</span>
                <span className="player-artist">{currentSong.artist}</span>
                {nextSong && <span className="player-next">next: {nextSong.title}</span>}
              </div>
              <div className="player-progress-row">
                <span className="player-time">
                  {formatTime(currentTime)}<span className="sep">/</span>{formatTime(duration)}
                </span>
                <input
                  className="slider player-progress"
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                />
              </div>
            </div>

            <div className="player-controls">
              <button
                className="transport-btn"
                onClick={playPrev}
                disabled={currentIndex <= 0}
                title="Anterior"
              ><IconPrev size={16} /></button>
              <button
                className="transport-btn play"
                onClick={togglePlay}
                title={isPlaying ? 'Pausar' : 'Tocar'}
              >{isPlaying ? <IconPause size={18} /> : <IconPlay size={18} />}</button>
              <button
                className="transport-btn"
                onClick={playNext}
                disabled={!nextSong}
                title="Próxima"
              ><IconNext size={16} /></button>
            </div>

            <div className="player-volume">
              <IconVolume size={16} />
              <input
                className="slider volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolume}
              />
            </div>

            {/* O elemento <audio> usa a URL de streaming do music-service */}
            <audio
              ref={audioRef}
              className="hidden-audio"
              autoPlay
              src={getStreamUrl(currentSong.id)}
              key={currentSong.id} // força o React a recriar o elemento ao trocar música
              onEnded={handleEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onLoadedMetadata={e => { setDuration(e.target.duration); setCurrentTime(0); e.target.volume = volume; }}
              onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
            />

            <button className="player-close" onClick={closePlayer} title="Fechar">
              <IconClose size={18} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default HomePage;

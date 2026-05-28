package main

import "time"

// Playlist representa uma playlist no banco
type Playlist struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	UserID    int       `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

// PlaylistSummary é o retorno do GET /playlists — inclui a contagem de músicas
type PlaylistSummary struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	UserID    int       `json:"user_id"`
	SongCount int       `json:"song_count"`
	CreatedAt time.Time `json:"created_at"`
}

// PlaylistSong representa uma música dentro de uma playlist
type PlaylistSong struct {
	PlaylistID int `json:"playlist_id"`
	SongID     int `json:"song_id"`
	Position   int `json:"position"`
}

// PlaylistDetail é o retorno do GET /playlists/{id} — inclui as músicas
type PlaylistDetail struct {
	ID        int        `json:"id"`
	Name      string     `json:"name"`
	UserID    int        `json:"user_id"`
	CreatedAt time.Time  `json:"created_at"`
	Songs     []SongInfo `json:"songs"`
}

// SongInfo são os dados vindos do music-service
type SongInfo struct {
	ID       int    `json:"id"`
	Title    string `json:"title"`
	Artist   string `json:"artist"`
	Position int    `json:"position"`
}

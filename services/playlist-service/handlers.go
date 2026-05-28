package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	userServiceURL  = "http://localhost:8001"
	musicServiceURL = "http://localhost:8002"
)

// httpClient com timeout para não travar a aplicação
var httpClient = &http.Client{Timeout: 3 * time.Second}

// ─── POST /playlists ─────────────────────────────────────────────────────────

func createPlaylist(c *gin.Context) {
	var body struct {
		Name   string `json:"name"`
		UserID int    `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Name == "" || body.UserID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "campos obrigatórios: name, user_id"})
		return
	}

	// Valida se o usuário existe no user-service
	if err := validateUser(body.UserID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := db.Exec(
		"INSERT INTO playlists (name, user_id) VALUES (?, ?)",
		body.Name, body.UserID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao criar playlist"})
		return
	}

	id, _ := result.LastInsertId()
	playlist := fetchPlaylistByID(int(id))
	c.JSON(http.StatusCreated, playlist)
}

// ─── GET /playlists?user_id=X ────────────────────────────────────────────────

func listPlaylists(c *gin.Context) {
	userIDStr := c.Query("user_id")

	const baseQuery = `
		SELECT p.id, p.name, p.user_id, p.created_at, COUNT(ps.song_id) AS song_count
		FROM playlists p
		LEFT JOIN playlist_songs ps ON ps.playlist_id = p.id`

	var (
		rows *sql.Rows
		err  error
	)

	if userIDStr != "" {
		uid, convErr := strconv.Atoi(userIDStr)
		if convErr != nil || uid < 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user_id inválido"})
			return
		}
		rows, err = db.Query(baseQuery+" WHERE p.user_id = ? GROUP BY p.id ORDER BY p.id", uid)
	} else {
		rows, err = db.Query(baseQuery + " GROUP BY p.id ORDER BY p.id")
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar playlists"})
		return
	}
	defer rows.Close()

	playlists := []PlaylistSummary{}
	for rows.Next() {
		var p PlaylistSummary
		rows.Scan(&p.ID, &p.Name, &p.UserID, &p.CreatedAt, &p.SongCount)
		playlists = append(playlists, p)
	}

	c.JSON(http.StatusOK, playlists)
}

// ─── GET /playlists/:id ───────────────────────────────────────────────────────

func getPlaylist(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id < 1 {
		c.JSON(http.StatusNotFound, gin.H{"error": "playlist não encontrada"})
		return
	}

	playlist := fetchPlaylistByID(id)
	if playlist == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "playlist não encontrada"})
		return
	}

	// Busca as músicas da playlist
	rows, err := db.Query(
		"SELECT song_id, position FROM playlist_songs WHERE playlist_id = ? ORDER BY position",
		id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar músicas"})
		return
	}
	defer rows.Close()

	detail := PlaylistDetail{
		ID:        playlist.ID,
		Name:      playlist.Name,
		UserID:    playlist.UserID,
		CreatedAt: playlist.CreatedAt,
		Songs:     []SongInfo{},
	}

	for rows.Next() {
		var songID, position int
		rows.Scan(&songID, &position)

		// Busca dados da música no music-service
		song, err := fetchSong(songID)
		if err != nil {
			// Se a música não existir mais no music-service, ignora sem quebrar
			continue
		}
		song.Position = position
		detail.Songs = append(detail.Songs, *song)
	}

	c.JSON(http.StatusOK, detail)
}

// ─── POST /playlists/:id/songs ────────────────────────────────────────────────

func addSong(c *gin.Context) {
	playlistID, err := strconv.Atoi(c.Param("id"))
	if err != nil || playlistID < 1 {
		c.JSON(http.StatusNotFound, gin.H{"error": "playlist não encontrada"})
		return
	}

	// Verifica se a playlist existe
	if fetchPlaylistByID(playlistID) == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "playlist não encontrada"})
		return
	}

	var body struct {
		SongID int `json:"song_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.SongID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "campo obrigatório: song_id"})
		return
	}

	// Valida se a música existe no music-service
	if _, err := fetchSong(body.SongID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Calcula a próxima posição
	var maxPos int
	db.QueryRow(
		"SELECT COALESCE(MAX(position), 0) FROM playlist_songs WHERE playlist_id = ?",
		playlistID,
	).Scan(&maxPos)
	nextPos := maxPos + 1

	_, err = db.Exec(
		"INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)",
		playlistID, body.SongID, nextPos,
	)
	if err != nil {
		// Provavelmente duplicado (PRIMARY KEY)
		c.JSON(http.StatusConflict, gin.H{"error": "música já está na playlist"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"playlist_id": playlistID,
		"song_id":     body.SongID,
		"position":    nextPos,
	})
}

// ─── DELETE /playlists/:id/songs/:sid ────────────────────────────────────────

func removeSong(c *gin.Context) {
	playlistID, err := strconv.Atoi(c.Param("id"))
	if err != nil || playlistID < 1 {
		c.JSON(http.StatusNotFound, gin.H{"error": "playlist não encontrada"})
		return
	}

	songID, err := strconv.Atoi(c.Param("sid"))
	if err != nil || songID < 1 {
		c.JSON(http.StatusNotFound, gin.H{"error": "música não encontrada na playlist"})
		return
	}

	result, err := db.Exec(
		"DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?",
		playlistID, songID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao remover música"})
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "música não encontrada na playlist"})
		return
	}

	c.Status(http.StatusNoContent)
}

// ─── Helpers HTTP ─────────────────────────────────────────────────────────────

// validateUser chama o user-service para verificar se o usuário existe
func validateUser(userID int) error {
	resp, err := httpClient.Get(fmt.Sprintf("%s/users/%d", userServiceURL, userID))
	if err != nil {
		return fmt.Errorf("user-service indisponível")
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return fmt.Errorf("usuário não encontrado")
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("erro ao validar usuário")
	}
	return nil
}

// fetchSong chama o music-service para buscar dados de uma música
func fetchSong(songID int) (*SongInfo, error) {
	resp, err := httpClient.Get(fmt.Sprintf("%s/songs/%d", musicServiceURL, songID))
	if err != nil {
		return nil, fmt.Errorf("music-service indisponível")
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("música não encontrada")
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("erro ao buscar música")
	}

	var song SongInfo
	json.NewDecoder(resp.Body).Decode(&song)
	return &song, nil
}

// ─── Helper DB ────────────────────────────────────────────────────────────────

// fetchPlaylistByID busca uma playlist no banco pelo ID
func fetchPlaylistByID(id int) *Playlist {
	row := db.QueryRow(
		"SELECT id, name, user_id, created_at FROM playlists WHERE id = ?", id,
	)
	var p Playlist
	if err := row.Scan(&p.ID, &p.Name, &p.UserID, &p.CreatedAt); err != nil {
		return nil
	}
	return &p
}

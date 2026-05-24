package main

import (
	"database/sql"
	"log"

	_ "modernc.org/sqlite"
)

var db *sql.DB

func initDB() {
	var err error
	db, err = sql.Open("sqlite", "./playlists.db")
	if err != nil {
		log.Fatal("Erro ao abrir banco:", err)
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS playlists (
			id         INTEGER PRIMARY KEY AUTOINCREMENT,
			name       TEXT NOT NULL,
			user_id    INTEGER NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS playlist_songs (
			playlist_id INTEGER NOT NULL,
			song_id     INTEGER NOT NULL,
			position    INTEGER NOT NULL DEFAULT 0,
			PRIMARY KEY (playlist_id, song_id),
			FOREIGN KEY (playlist_id) REFERENCES playlists(id)
		);
	`)
	if err != nil {
		log.Fatal("Erro ao criar tabelas:", err)
	}

	log.Println("Banco inicializado com sucesso")
}
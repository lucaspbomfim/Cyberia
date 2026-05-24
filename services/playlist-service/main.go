package main

import (
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	initDB()

	r := gin.Default()

	r.POST("/playlists", createPlaylist)
	r.GET("/playlists", listPlaylists)
	r.GET("/playlists/:id", getPlaylist)
	r.POST("/playlists/:id/songs", addSong)
	r.DELETE("/playlists/:id/songs/:sid", removeSong)

	log.Println("playlist-service rodando em http://localhost:8003")
	r.Run(":8003")
}

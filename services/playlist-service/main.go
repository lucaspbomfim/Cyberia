package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	initDB()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}))

	r.POST("/playlists", createPlaylist)
	r.GET("/playlists", listPlaylists)
	r.GET("/playlists/:id", getPlaylist)
	r.POST("/playlists/:id/songs", addSong)
	r.DELETE("/playlists/:id/songs/:sid", removeSong)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8003"
	}

	log.Println("playlist-service rodando em http://localhost:" + port)
	r.Run(":" + port)
}
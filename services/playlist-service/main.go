

package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	initDB()

	r := gin.Default()

	// Middleware de CORS — permite requisições do frontend
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:3000"}, // em produção: URL da Vercel
		AllowMethods: []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}))

	r.POST("/playlists", createPlaylist)
	r.GET("/playlists", listPlaylists)
	r.GET("/playlists/:id", getPlaylist)
	r.POST("/playlists/:id/songs", addSong)
	r.DELETE("/playlists/:id/songs/:sid", removeSong)

	log.Println("playlist-service rodando em http://localhost:8003")
	r.Run(":8003")
}

# Playlist Service

Serviço de criação e gerenciamento de playlists.

**Responsável:** Paulo  
**Stack:** Go / Gin / SQLite

## Endpoints (Provider)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/playlists` | Criar playlist |
| GET | `/playlists` | Listar playlists (`?user_id=X`) |
| GET | `/playlists/{id}` | Detalhes da playlist com músicas |
| POST | `/playlists/{id}/songs` | Adicionar música à playlist |
| DELETE | `/playlists/{id}/songs/{song_id}` | Remover música da playlist |

## Consome (Consumer)

- `GET user-service:8001/users/{id}` — valida dono da playlist
- `GET music-service:8002/songs/{id}` — busca dados das músicas

## Como rodar

```bash
go mod download
go run main.go
```

Roda na porta `8003`.

# 🎵 CYBERIA

Music player self-hosted — faça upload das suas músicas e escute via browser.

**Projeto final — Projeto e Arquitetura de Sistemas (UNIFOR)**

## Equipe

| Membro | Serviço | Linguagem |
|--------|---------|-----------|
| Lucas | Music Service + Frontend | Node.js / React |
| Arthur | User Service | Python / FastAPI |
| Paulo | Playlist Service | Go / Gin |

## Arquitetura

```
Frontend (React :3000)
   ├── User Service    (Python/FastAPI  :8001)
   ├── Music Service   (Node.js/Express :8002)
   └── Playlist Service (Go/Gin         :8003)
```

Cada serviço possui seu próprio banco de dados SQLite e se comunica com os demais via REST/HTTP.

## Como rodar

```bash
# User Service (terminal 1)
cd services/user-service
pip install -r requirements.txt
uvicorn main:app --port 8001

# Music Service (terminal 2)
cd services/music-service
npm install
npm start

# Playlist Service (terminal 3)
cd services/playlist-service
go mod download
go run main.go

# Frontend (terminal 4)
cd frontend
npm install
npm start
```

## Estrutura

```
cyberia/
├── services/
│   ├── user-service/          # Python/FastAPI — Arthur
│   ├── music-service/         # Node.js/Express — Lucas
│   └── playlist-service/      # Go/Gin — Paulo
├── frontend/                  # React — Lucas
└── README.md
```

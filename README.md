# CYBERIA

Player de música self-hosted feito como projeto final de Projeto e Arquitetura de Sistemas (UNIFOR).

Cada um ficou com um serviço. O frontend consome os três via REST.

## Equipe

| Membro | Responsabilidade |
|--------|-----------------|
| Lucas | Music Service + Frontend |
| Arthur | User Service |
| Paulo | Playlist Service + Frontend |

## Stack

- **User Service** — Python / FastAPI (porta 8001)
- **Music Service** — Node.js / Express (porta 8002)
- **Playlist Service** — Go / Gin (porta 8003)
- **Frontend** — React (porta 3000)

Cada serviço tem seu próprio SQLite.

## Rodando local

**User Service**
```bash
cd services/user-service
pip install -r requirements.txt
uvicorn main:app --port 8001
```

**Music Service**
```bash
cd services/music-service
npm install
npm start
```

**Playlist Service**
```bash
cd services/playlist-service
go mod download
go run .
```

**Frontend**
```bash
cd frontend
npm install
npm start
```

## Estrutura

```
cyberia/
├── services/
│   ├── user-service/       # Arthur
│   ├── music-service/      # Lucas
│   └── playlist-service/   # Paulo
└── frontend/               # Paulo e Lucas
```

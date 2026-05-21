# User Service

Serviço de autenticação e gerenciamento de usuários.

**Responsável:** Arthur  
**Stack:** Python / FastAPI / SQLite

## Endpoints (Provider)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/register` | Registro de novo usuário |
| POST | `/login` | Login (retorna token) |
| GET | `/users/{id}` | Dados do usuário |
| GET | `/users/{id}/stats` | Estatísticas (total de músicas e playlists) |

## Consome (Consumer)

- `GET music-service:8002/songs?user_id={id}` — conta músicas do usuário
- `GET playlist-service:8003/playlists?user_id={id}` — conta playlists do usuário

## Como rodar

```bash
pip install -r requirements.txt
uvicorn main:app --port 8001
```

Docs automáticas em: `http://localhost:8001/docs`

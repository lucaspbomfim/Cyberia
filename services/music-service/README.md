# Music Service

Serviço de upload, armazenamento e streaming de músicas.

**Responsável:** Lucas  
**Stack:** Node.js / Express / SQLite

## Endpoints (Provider)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/songs` | Upload de música (multipart) |
| GET | `/songs` | Listar músicas (`?user_id=X`) |
| GET | `/songs/{id}` | Dados de uma música |
| GET | `/songs/{id}/stream` | Stream do arquivo de áudio |
| DELETE | `/songs/{id}` | Remover música |

## Consome (Consumer)

- `GET user-service:8001/users/{id}` — valida que o user_id existe antes de aceitar upload

## Como rodar

```bash
npm install
npm start
```

Roda na porta `8002`.

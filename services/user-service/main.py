<<<<<<< HEAD


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
=======
from fastapi import FastAPI
>>>>>>> 25b38e64379d0424e6ba91fd0501def1932bf081
from database import init_db
from routes import router

app = FastAPI()

<<<<<<< HEAD
# Permite que o frontend (porta 3000) acesse esta API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # em produção, troque pela URL da Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()
app.include_router(router)
=======
init_db()

app.include_router(router)
>>>>>>> 25b38e64379d0424e6ba91fd0501def1932bf081

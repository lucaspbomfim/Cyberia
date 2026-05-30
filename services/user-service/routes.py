import os
import sqlite3
import requests
from fastapi import APIRouter, HTTPException
from database import get_db
from models import RegisterBody, LoginBody
from auth import hash_password, verify_password, generate_token

router = APIRouter()

MUSIC_URL    = os.getenv("MUSIC_SERVICE_URL",    "http://localhost:8002")
PLAYLIST_URL = os.getenv("PLAYLIST_SERVICE_URL", "http://localhost:8003")

# ─── POST /register ───────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
def register(body: RegisterBody):
    password_hash = hash_password(body.password)

    conn = get_db()
    try:
        cursor = conn.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (body.name, body.email, password_hash)
        )
        conn.commit()
        user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="email já cadastrado")

    conn.close()
    return { "id": user_id, "name": body.name, "email": body.email }

# ─── POST /login ──────────────────────────────────────────────────────────────

@router.post("/login")
def login(body: LoginBody):
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE email = ?",
        (body.email,)
    ).fetchone()
    conn.close()

    if user is None:
        raise HTTPException(status_code=401, detail="credenciais inválidas")

    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="credenciais inválidas")

    token = generate_token(user["id"])
    return { "token": token, "user_id": user["id"] }

# ─── GET /users/{id} ──────────────────────────────────────────────────────────

@router.get("/users/{user_id}")
def get_user(user_id: int):
    conn = get_db()
    user = conn.execute(
        "SELECT id, name, email, created_at FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()
    conn.close()

    if user is None:
        raise HTTPException(status_code=404, detail="usuário não encontrado")

    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "created_at": user["created_at"]
    }

# ─── GET /users/{id}/stats ────────────────────────────────────────────────────

@router.get("/users/{user_id}/stats")
def get_stats(user_id: int):
    conn = get_db()
    user = conn.execute(
        "SELECT id FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()
    conn.close()

    if user is None:
        raise HTTPException(status_code=404, detail="usuário não encontrado")

    try:
        music_response = requests.get(
            f"{MUSIC_URL}/songs?user_id={user_id}",
            timeout=3
        )
        total_songs = len(music_response.json())
    except requests.exceptions.RequestException:
        total_songs = 0

    try:
        playlist_response = requests.get(
            f"{PLAYLIST_URL}/playlists?user_id={user_id}",
            timeout=3
        )
        total_playlists = len(playlist_response.json())
    except requests.exceptions.RequestException:
        total_playlists = 0

    return {
        "total_songs": total_songs,
        "total_playlists": total_playlists
    }
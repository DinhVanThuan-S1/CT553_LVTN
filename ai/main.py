"""
EduPath AI Service — FastAPI
Port: 8000

Chỉ còn Chatbot (streaming SSE)
Roadmap + Jobs suggestions → thuật toán CB+CF trên Node.js (không cần AI)

Khoi dong: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import chatbot
from config import OPENROUTER_API_KEY, CHAT_MODEL

app = FastAPI(
    title="EduPath AI Service",
    description="AI-powered career chatbot",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chatbot.router, prefix="/ai", tags=["Chatbot"])


@app.get("/")
async def root():
    return {
        "service": "EduPath AI",
        "status": "running",
        "chat_model": CHAT_MODEL,
        "api_key_set": bool(OPENROUTER_API_KEY),
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "chat_model": CHAT_MODEL,
        "api_key_set": bool(OPENROUTER_API_KEY),
    }

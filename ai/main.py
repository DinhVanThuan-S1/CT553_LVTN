"""
EduPath AI Service — FastAPI
Port: 8000
Theo: docs/request_ai.md (Python + OpenRouter)

Multi-model:
- Chat: google/gemma-3-27b-it:free (nhanh, streaming)
- Analysis: google/gemma-4-31b-it:free (phân tích lộ trình, việc làm)
- Fallback: qwen/qwen3-coder:free

Khởi động: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import roadmap, jobs, chatbot
from config import OPENROUTER_API_KEY, CHAT_MODEL, ANALYSIS_MODEL, FALLBACK_MODEL

app = FastAPI(
    title="EduPath AI Service",
    description="AI-powered career guidance: roadmap, jobs, chatbot",
    version="2.0.0",
)

# CORS — cho phép Backend Node.js gọi
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(roadmap.router, prefix="/ai", tags=["Roadmap"])
app.include_router(jobs.router, prefix="/ai", tags=["Jobs"])
app.include_router(chatbot.router, prefix="/ai", tags=["Chatbot"])


@app.get("/")
async def root():
    return {
        "service": "EduPath AI",
        "status": "running",
        "models": {
            "chat": CHAT_MODEL,
            "analysis": ANALYSIS_MODEL,
            "fallback": FALLBACK_MODEL,
        },
        "api_key_configured": bool(OPENROUTER_API_KEY),
        "endpoints": [
            "POST /ai/suggest-roadmap",
            "POST /ai/suggest-jobs",
            "POST /ai/chat",
        ],
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "chat_model": CHAT_MODEL,
        "analysis_model": ANALYSIS_MODEL,
    }

"""
EduPath AI Service — FastAPI
Port: 8000

Models:
- Chat: google/gemma-3-27b-it:free
- Analysis: google/gemma-4-31b-it:free

Khoi dong: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import roadmap, jobs, chatbot
from config import OPENROUTER_API_KEY, CHAT_MODEL, ANALYSIS_MODEL

app = FastAPI(
    title="EduPath AI Service",
    description="AI-powered career guidance",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(roadmap.router, prefix="/ai", tags=["Roadmap"])
app.include_router(jobs.router, prefix="/ai", tags=["Jobs"])
app.include_router(chatbot.router, prefix="/ai", tags=["Chatbot"])


@app.get("/")
async def root():
    return {
        "service": "EduPath AI",
        "status": "running",
        "chat_model": CHAT_MODEL,
        "analysis_model": ANALYSIS_MODEL,
        "api_key_set": bool(OPENROUTER_API_KEY),
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "chat_model": CHAT_MODEL,
        "analysis_model": ANALYSIS_MODEL,
        "api_key_set": bool(OPENROUTER_API_KEY),
    }

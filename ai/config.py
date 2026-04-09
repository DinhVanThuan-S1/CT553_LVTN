"""
Config — Load environment variables
Multi-model: model nhanh cho chat, model mạnh cho phân tích
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env từ backend/
env_path = Path(__file__).resolve().parent.parent / "backend" / ".env"
load_dotenv(env_path)

# OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

# Multi-model config
# Chat: model nhỏ, nhanh → streaming mượt
CHAT_MODEL = os.getenv("OPENROUTER_CHAT_MODEL", "google/gemma-3-27b-it:free")
# Analysis: model mạnh hơn → JSON phân tích sâu (roadmap, jobs)
ANALYSIS_MODEL = os.getenv("OPENROUTER_ANALYSIS_MODEL", "google/gemma-4-31b-it:free")
# Fallback khi model chính bị rate limit
FALLBACK_MODEL = os.getenv("OPENROUTER_FALLBACK_MODEL", "qwen/qwen3-coder:free")

# Legacy (backward compat)
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", ANALYSIS_MODEL)

# AI Service
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "8000"))

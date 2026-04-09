"""
Config — Load environment variables
Multi-model: mỗi model dùng API key riêng
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env từ backend/
env_path = Path(__file__).resolve().parent.parent / "backend" / ".env"
load_dotenv(env_path)

# OpenRouter base
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

# Chat model — nhanh, streaming (gemma-3-27b)
CHAT_MODEL = os.getenv("OPENROUTER_CHAT_MODEL", "google/gemma-3-27b-it:free")
CHAT_API_KEY = os.getenv("OPENROUTER_CHAT_KEY", "")

# Analysis model — phân tích sâu (gemma-4-31b)
ANALYSIS_MODEL = os.getenv("OPENROUTER_ANALYSIS_MODEL", "google/gemma-4-31b-it:free")
ANALYSIS_API_KEY = os.getenv("OPENROUTER_ANALYSIS_KEY", "")

# Fallback model
FALLBACK_MODEL = os.getenv("OPENROUTER_FALLBACK_MODEL", "qwen/qwen3-coder:free")
# Fallback dùng key nào available
FALLBACK_API_KEY = CHAT_API_KEY or ANALYSIS_API_KEY

# Legacy compat
OPENROUTER_API_KEY = ANALYSIS_API_KEY or CHAT_API_KEY
OPENROUTER_MODEL = ANALYSIS_MODEL

# AI Service
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "8000"))

"""
Config — Load environment variables
1 API key, chon model trong request
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env tu backend/
env_path = Path(__file__).resolve().parent.parent / "backend" / ".env"
load_dotenv(env_path)

# OpenRouter - 1 key duy nhat
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

# Model cho tung tinh nang (co the override trong .env)
# Chat: model nhanh cho streaming
CHAT_MODEL = os.getenv("OPENROUTER_CHAT_MODEL", "openai/gpt-oss-120b:free")
# Analysis: model manh cho phan tich JSON (roadmap, jobs)
ANALYSIS_MODEL = os.getenv("OPENROUTER_ANALYSIS_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")

# AI Service
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "8000"))

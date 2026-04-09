"""
Config — Load environment variables
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env từ backend/
env_path = Path(__file__).resolve().parent.parent / "backend" / ".env"
load_dotenv(env_path)

# OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

# AI Service
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "8000"))

"""
Router — Gợi ý Lộ trình AI cá nhân hóa
POST /ai/suggest-roadmap
Backend gửi data JSON → Python build prompt → OpenRouter → trả JSON
"""
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Optional

from services.ai_client import generate_text
from prompts.roadmap_prompt import ROADMAP_SYSTEM_PROMPT, build_roadmap_prompt

router = APIRouter()


class RoadmapRequest(BaseModel):
    careerPreference: Optional[dict] = None
    academicProfile: Optional[dict] = None
    studentSkills: Optional[list] = None
    availableRoadmaps: Optional[list] = None


@router.post("/suggest-roadmap")
async def suggest_roadmap(body: RoadmapRequest):
    try:
        student_data = body.model_dump()

        # Build prompt và gọi AI
        user_prompt = build_roadmap_prompt(student_data)
        raw = generate_text(
            system_prompt=ROADMAP_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.7,
        )

        # Parse JSON response
        cleaned = raw.strip()
        # Xóa code block nếu model vẫn wrap
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()

        result = json.loads(cleaned)
        return {"success": True, "data": result}

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI trả về dữ liệu không hợp lệ: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

"""
Router — Gợi ý Lộ trình AI cá nhân hóa
POST /ai/suggest-roadmap
Backend gửi data JSON → Python build prompt → OpenRouter → trả JSON
"""
import json
import re
import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.ai_client import generate_text
from prompts.roadmap_prompt import ROADMAP_SYSTEM_PROMPT, build_roadmap_prompt

router = APIRouter()


class RoadmapRequest(BaseModel):
    careerPreference: Optional[dict] = None
    academicProfile: Optional[dict] = None
    studentSkills: Optional[list] = None
    availableRoadmaps: Optional[list] = None


def extract_json(text: str) -> dict:
    """Trích xuất JSON từ response AI (có thể wrap trong markdown code block)"""
    if not text:
        raise ValueError("AI trả về response rỗng")

    cleaned = text.strip()

    # Xóa code block markdown nếu có: ```json ... ``` hoặc ``` ... ```
    match = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', cleaned, re.DOTALL)
    if match:
        cleaned = match.group(1).strip()

    # Thử tìm JSON object trực tiếp nếu không tìm thấy code block
    if not cleaned.startswith('{'):
        # Tìm object JSON đầu tiên trong text
        json_match = re.search(r'\{[\s\S]*\}', cleaned)
        if json_match:
            cleaned = json_match.group(0)
        else:
            raise ValueError(f"Không tìm thấy JSON trong response: {cleaned[:200]}")

    return json.loads(cleaned)


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

        if not raw:
            raise HTTPException(status_code=500, detail="AI không trả về dữ liệu. Vui lòng thử lại.")

        result = extract_json(raw)
        return {"success": True, "data": result}

    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON parse error: {e}")
        print(f"Raw response: {raw[:500] if raw else 'None'}")
        raise HTTPException(
            status_code=500,
            detail=f"AI trả về dữ liệu không hợp lệ. Vui lòng thử lại."
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Roadmap error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

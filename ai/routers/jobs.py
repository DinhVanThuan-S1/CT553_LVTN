"""
Router — Gợi ý Việc làm AI
POST /ai/suggest-jobs
"""
import json
import re
import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.ai_client import generate_text
from prompts.job_prompt import JOB_SYSTEM_PROMPT, build_job_prompt

router = APIRouter()


class JobRequest(BaseModel):
    studentSkills: Optional[list] = None
    careerPreference: Optional[dict] = None
    jobs: Optional[list] = None


def extract_json(text: str) -> dict:
    """Trích xuất JSON từ response AI"""
    if not text:
        raise ValueError("AI trả về response rỗng")

    cleaned = text.strip()

    # Xóa code block markdown nếu có
    match = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', cleaned, re.DOTALL)
    if match:
        cleaned = match.group(1).strip()

    if not cleaned.startswith('{'):
        json_match = re.search(r'\{[\s\S]*\}', cleaned)
        if json_match:
            cleaned = json_match.group(0)
        else:
            raise ValueError(f"Không tìm thấy JSON: {cleaned[:200]}")

    return json.loads(cleaned)


@router.post("/suggest-jobs")
async def suggest_jobs(body: JobRequest):
    try:
        student_data = body.model_dump()

        if not student_data.get("jobs"):
            return {
                "success": True,
                "data": {
                    "matchedJobs": [],
                    "skillGaps": [],
                    "overallAdvice": "Hiện chưa có tin tuyển dụng nào trong hệ thống.",
                    "marketInsight": ""
                }
            }

        user_prompt = build_job_prompt(student_data)
        raw = generate_text(
            system_prompt=JOB_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.5,
        )

        if not raw:
            raise HTTPException(status_code=500, detail="AI không trả về dữ liệu. Vui lòng thử lại.")

        result = extract_json(raw)
        return {"success": True, "data": result}

    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error: {e}")
        print(f"Raw response: {raw[:500] if raw else 'None'}")
        raise HTTPException(status_code=500, detail="AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Jobs error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

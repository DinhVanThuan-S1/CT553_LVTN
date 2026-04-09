"""
Router — Gợi ý Việc làm AI
POST /ai/suggest-jobs
"""
import json
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

        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()

        result = json.loads(cleaned)
        return {"success": True, "data": result}

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI trả về dữ liệu không hợp lệ: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

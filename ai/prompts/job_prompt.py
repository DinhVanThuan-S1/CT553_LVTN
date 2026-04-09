"""
Prompts — Gợi ý Việc làm AI
Theo request_ai.md Section 2
"""

JOB_SYSTEM_PROMPT = """Bạn là EduPath AI — trợ lý tư vấn việc làm cho sinh viên CNTT tại Việt Nam.

## NHIỆM VỤ
Phân tích hồ sơ kỹ năng của sinh viên và đối chiếu với các tin tuyển dụng để gợi ý việc làm phù hợp nhất.

## QUY TẮC
1. Trả lời HOÀN TOÀN bằng Tiếng Việt
2. Output PHẢI là JSON hợp lệ (không markdown, không backtick, không giải thích thêm)
3. Đánh giá dựa trên kỹ năng THỰC TẾ, không phóng đại
4. Skill match phải chính xác dựa trên overlap thực tế

## OUTPUT FORMAT (JSON)
{
  "matchedJobs": [
    {
      "jobId": "id_của_job",
      "matchScore": 75,
      "matchedSkills": ["React", "JavaScript"],
      "missingSkills": ["TypeScript", "GraphQL"],
      "reason": "Lý do phù hợp",
      "advice": "Lời khuyên để tăng khả năng ứng tuyển"
    }
  ],
  "skillGaps": [
    {
      "skill": "TypeScript",
      "importance": "high|medium|low",
      "suggestion": "Gợi ý cách bổ sung"
    }
  ],
  "overallAdvice": "Lời khuyên tổng quan cho sinh viên",
  "marketInsight": "Nhận xét về thị trường tuyển dụng liên quan"
}"""


def build_job_prompt(student_data: dict) -> str:
    """Build prompt gợi ý việc làm theo tiêu chí request_ai.md 2.1"""
    skills = student_data.get("studentSkills") or []
    career_pref = student_data.get("careerPreference") or {}
    jobs = student_data.get("jobs") or []

    prompt = "## HỒ SƠ SINH VIÊN\n\n"

    # Kỹ năng hiện có
    if skills:
        prompt += f"### Kỹ năng hiện có ({len(skills)} kỹ năng)\n"
        for s in skills:
            name = s.get("skillName") or "N/A"
            source_map = {"roadmap": "✅ Lộ trình", "academic": "🎓 HP", "manual": "📝 Tự khai"}
            source = source_map.get(s.get("source", ""), "📝 Tự khai")
            prompt += f"- {name} [{source}] Level: {s.get('proficiencyLevel', 1)}/5\n"
        prompt += "\n"

    # Sở thích nghề nghiệp (2.1: lọc theo hướng nghề, lương, địa điểm, loại hình)
    if career_pref:
        prompt += "### Sở thích nghề nghiệp\n"
        if career_pref.get("careerPaths"):
            prompt += f"- Hướng nghề: {', '.join(career_pref['careerPaths'])}\n"
        if career_pref.get("preferredLocations"):
            prompt += f"- Khu vực: {', '.join(career_pref['preferredLocations'])}\n"
        salary = career_pref.get("expectedSalary") or {}
        if salary.get("min"):
            prompt += f"- Lương mong muốn: {salary.get('min', 0)}-{salary.get('max', 0)} triệu\n"
        if career_pref.get("jobTypes"):
            prompt += f"- Loại hình: {', '.join(career_pref['jobTypes'])}\n"
        prompt += "\n"

    # Danh sách tin tuyển dụng
    if jobs:
        prompt += f"### Danh sách việc làm hiện có ({len(jobs)} tin)\n"
        for job in jobs:
            req_skills = ", ".join(job.get("requiredSkillNames") or []) or "N/A"
            salary = job.get("salaryRange") or {}
            salary_text = (
                "Thỏa thuận"
                if salary.get("isNegotiable")
                else f"{salary.get('min', 0)}-{salary.get('max', 0)} triệu"
            )
            location = job.get("locationText") or "N/A"
            prompt += (
                f"- [{job.get('_id')}] \"{job.get('title')}\" tại {job.get('companyName', 'N/A')} "
                f"| {job.get('jobType', 'N/A')} | {salary_text} | Cần: {req_skills} | {location}\n"
            )

    prompt += """
## YÊU CẦU
1. Đối chiếu kỹ năng sinh viên với từng job → tính matchScore (%)
2. Sắp xếp theo matchScore giảm dần, lấy top 5
3. Phân tích skill gaps quan trọng nhất
4. Đưa lời khuyên cải thiện hồ sơ
5. Nhận xét thị trường tuyển dụng

Trả về JSON thuần (không markdown, không backtick, không giải thích)."""

    return prompt

"""
Prompts — Gợi ý Lộ trình AI cá nhân hóa
Theo request_ai.md Section 1
"""

ROADMAP_SYSTEM_PROMPT = """Bạn là EduPath AI — trợ lý tư vấn học tập và định hướng nghề nghiệp cho sinh viên CNTT tại Việt Nam.

## NHIỆM VỤ
Phân tích toàn diện hồ sơ sinh viên và đề xuất lộ trình học tập CÁ NHÂN HÓA.

## QUY TẮC
1. Trả lời HOÀN TOÀN bằng Tiếng Việt
2. Output PHẢI là JSON hợp lệ (không markdown, không backtick, không giải thích thêm)
3. Dựa trên DỮ LIỆU THỰC của sinh viên, không bịa đặt
4. Lộ trình phải THỰC TẾ và KHẢ THI
5. Điều chỉnh dựa trên lộ trình mẫu: GIẢM skill đã thành thạo, TĂNG skill yếu, BỔ SUNG skill thiếu

## OUTPUT FORMAT (JSON)
{
  "analysis": {
    "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
    "weaknesses": ["Điểm yếu 1"],
    "currentLevel": "beginner|intermediate|advanced",
    "summary": "Tóm tắt ngắn gọn về hồ sơ sinh viên"
  },
  "suggestedCareerPaths": [
    {
      "title": "Tên hướng nghề",
      "matchScore": 85,
      "reason": "Lý do phù hợp"
    }
  ],
  "personalizedRoadmap": {
    "title": "Tên lộ trình cá nhân hóa",
    "description": "Mô tả ngắn",
    "estimatedMonths": 6,
    "phases": [
      {
        "name": "Tên giai đoạn",
        "duration": "2 tháng",
        "skills": [
          {
            "name": "Tên kỹ năng",
            "level": "beginner|intermediate|advanced",
            "sessions": 10,
            "reason": "Lý do cần học / hoặc 'Đã thành thạo - giảm bớt'"
          }
        ]
      }
    ],
    "adjustments": [
      "Skill X đã thành thạo → giảm 5 buổi",
      "Skill Y còn yếu → tăng 8 buổi"
    ]
  },
  "advice": "Lời khuyên dành riêng cho sinh viên"
}"""


def build_roadmap_prompt(student_data: dict) -> str:
    """Build prompt từ 7 nguồn dữ liệu đầu vào (theo request_ai.md 1.1)"""
    career_pref = student_data.get("careerPreference") or {}
    academic = student_data.get("academicProfile") or {}
    skills = student_data.get("studentSkills") or []
    roadmaps = student_data.get("availableRoadmaps") or []

    prompt = "## DỮ LIỆU SINH VIÊN\n\n"

    # a. Hướng nghề nghiệp mong muốn
    if career_pref:
        prompt += "### 1. Sở thích nghề nghiệp\n"
        if career_pref.get("careerPaths"):
            prompt += f"- Hướng nghề: {', '.join(career_pref['careerPaths'])}\n"
        # b. Khu vực làm việc mong muốn
        if career_pref.get("preferredLocations"):
            prompt += f"- Khu vực mong muốn: {', '.join(career_pref['preferredLocations'])}\n"
        # c. Mức lương mong muốn
        salary = career_pref.get("expectedSalary") or {}
        if salary.get("min") or salary.get("max"):
            prompt += f"- Mức lương mong muốn: {salary.get('min', 0)}-{salary.get('max', 0)} triệu/tháng\n"
        # d. Công ty quan tâm
        if career_pref.get("interestedCompanies"):
            prompt += f"- Công ty quan tâm: {', '.join(career_pref['interestedCompanies'])}\n"
        if career_pref.get("jobTypes"):
            prompt += f"- Loại hình: {', '.join(career_pref['jobTypes'])}\n"
        prompt += "\n"

    # e. Hồ sơ học tập + f. Kết quả từng HP
    if academic:
        prompt += "### 2. Hồ sơ học tập\n"
        prompt += f"- GPA: {academic.get('gpa', 'Chưa có')}\n"
        prompt += f"- Tín chỉ tích lũy: {academic.get('completedCredits', 0)}\n"
        prompt += f"- Học kỳ hiện tại: {academic.get('currentSemester', 'N/A')}\n"

        course_grades = academic.get("courseGrades") or []
        if course_grades:
            good = sorted(
                [cg for cg in course_grades if (cg.get("numericGrade") or 0) >= 7],
                key=lambda x: x.get("numericGrade", 0),
                reverse=True,
            )[:15]
            if good:
                prompt += "\n#### Kết quả học phần (điểm cao):\n"
                for cg in good:
                    name = cg.get("courseName") or "N/A"
                    prompt += f"- {name}: {cg.get('numericGrade', 0)}/10 ({cg.get('letterGrade', '')})\n"

            weak = sorted(
                [cg for cg in course_grades if 0 < (cg.get("numericGrade") or 0) < 6],
                key=lambda x: x.get("numericGrade", 0),
            )[:5]
            if weak:
                prompt += "\n#### Học phần cần cải thiện:\n"
                for cg in weak:
                    name = cg.get("courseName") or "N/A"
                    prompt += f"- {name}: {cg.get('numericGrade', 0)}/10\n"
        prompt += "\n"

    # g. Skill Map / kỹ năng hiện có
    if skills:
        prompt += f"### 3. Kỹ năng hiện có ({len(skills)} kỹ năng)\n"
        for s in skills:
            name = s.get("skillName") or "N/A"
            source = {"roadmap": "(từ lộ trình)", "academic": "(từ HP)", "manual": "(tự khai báo)"}.get(
                s.get("source", ""), ""
            )
            prompt += f"- {name} {source} — Level: {s.get('proficiencyLevel', 1)}/5\n"
        prompt += "\n"

    # Lộ trình mẫu có sẵn
    if roadmaps:
        prompt += f"### 4. Lộ trình mẫu trong hệ thống ({len(roadmaps)} lộ trình)\n"
        for r in roadmaps:
            r_skills = ", ".join(r.get("skillNames", [])) if r.get("skillNames") else ""
            prompt += f'- "{r.get("title", "")}" ({r.get("careerPath", "")}, {r.get("difficulty", "")}, {r.get("estimatedMonths", 0)} tháng) — Skills: {r_skills}\n'
        prompt += "\n"

    prompt += """
## YÊU CẦU
Dựa trên dữ liệu trên, hãy:
1. Phân tích điểm mạnh/yếu của sinh viên
2. Gợi ý 2-3 hướng nghề phù hợp nhất (cùng lý do)
3. Tạo lộ trình CÁ NHÂN HÓA dựa trên lộ trình mẫu phù hợp nhất, điều chỉnh:
   - GIẢM kỹ năng đã thành thạo
   - TĂNG kỹ năng còn yếu
   - BỔ SUNG kỹ năng thiếu
4. Đưa ra lời khuyên cụ thể

Trả về JSON thuần (không markdown, không backtick, không giải thích)."""

    return prompt

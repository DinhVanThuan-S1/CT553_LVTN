"""
Prompts — Chatbot AI (cải tiến)
Tối ưu: markdown formatting, structured response, richer context
"""

CHATBOT_SYSTEM_PROMPT = """Bạn là **EduPath AI** — trợ lý thông minh của hệ thống EduPath.

## VAI TRÒ
Hỗ trợ sinh viên ngành CNTT về:
- Định hướng nghề nghiệp (Frontend, Backend, Fullstack, DevOps, AI/ML, Mobile...)
- Lộ trình học tập cá nhân hóa
- Kỹ năng cần thiết cho từng ngành
- Cơ hội việc làm và ứng tuyển
- Hướng dẫn sử dụng EduPath

## QUY TẮC TRẢ LỜI

### Format
- Dùng **bold** cho từ khóa quan trọng
- Dùng bullet (`-`) cho danh sách, KHÔNG dùng số thứ tự trừ khi cần thiết
- Dùng `code` cho tên công nghệ/kỹ năng cụ thể (React, Docker, Python...)
- Emoji: dùng có chọn lọc, không quá 2 emoji/câu trả lời
- Ngắn gọn: tối đa 180 từ, trừ khi người dùng hỏi chi tiết

### Nội dung
- Tiếng Việt, thân thiện, chuyên nghiệp
- Nếu có context data → dùng data thực, không bịa
- Nếu không có context → tư vấn từ kiến thức chung
- Không trả lời chủ đề ngoài CNTT/nghề nghiệp/hệ thống EduPath

### Cấu trúc câu trả lời (khi phù hợp)
**[Đánh giá ngắn]** → **[Gợi ý cụ thể]** → **[Bước tiếp theo]**

## THÔNG TIN EDUPATH
- **Lộ trình**: Admin tạo sẵn (Frontend, Backend Developer, Fullstack, DevOps, AI/ML...)
- **Gợi ý lộ trình**: Thuật toán phân tích profile SV → gợi ý lộ trình phù hợp nhất
- **Gợi ý lộ trình cá nhân hóa**: Tạo lộ trình riêng với điều chỉnh giờ học theo năng lực
- **Skill Map**: Kỹ năng từ 3 nguồn — lộ trình, học phần, tự khai báo
- **Việc làm**: Nhà tuyển dụng đăng tuyển, SV ứng tuyển qua EduPath
- **Gợi ý việc làm**: Khớp profile SV với yêu cầu công việc"""


def build_chat_context(context_data: dict) -> str:
    """Inject context từ pre-computed summaries (nhanh, ngắn gọn)"""
    if not context_data:
        return ""

    parts = ["\n\n---\n**THÔNG TIN SINH VIÊN (để tham khảo khi trả lời)**\n"]

    profile = context_data.get("studentProfile") or {}
    if profile.get("fullName"):
        info = f"- Tên: {profile['fullName']}"
        if profile.get("gpa"):
            info += f" | GPA: {profile['gpa']:.2f}"
        if profile.get("completedCredits"):
            info += f" | Tín chỉ: {profile['completedCredits']}"
        parts.append(info)

    if context_data.get("careerSummary"):
        parts.append(f"- Nghề nghiệp: {context_data['careerSummary']}")

    if context_data.get("skillsSummary"):
        parts.append(f"- Kỹ năng: {context_data['skillsSummary']}")

    if context_data.get("academicSummary"):
        parts.append(f"- Học tập: {context_data['academicSummary']}")

    if context_data.get("availableRoadmaps"):
        roadmaps = context_data["availableRoadmaps"]
        names = ", ".join(r.get("title", "") for r in roadmaps[:5])
        parts.append(f"- Lộ trình có sẵn: {names}")

    if context_data.get("activeJobsCount"):
        parts.append(f"- Việc làm đang tuyển: {context_data['activeJobsCount']} tin")

    parts.append("---")
    return "\n".join(parts)

"""
Prompts — Chatbot AI
Theo request_ai.md Section 3
Tối ưu: dùng pre-computed summaries thay vì raw data
"""

CHATBOT_SYSTEM_PROMPT = """Bạn là EduPath AI — trợ lý thông minh của hệ thống EduPath, nền tảng hỗ trợ định hướng nghề nghiệp và cá nhân hóa lộ trình học tập cho sinh viên ngành Công nghệ thông tin.

## VAI TRÒ
- Hỗ trợ sinh viên chưa biết gì về hệ thống
- Tư vấn hướng đi nghề nghiệp
- Hướng dẫn nhập hồ sơ học tập, khai báo sở thích
- Giải thích kết quả gợi ý lộ trình và việc làm

## HAI CHẾ ĐỘ
1. **Chat theo DB**: Trả lời dựa trên context data (hồ sơ, kỹ năng, lộ trình, việc làm)
2. **Chat tự do**: Giải thích khái niệm nghề nghiệp, tư vấn định hướng

## THÔNG TIN EDUPATH
- Hồ sơ học tập: Nhập điểm HP từng HK
- Sở thích nghề nghiệp: Hướng nghề, khu vực, mức lương, công ty
- Lộ trình: Frontend, Backend, Fullstack, DevOps, AI/ML...
- Skill Map: Kỹ năng từ lộ trình, học phần, tự khai báo
- CV & Việc làm: Tạo CV, ứng tuyển

## QUY TẮC
1. Tiếng Việt, thân thiện, ngắn gọn
2. Dùng emoji phù hợp
3. Có context → dùng data. Tự do → tư vấn từ kiến thức
4. Không bịa đặt
5. Ngoài phạm vi CNTT → từ chối lịch sự
6. Trả lời NGẮN GỌN (tối đa 200 từ trừ khi hỏi chi tiết)"""


def build_chat_context(context_data: dict) -> str:
    """Inject context từ pre-computed summaries (nhanh, ngắn gọn)"""
    if not context_data:
        return ""

    context = "\n\n## CONTEXT DATA\n\n"

    # Thông tin sinh viên
    profile = context_data.get("studentProfile") or {}
    if profile:
        context += f"**Sinh viên**: {profile.get('fullName', 'N/A')}"
        if profile.get("gpa"):
            context += f" | GPA: {profile['gpa']}"
        if profile.get("completedCredits"):
            context += f" | {profile['completedCredits']} tín chỉ"
        context += "\n"

    # Pre-computed summaries (đã build sẵn từ backend)
    if context_data.get("careerSummary"):
        context += f"**Nghề nghiệp**: {context_data['careerSummary']}\n"

    if context_data.get("skillsSummary"):
        context += f"**Kỹ năng**: {context_data['skillsSummary']}\n"

    if context_data.get("academicSummary"):
        context += f"**Học tập**: {context_data['academicSummary']}\n"

    return context

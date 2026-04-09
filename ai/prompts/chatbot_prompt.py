"""
Prompts — Chatbot AI
Theo request_ai.md Section 3
"""

CHATBOT_SYSTEM_PROMPT = """Bạn là EduPath AI — trợ lý thông minh của hệ thống EduPath, nền tảng hỗ trợ định hướng nghề nghiệp và cá nhân hóa lộ trình học tập cho sinh viên ngành Công nghệ thông tin.

## VAI TRÒ (theo request_ai.md 3.3)
- Hỗ trợ sinh viên chưa biết gì về hệ thống
- Hỗ trợ sinh viên chưa có kiến thức rõ ràng về hướng đi nghề nghiệp
- Hướng dẫn cách tải lên / nhập hồ sơ học tập
- Hỗ trợ khai báo sở thích nghề nghiệp
- Giải thích kết quả gợi ý lộ trình và việc làm

## HAI CHẾ ĐỘ HOẠT ĐỘNG

### Chat theo cơ sở dữ liệu (request_ai.md 3.1):
Nếu context data được cung cấp, trả lời dựa trên:
- Thông tin về các hướng nghề nghiệp
- Thông tin lộ trình học tập trong hệ thống
- Gợi ý kỹ năng cần học
- Hướng dẫn sử dụng hệ thống EduPath
- Thông tin về việc làm, mức lương, khu vực tuyển dụng

### Chat tự do (request_ai.md 3.2):
Khi không có context hoặc câu hỏi tổng quát:
- Giải thích các khái niệm nghề nghiệp cơ bản
- Tư vấn cho sinh viên chưa biết bắt đầu từ đâu
- Hỗ trợ khám phá sở thích nghề nghiệp
- Gợi ý bước đầu tiên để xây dựng hồ sơ định hướng

## THÔNG TIN HỆ THỐNG EDUPATH
1. **Hồ sơ học tập**: Nhập điểm các học phần từng học kỳ
2. **Sở thích nghề nghiệp**: Chọn hướng nghề, khu vực, mức lương, công ty
3. **Lộ trình học tập**: Có sẵn các lộ trình mẫu (Frontend, Backend, Fullstack, DevOps, AI/ML...)
4. **Skill Map**: Quản lý kỹ năng từ 3 nguồn: lộ trình, học phần, tự khai báo
5. **CV & Việc làm**: Tạo CV, tìm việc, ứng tuyển
6. **AI Gợi ý**: Gợi ý lộ trình & việc làm cá nhân hóa

## QUY TẮC
1. Trả lời bằng Tiếng Việt, thân thiện, ngắn gọn và dễ hiểu
2. Sử dụng emoji phù hợp để tăng tương tác
3. Nếu hỏi về hệ thống → dùng CONTEXT DATA bên dưới
4. Nếu hỏi tự do về CNTT/nghề nghiệp → tư vấn dựa trên kiến thức
5. Không bịa đặt thông tin không có trong context
6. Với câu hỏi ngoài phạm vi CNTT/nghề nghiệp → từ chối lịch sự"""


def build_chat_context(context_data: dict) -> str:
    """Inject context dữ liệu từ DB vào system prompt"""
    if not context_data:
        return ""

    context = "\n\n## CONTEXT DATA (Dữ liệu cá nhân sinh viên)\n\n"

    profile = context_data.get("studentProfile") or {}
    if profile:
        context += "### Thông tin sinh viên\n"
        context += f"- Tên: {profile.get('fullName', 'N/A')}\n"
        if profile.get("gpa"):
            context += f"- GPA: {profile['gpa']}\n"
        if profile.get("completedCredits"):
            context += f"- Tín chỉ tích lũy: {profile['completedCredits']}\n"
        context += "\n"

    career_pref = context_data.get("careerPref") or {}
    if career_pref:
        context += "### Sở thích nghề nghiệp\n"
        if career_pref.get("careerPaths"):
            context += f"- Hướng nghề: {', '.join(career_pref['careerPaths'])}\n"
        if career_pref.get("preferredLocations"):
            context += f"- Khu vực: {', '.join(career_pref['preferredLocations'])}\n"
        context += "\n"

    skills = context_data.get("skills") or []
    if skills:
        context += f"### Kỹ năng hiện có ({len(skills)} kỹ năng)\n"
        for s in skills[:15]:
            context += f"- {s.get('skillName') or s.get('name', 'N/A')}\n"
        context += "\n"

    roadmaps = context_data.get("roadmaps") or []
    if roadmaps:
        context += "### Lộ trình mẫu trong hệ thống\n"
        for r in roadmaps:
            context += f"- \"{r.get('title')}\" — {r.get('careerPath')} ({r.get('difficulty')}, {r.get('estimatedMonths')} tháng)\n"
        context += "\n"

    my_roadmaps = context_data.get("myRoadmaps") or []
    if my_roadmaps:
        context += "### Lộ trình đang học\n"
        for r in my_roadmaps:
            context += f"- \"{r.get('title', 'N/A')}\" — {r.get('status')}, tiến độ {r.get('progress', 0)}%\n"
        context += "\n"

    return context

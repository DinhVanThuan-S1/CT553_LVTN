/**
 * System Prompts — Chatbot AI
 */

const CHATBOT_SYSTEM_PROMPT = `Bạn là EduPath AI — trợ lý thông minh của hệ thống EduPath, một nền tảng hỗ trợ định hướng nghề nghiệp và cá nhân hóa lộ trình học tập cho sinh viên ngành Công nghệ thông tin.

## VAI TRÒ
- Tư vấn hướng nghề nghiệp cho sinh viên CNTT
- Giải thích cách sử dụng hệ thống EduPath
- Hướng dẫn nhập hồ sơ học tập, khai báo sở thích nghề nghiệp
- Giải đáp về các lộ trình học tập, kỹ năng, việc làm
- Tư vấn tự do cho sinh viên chưa biết bắt đầu từ đâu

## THÔNG TIN HỆ THỐNG EDUPATH
EduPath gồm các tính năng chính:
1. **Hồ sơ học tập**: Nhập điểm các học phần từng học kỳ
2. **Sở thích nghề nghiệp**: Chọn hướng nghề, khu vực, mức lương, công ty quan tâm
3. **Lộ trình học tập**: Hệ thống có sẵn các lộ trình mẫu (Frontend, Backend, Fullstack, DevOps, AI/ML...)
4. **Skill Map**: Quản lý kỹ năng — 3 nguồn: lộ trình, học phần, tự khai
5. **CV & Việc làm**: Tạo CV, tìm việc, ứng tuyển
6. **AI Gợi ý**: Gợi ý lộ trình & việc làm dựa trên hồ sơ
7. **Chat AI**: Chính bạn — trợ lý tư vấn thông minh

## QUY TẮC
1. Trả lời bằng Tiếng Việt, thân thiện, ngắn gọn
2. Sử dụng emoji phù hợp để tăng tương tác
3. Nếu hỏi về hệ thống → dùng CONTEXT DATA bên dưới
4. Nếu hỏi tự do → tư vấn dựa trên kiến thức CNTT
5. Không bịa đặt thông tin không có trong context
6. Với câu hỏi ngoài phạm vi CNTT/nghề nghiệp → từ chối lịch sự`;

/**
 * Build chatbot context từ DB data
 */
function buildChatContext(contextData) {
  if (!contextData) return '';

  let context = `\n\n## CONTEXT DATA (Dữ liệu từ hệ thống)\n\n`;

  if (contextData.studentProfile) {
    const p = contextData.studentProfile;
    context += `### Thông tin sinh viên hiện tại\n`;
    context += `- Tên: ${p.fullName || 'N/A'}\n`;
    context += `- GPA: ${p.gpa?.toFixed(2) || 'Chưa có'}\n`;
    context += `- Tín chỉ: ${p.completedCredits || 0}\n`;
    context += '\n';
  }

  if (contextData.careerPref) {
    context += `### Sở thích nghề nghiệp\n`;
    const cp = contextData.careerPref;
    if (cp.careerPaths?.length) context += `- Hướng nghề: ${cp.careerPaths.join(', ')}\n`;
    if (cp.preferredLocations?.length) context += `- Khu vực: ${cp.preferredLocations.join(', ')}\n`;
    context += '\n';
  }

  if (contextData.skills?.length) {
    context += `### Kỹ năng hiện có (${contextData.skills.length})\n`;
    contextData.skills.slice(0, 15).forEach(s => {
      context += `- ${s.skill?.name || s.name || 'N/A'}\n`;
    });
    context += '\n';
  }

  if (contextData.roadmaps?.length) {
    context += `### Lộ trình mẫu trong hệ thống\n`;
    contextData.roadmaps.forEach(r => {
      context += `- "${r.title}" — ${r.careerPath} (${r.difficulty}, ${r.estimatedMonths} tháng)\n`;
    });
    context += '\n';
  }

  if (contextData.myRoadmaps?.length) {
    context += `### Lộ trình đang học\n`;
    contextData.myRoadmaps.forEach(r => {
      context += `- "${r.roadmap?.title || 'N/A'}" — ${r.status}, tiến độ ${r.progress}%\n`;
    });
    context += '\n';
  }

  return context;
}

module.exports = { CHATBOT_SYSTEM_PROMPT, buildChatContext };

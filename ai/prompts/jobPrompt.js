/**
 * System Prompts — Gợi ý Việc làm AI
 */

const JOB_SYSTEM_PROMPT = `Bạn là EduPath AI — trợ lý tư vấn việc làm cho sinh viên CNTT tại Việt Nam.

## NHIỆM VỤ
Phân tích hồ sơ kỹ năng của sinh viên và đối chiếu với các tin tuyển dụng để gợi ý việc làm phù hợp nhất.

## QUY TẮC
1. Trả lời HOÀN TOÀN bằng Tiếng Việt
2. Output PHẢI là JSON hợp lệ (không markdown, không backtick)
3. Đánh giá dựa trên kỹ năng THỰC TẾ, không phóng đại
4. Skill match phải chính xác dựa trên overlap thực

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
}`;

/**
 * Build prompt gợi ý việc làm
 */
function buildJobPrompt(studentData) {
  const { studentSkills, careerPreference, jobs } = studentData;

  let prompt = `## HỒ SƠ SINH VIÊN\n\n`;

  // Kỹ năng
  if (studentSkills?.length) {
    prompt += `### Kỹ năng hiện có\n`;
    studentSkills.forEach(ss => {
      const name = ss.skill?.name || 'N/A';
      const source = ss.source === 'roadmap' ? '✅ Lộ trình' : ss.source === 'academic' ? '🎓 HP' : '📝 Tự khai';
      prompt += `- ${name} [${source}] Level: ${ss.proficiencyLevel || 1}/5\n`;
    });
    prompt += '\n';
  }

  // Sở thích
  if (careerPreference) {
    prompt += `### Sở thích nghề nghiệp\n`;
    if (careerPreference.careerPaths?.length) prompt += `- Hướng nghề: ${careerPreference.careerPaths.join(', ')}\n`;
    if (careerPreference.preferredLocations?.length) prompt += `- Khu vực: ${careerPreference.preferredLocations.join(', ')}\n`;
    if (careerPreference.expectedSalary?.min) prompt += `- Lương mong muốn: ${careerPreference.expectedSalary.min}-${careerPreference.expectedSalary.max} triệu\n`;
    if (careerPreference.jobTypes?.length) prompt += `- Loại hình: ${careerPreference.jobTypes.join(', ')}\n`;
    prompt += '\n';
  }

  // Danh sách jobs
  if (jobs?.length) {
    prompt += `### Danh sách việc làm hiện có (${jobs.length} tin)\n`;
    jobs.forEach(job => {
      const skills = job.requiredSkills?.map(s => s.skill?.name).filter(Boolean).join(', ') || 'N/A';
      const salary = job.salaryRange?.isNegotiable
        ? 'Thỏa thuận'
        : `${job.salaryRange?.min || 0}-${job.salaryRange?.max || 0} triệu`;
      prompt += `- [${job._id}] "${job.title}" tại ${job.company?.name || 'N/A'} | ${job.jobType} | ${salary} | Cần: ${skills} | ${job.locationText || 'N/A'}\n`;
    });
  }

  prompt += `\n## YÊU CẦU\n1. Đối chiếu kỹ năng SV với từng job → tính matchScore (%)\n2. Sắp xếp theo matchScore giảm dần, lấy top 5\n3. Phân tích skill gaps quan trọng nhất\n4. Đưa lời khuyên cải thiện hồ sơ\n\nTrả về JSON (không markdown, không backtick).`;

  return prompt;
}

module.exports = { JOB_SYSTEM_PROMPT, buildJobPrompt };

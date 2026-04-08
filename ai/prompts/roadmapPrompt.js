/**
 * System Prompts — Gợi ý Lộ trình AI cá nhân hóa
 */

const ROADMAP_SYSTEM_PROMPT = `Bạn là EduPath AI — trợ lý tư vấn học tập và định hướng nghề nghiệp cho sinh viên CNTT tại Việt Nam.

## NHIỆM VỤ
Phân tích toàn diện hồ sơ sinh viên và đề xuất lộ trình học tập CÁ NHÂN HÓA.

## QUY TẮC
1. Trả lời HOÀN TOÀN bằng Tiếng Việt
2. Output PHẢI là JSON hợp lệ (không markdown, không backtick)
3. Dựa trên DỮ LIỆU THỰC của sinh viên, không bịa đặt
4. Lộ trình phải THỰC TẾ và KHẢ THI

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
}`;

/**
 * Build prompt chính với dữ liệu SV
 */
function buildRoadmapPrompt(studentData) {
  const {
    careerPreference,
    academicProfile,
    studentSkills,
    availableRoadmaps,
  } = studentData;

  let prompt = `## DỮ LIỆU SINH VIÊN\n\n`;

  // 1. Hướng nghề nghiệp
  if (careerPreference) {
    prompt += `### 1. Sở thích nghề nghiệp\n`;
    if (careerPreference.careerPaths?.length) {
      prompt += `- Hướng nghề: ${careerPreference.careerPaths.join(', ')}\n`;
    }
    if (careerPreference.preferredLocations?.length) {
      prompt += `- Khu vực mong muốn: ${careerPreference.preferredLocations.join(', ')}\n`;
    }
    if (careerPreference.expectedSalary?.min || careerPreference.expectedSalary?.max) {
      prompt += `- Mức lương mong muốn: ${careerPreference.expectedSalary.min || 0}-${careerPreference.expectedSalary.max || 0} triệu/tháng\n`;
    }
    if (careerPreference.interestedCompanies?.length) {
      prompt += `- Công ty quan tâm: ${careerPreference.interestedCompanies.join(', ')}\n`;
    }
    if (careerPreference.jobTypes?.length) {
      prompt += `- Loại hình: ${careerPreference.jobTypes.join(', ')}\n`;
    }
    prompt += '\n';
  }

  // 2. Hồ sơ học tập
  if (academicProfile) {
    prompt += `### 2. Hồ sơ học tập\n`;
    prompt += `- GPA: ${academicProfile.gpa?.toFixed(2) || 'Chưa có'}\n`;
    prompt += `- Tín chỉ tích lũy: ${academicProfile.completedCredits || 0}\n`;
    prompt += `- Học kỳ hiện tại: ${academicProfile.currentSemester || 'N/A'}\n`;
    
    if (academicProfile.courseGrades?.length) {
      prompt += `\n#### Kết quả học phần (điểm cao):\n`;
      const goodGrades = academicProfile.courseGrades
        .filter(cg => cg.numericGrade >= 7)
        .sort((a, b) => b.numericGrade - a.numericGrade)
        .slice(0, 15);
      goodGrades.forEach(cg => {
        const courseName = cg.course?.name || cg.courseName || 'N/A';
        prompt += `- ${courseName}: ${cg.numericGrade}/10 (${cg.letterGrade})\n`;
      });

      const weakGrades = academicProfile.courseGrades
        .filter(cg => cg.numericGrade > 0 && cg.numericGrade < 6)
        .sort((a, b) => a.numericGrade - b.numericGrade)
        .slice(0, 5);
      if (weakGrades.length) {
        prompt += `\n#### Học phần cần cải thiện:\n`;
        weakGrades.forEach(cg => {
          const courseName = cg.course?.name || cg.courseName || 'N/A';
          prompt += `- ${courseName}: ${cg.numericGrade}/10\n`;
        });
      }
    }
    prompt += '\n';
  }

  // 3. Kỹ năng hiện có
  if (studentSkills?.length) {
    prompt += `### 3. Kỹ năng hiện có\n`;
    studentSkills.forEach(ss => {
      const skillName = ss.skill?.name || ss.skillName || 'N/A';
      const source = ss.source === 'roadmap' ? '(từ lộ trình)' : ss.source === 'academic' ? '(từ HP)' : '(tự khai báo)';
      prompt += `- ${skillName} ${source} — Level: ${ss.proficiencyLevel || 1}/5\n`;
    });
    prompt += '\n';
  }

  // 4. Lộ trình mẫu có sẵn
  if (availableRoadmaps?.length) {
    prompt += `### 4. Lộ trình mẫu trong hệ thống\n`;
    availableRoadmaps.forEach(r => {
      const skills = r.skills?.map(s => s.skill?.name).filter(Boolean).join(', ') || '';
      prompt += `- "${r.title}" (${r.careerPath}, ${r.difficulty}, ${r.estimatedMonths} tháng) — Skills: ${skills}\n`;
    });
    prompt += '\n';
  }

  prompt += `\n## YÊU CẦU\nDựa trên dữ liệu trên, hãy:\n1. Phân tích điểm mạnh/yếu của sinh viên\n2. Gợi ý 2-3 hướng nghề phù hợp nhất (cùng lý do)\n3. Tạo lộ trình CÁ NHÂN HÓA dựa trên lộ trình mẫu phù hợp nhất, điều chỉnh:\n   - GIẢM kỹ năng đã thành thạo\n   - TĂNG kỹ năng còn yếu\n   - BỔ SUNG kỹ năng thiếu\n4. Đưa ra lời khuyên cụ thể\n\nTrả về JSON (không markdown, không backtick).`;

  return prompt;
}

module.exports = { ROADMAP_SYSTEM_PROMPT, buildRoadmapPrompt };

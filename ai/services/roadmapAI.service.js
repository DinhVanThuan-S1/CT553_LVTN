/**
 * AI Roadmap Service — Gợi ý lộ trình cá nhân hóa
 * Thu thập data → build prompt → gọi AI → parse JSON
 */
const AcademicProfile = require('../../backend/src/models/AcademicProfile');
const CareerPreference = require('../../backend/src/models/CareerPreference');
const StudentSkill = require('../../backend/src/models/StudentSkill');
const Roadmap = require('../../backend/src/models/Roadmap');
const { generateText } = require('./aiClient');
const { ROADMAP_SYSTEM_PROMPT, buildRoadmapPrompt } = require('../prompts/roadmapPrompt');

class RoadmapAIService {
  /**
   * Thu thập toàn bộ data của sinh viên
   */
  async _gatherStudentData(studentId) {
    const [careerPreference, academicProfile, studentSkills, availableRoadmaps] = await Promise.all([
      CareerPreference.findOne({ student: studentId }).lean(),
      AcademicProfile.findOne({ student: studentId })
        .populate('courseGrades.course', 'name code courseType relatedSkills')
        .lean(),
      StudentSkill.find({ student: studentId })
        .populate('skill', 'name category')
        .lean(),
      Roadmap.find({ isActive: true })
        .populate('skills.skill', 'name category')
        .lean(),
    ]);

    return { careerPreference, academicProfile, studentSkills, availableRoadmaps };
  }

  /**
   * Gợi ý lộ trình AI cá nhân hóa
   */
  async suggestPersonalizedRoadmap(studentId) {
    // 1. Thu thập data
    const studentData = await this._gatherStudentData(studentId);

    // Validate data đầu vào
    const warnings = [];
    if (!studentData.careerPreference) {
      warnings.push('Chưa cập nhật sở thích nghề nghiệp — kết quả có thể chưa chính xác');
    }
    if (!studentData.academicProfile || !studentData.academicProfile.courseGrades?.length) {
      warnings.push('Chưa nhập hồ sơ học tập — gợi ý dựa trên thông tin hạn chế');
    }

    // 2. Build prompt
    const prompt = buildRoadmapPrompt(studentData);

    // 3. Gọi AI
    const rawResponse = await generateText(prompt, {
      systemInstruction: ROADMAP_SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 4096,
    });

    // 4. Parse JSON response
    let parsed;
    try {
      // Loại bỏ backtick nếu AI vẫn wrap trong code block
      const cleaned = rawResponse
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error('AI response parse error:', err.message);
      console.error('Raw response:', rawResponse.substring(0, 500));
      throw new Error('AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.');
    }

    return {
      ...parsed,
      warnings,
      provider: 'gemini', // or 'ollama' if fallback
    };
  }
}

module.exports = new RoadmapAIService();

/**
 * AI Job Suggestion Service — Gợi ý việc làm AI
 */
const CareerPreference = require('../../backend/src/models/CareerPreference');
const StudentSkill = require('../../backend/src/models/StudentSkill');
const JobPosting = require('../../backend/src/models/JobPosting');
const { generateText } = require('./aiClient');
const { JOB_SYSTEM_PROMPT, buildJobPrompt } = require('../prompts/jobPrompt');

class JobAIService {
  /**
   * Gợi ý việc làm AI
   */
  async suggestJobs(studentId) {
    // 1. Lấy data
    const [studentSkills, careerPreference, jobs] = await Promise.all([
      StudentSkill.find({ student: studentId })
        .populate('skill', 'name category')
        .lean(),
      CareerPreference.findOne({ student: studentId }).lean(),
      JobPosting.find({ status: 'approved' })
        .populate('company', 'name logo')
        .populate('requiredSkills.skill', 'name category')
        .populate('location', 'city district')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    if (!jobs.length) {
      return { matchedJobs: [], skillGaps: [], overallAdvice: 'Hiện chưa có tin tuyển dụng nào trong hệ thống.' };
    }

    // 2. Build prompt
    const prompt = buildJobPrompt({ studentSkills, careerPreference, jobs });

    // 3. Gọi AI
    const rawResponse = await generateText(prompt, {
      systemInstruction: JOB_SYSTEM_PROMPT,
      temperature: 0.5,
      maxTokens: 4096,
    });

    // 4. Parse
    let parsed;
    try {
      const cleaned = rawResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error('AI Job response parse error:', err.message);
      throw new Error('AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.');
    }

    // 5. Enrich với job data thật (attach thông tin job hiển thị)
    if (parsed.matchedJobs) {
      parsed.matchedJobs = parsed.matchedJobs.map(mj => {
        const fullJob = jobs.find(j => j._id.toString() === mj.jobId);
        return { ...mj, job: fullJob || null };
      }).filter(mj => mj.job);
    }

    return parsed;
  }
}

module.exports = new JobAIService();

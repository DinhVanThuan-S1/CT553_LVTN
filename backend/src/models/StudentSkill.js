/**
 * StudentSkill Model
 * Kỹ năng của sinh viên — 3 nguồn:
 *   1. roadmap   — Hoàn thành kỹ năng trong lộ trình (verified, highlight CV)
 *   2. academic  — Hệ thống phân tích HP điểm cao (verified, highlight CV)
 *   3. self      — SV tự khai báo (không highlight)
 */
const mongoose = require('mongoose');

const studentSkillSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
  },
  // Nguồn gốc kỹ năng
  source: {
    type: String,
    enum: ['roadmap', 'academic', 'self'],
    required: true,
  },
  // Verified = highlight trên CV (roadmap + academic = true, self = false)
  isVerified: {
    type: Boolean,
    default: false,
  },
  // Mức độ thành thạo (1-5, tùy chọn)
  proficiencyLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
  },
  // Metadata bổ sung theo source
  metadata: {
    // Cho roadmap: ID personal roadmap
    personalRoadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'PersonalRoadmap' },
    // Cho academic: mã HP + điểm
    courseCode: { type: String },
    courseName: { type: String },
    grade: { type: String },
  },
}, {
  timestamps: true,
});

// Mỗi student + skill + source = unique
studentSkillSchema.index({ student: 1, skill: 1, source: 1 }, { unique: true });
studentSkillSchema.index({ student: 1, isVerified: 1 });

module.exports = mongoose.model('StudentSkill', studentSkillSchema);

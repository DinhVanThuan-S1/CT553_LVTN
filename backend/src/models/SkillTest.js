/**
 * SkillTest Model
 * Kết quả bài test kỹ năng của sinh viên
 */
const mongoose = require('mongoose');

const skillTestSchema = new mongoose.Schema({
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
  personalRoadmap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PersonalRoadmap',
  },
  // Câu trả lời
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId },
    selectedOption: { type: Number }, // Index của đáp án đã chọn
    isCorrect: { type: Boolean },
  }],
  // Kết quả
  score: {
    type: Number, // Số câu đúng
    default: 0,
  },
  totalQuestions: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number, // % đúng
    default: 0,
  },
  // Đạt / Không đạt (>=70% = đạt)
  passed: {
    type: Boolean,
    default: false,
  },
  // Thời gian làm (phút)
  duration: {
    type: Number,
    default: 0,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

skillTestSchema.index({ student: 1, skill: 1 });

module.exports = mongoose.model('SkillTest', skillTestSchema);

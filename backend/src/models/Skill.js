/**
 * Skill Model
 * Kỹ năng CNTT với tài nguyên học tập, bài tập và câu hỏi test
 */
const mongoose = require('mongoose');

// Schema cho tài nguyên học tập
const learningResourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['video', 'article', 'documentation', 'course', 'book', 'tool'],
    default: 'article',
  },
  url: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  duration: { type: String, default: '' }, // VD: "2h30m", "30 min"
}, { _id: true });

// Schema cho bài tập thực hành
const exerciseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  estimatedTime: { type: String, default: '30 min' },
  instructions: { type: String, default: '' },
}, { _id: true });

// Schema cho câu hỏi test
const testQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  }],
  explanation: { type: String, default: '' },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
}, { _id: true });

// Schema chính cho Skill
const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên kỹ năng là bắt buộc'],
    trim: true,
    unique: true,
  },
  // Nhóm kỹ năng
  category: {
    type: String,
    enum: [
      'programming',    // Ngôn ngữ lập trình
      'frontend',       // Frontend
      'backend',        // Backend
      'database',       // Cơ sở dữ liệu
      'devops',         // DevOps & Tools
      'mobile',         // Mobile
      'ai_ml',          // AI/ML
      'software_engineering', // Kỹ thuật phần mềm
      'soft_skills',    // Kỹ năng mềm
      'networking',     // Mạng & bảo mật
      'other',
    ],
    required: [true, 'Nhóm kỹ năng là bắt buộc'],
  },
  // Mô tả kỹ năng
  description: {
    type: String,
    trim: true,
    default: '',
  },
  // Icon (emoji hoặc icon name)
  icon: {
    type: String,
    default: '📘',
  },
  // Tài nguyên học tập
  resources: [learningResourceSchema],
  // Bài tập thực hành
  exercises: [exerciseSchema],
  // Bộ câu hỏi test
  testQuestions: [testQuestionSchema],
  // Thời lượng học ước tính (giờ)
  estimatedHours: {
    type: Number,
    default: 20,
  },
  // Trạng thái
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Text index cho tìm kiếm
skillSchema.index({ name: 'text', category: 1 });

module.exports = mongoose.model('Skill', skillSchema);

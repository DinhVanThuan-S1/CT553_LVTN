/**
 * Resource Model
 * Tài nguyên học tập độc lập — có thể thuộc nhiều kỹ năng
 * Types: content (Nội dung), exercise (Bài tập), test (Bài test)
 */
const mongoose = require('mongoose');

// Schema cho options của câu hỏi test
const testOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
}, { _id: false });

const resourceSchema = new mongoose.Schema({
  // === Thông tin cơ bản ===
  title: {
    type: String,
    required: [true, 'Tên tài nguyên là bắt buộc'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },

  // === Loại tài nguyên ===
  type: {
    type: String,
    enum: ['content', 'exercise', 'test'],
    required: [true, 'Loại tài nguyên là bắt buộc'],
  },

  // === Phân loại định dạng (chỉ áp dụng cho type=content) ===
  category: {
    type: String,
    enum: ['video', 'article', 'course', 'documentation', 'tool', 'book'],
    default: 'article',
  },

  // === URL ngoài (cho content) ===
  url: {
    type: String,
    trim: true,
    default: '',
  },

  // === Nội dung markdown (cho content không có URL, hoặc exercise/test) ===
  content: {
    type: String,
    default: '',
  },

  // === Difficulty ===
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },

  // === Thời lượng ước tính (phút) ===
  estimatedMinutes: {
    type: Number,
    default: 30,
    min: 1,
  },

  // === Câu hỏi test (chỉ dùng khi type=test) ===
  testQuestions: [{
    question: { type: String, required: true },
    options: [testOptionSchema],
    explanation: { type: String, default: '' },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
  }],

  // === Liên kết nhiều kỹ năng ===
  skills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
  }],

  // === Tags tìm kiếm ===
  tags: [{ type: String, trim: true }],

  // === Trạng thái ===
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // === Thống kê ===
  views: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Index tìm kiếm
resourceSchema.index({ title: 'text', description: 'text', tags: 'text' });
resourceSchema.index({ type: 1, isActive: 1 });
resourceSchema.index({ skills: 1 });

module.exports = mongoose.model('Resource', resourceSchema);

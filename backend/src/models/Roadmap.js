/**
 * Roadmap Model
 * Lộ trình học mẫu (do Admin tạo)
 * VD: Frontend Developer, Backend Developer, Full-stack Developer
 */
const mongoose = require('mongoose');

// Schema cho kỹ năng trong lộ trình (có thứ tự)
const roadmapSkillSchema = new mongoose.Schema({
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
  },
  // Thứ tự học
  order: {
    type: Number,
    required: true,
  },
  // Thời lượng ước tính cho kỹ năng này trong lộ trình (giờ)
  estimatedHours: {
    type: Number,
    default: 20,
  },
  // Mức độ cần đạt
  targetLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate',
  },
}, { _id: true });

const roadmapSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tên lộ trình là bắt buộc'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  // Hướng nghề nghiệp
  careerPath: {
    type: String,
    required: [true, 'Hướng nghề nghiệp là bắt buộc'],
    trim: true,
    // VD: "Frontend Developer"
  },
  // Ảnh thumbnail
  thumbnail: {
    type: String,
    default: '',
  },
  // Thời lượng ước tính tổng (tháng)
  estimatedMonths: {
    type: Number,
    required: true,
    default: 6,
  },
  // Mức độ khó
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate',
  },
  // Danh sách kỹ năng (có thứ tự)
  skills: [roadmapSkillSchema],
  // Công việc liên quan (job templates)
  relatedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobTemplate',
  }],
  // Đánh giá trung bình
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  // Số lượt chọn
  enrollmentCount: {
    type: Number,
    default: 0,
  },
  // Người tạo (admin)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Text index cho tìm kiếm
roadmapSchema.index({ title: 'text', careerPath: 'text' });

module.exports = mongoose.model('Roadmap', roadmapSchema);

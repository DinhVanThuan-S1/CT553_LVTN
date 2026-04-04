/**
 * Skill Model
 * Kỹ năng CNTT — tài nguyên được lưu riêng trong Resource collection.
 * Skill chỉ lưu tham chiếu sang Resource qua linkedResources[].
 */
const mongoose = require('mongoose');

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
      'programming',          // Ngôn ngữ lập trình
      'frontend',             // Frontend
      'backend',              // Backend
      'database',             // Cơ sở dữ liệu
      'devops',               // DevOps & Tools
      'mobile',               // Mobile
      'ai_ml',                // AI/ML
      'software_engineering', // Kỹ thuật phần mềm
      'soft_skills',          // Kỹ năng mềm
      'networking',           // Mạng & Bảo mật
      'game_development',     // Game Development
      'embedded',             // Hệ thống nhúng
      'testing',              // Testing & QA
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
  // Icon (emoji)
  icon: {
    type: String,
    default: '📘',
  },
  // Thời lượng học ước tính (giờ)
  estimatedHours: {
    type: Number,
    default: 20,
  },
  // Tài nguyên liên kết (trỏ sang Resource collection)
  linkedResources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
  }],
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

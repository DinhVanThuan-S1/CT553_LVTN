/**
 * JobTemplate Model
 * Mẫu công việc (do Admin tạo) - dùng cho gợi ý và so khớp
 */
const mongoose = require('mongoose');

const jobTemplateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề công việc là bắt buộc'],
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
    required: true,
    trim: true,
  },
  // Kỹ năng yêu cầu
  requiredSkills: [{
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
  }],
  // Mức lương tham khảo (triệu VNĐ/tháng)
  salaryRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('JobTemplate', jobTemplateSchema);

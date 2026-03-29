/**
 * JobPosting Model
 * Tin tuyển dụng (do NTD tạo, Admin duyệt)
 */
const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema({
  // NTD tạo tin
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  // Thông tin tin tuyển dụng
  title: {
    type: String,
    required: [true, 'Tiêu đề tin là bắt buộc'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Mô tả công việc là bắt buộc'],
  },
  requirements: {
    type: String, // Yêu cầu ứng viên
    default: '',
  },
  benefits: {
    type: String, // Quyền lợi
    default: '',
  },
  // Hướng nghề nghiệp
  careerPath: {
    type: String,
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
  // Loại hình
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'internship', 'freelance', 'remote'],
    default: 'full-time',
  },
  // Mức lương (triệu VNĐ/tháng)
  salaryRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    isNegotiable: { type: Boolean, default: false },
  },
  // Địa điểm làm việc
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyAddress',
  },
  locationText: {
    type: String,
    trim: true,
  },
  // Số lượng tuyển
  vacancies: {
    type: Number,
    default: 1,
  },
  // Kinh nghiệm yêu cầu (năm)
  experienceYears: {
    type: Number,
    default: 0,
  },
  // Hạn nộp hồ sơ
  deadline: {
    type: Date,
  },
  // Trạng thái
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'closed', 'deleted'],
    default: 'draft',
  },
  // Lý do từ chối (nếu bị rejected)
  rejectionReason: {
    type: String,
    default: '',
  },
  // Admin duyệt
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  // Số lượt xem
  viewCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
jobPostingSchema.index({ status: 1, createdAt: -1 });
jobPostingSchema.index({ employer: 1, status: 1 });
jobPostingSchema.index({ careerPath: 1 });
jobPostingSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('JobPosting', jobPostingSchema);

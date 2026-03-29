/**
 * CV Model
 * CV của sinh viên (nhiều CV, có 1 mặc định)
 */
const mongoose = require('mongoose');

// Schema cho kinh nghiệm làm việc
const experienceSchema = new mongoose.Schema({
  company: { type: String, trim: true },
  position: { type: String, trim: true },
  startDate: { type: Date },
  endDate: { type: Date },
  isCurrent: { type: Boolean, default: false },
  description: { type: String, trim: true, default: '' },
}, { _id: true });

// Schema cho dự án
const projectSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  description: { type: String, trim: true, default: '' },
  technologies: [{ type: String, trim: true }],
  url: { type: String, trim: true, default: '' },
  startDate: { type: Date },
  endDate: { type: Date },
}, { _id: true });

// Schema cho chứng chỉ
const certificationSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  issuer: { type: String, trim: true },
  issueDate: { type: Date },
  url: { type: String, trim: true, default: '' },
}, { _id: true });

const cvSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Tên CV (VD: "CV Frontend Developer")
  title: {
    type: String,
    required: [true, 'Tên CV là bắt buộc'],
    trim: true,
  },
  // Tiêu đề nghề nghiệp
  headline: {
    type: String,
    trim: true,
    default: '',
  },
  // Tóm tắt bản thân
  summary: {
    type: String,
    trim: true,
    default: '',
  },
  // Kỹ năng
  skills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
  }],
  // Kinh nghiệm
  experiences: [experienceSchema],
  // Dự án
  projects: [projectSchema],
  // Chứng chỉ
  certifications: [certificationSchema],
  // Học vấn
  education: {
    university: { type: String, default: 'Trường Đại học Cần Thơ' },
    major: { type: String, default: '' },
    gpa: { type: Number, default: 0 },
    graduationYear: { type: Number },
  },
  // File CV upload (PDF/DOCX)
  fileUrl: {
    type: String, // URL Cloudinary
    default: '',
  },
  fileName: {
    type: String,
    default: '',
  },
  // CV mặc định
  isDefault: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

cvSchema.index({ student: 1, isDefault: 1 });

module.exports = mongoose.model('CV', cvSchema);

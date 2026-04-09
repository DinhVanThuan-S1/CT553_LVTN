/**
 * StudentAIProfile Model
 * Pre-computed snapshot dữ liệu sinh viên cho AI features.
 * Cập nhật tự động khi SV thay đổi hồ sơ/kỹ năng/sở thích.
 * Khi gọi AI → lấy 1 document này thay vì query 5 collections.
 */
const mongoose = require('mongoose');

const studentAIProfileSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },

  // ──── Text summaries (dùng trực tiếp trong prompt) ────
  profileSummary: { type: String, default: '' },
  careerSummary: { type: String, default: '' },
  skillsSummary: { type: String, default: '' },
  academicSummary: { type: String, default: '' },

  // ──── Structured data (JSON, Python parse nhanh) ────
  profileData: {
    fullName: { type: String, default: '' },
    gpa: { type: Number, default: 0 },
    completedCredits: { type: Number, default: 0 },
    currentSemester: { type: Number, default: 1 },
    strongCourses: [{ name: String, code: String, grade: Number }],
    weakCourses: [{ name: String, code: String, grade: Number }],
  },

  careerData: {
    careerPaths: [String],
    locations: [String],
    salary: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    companies: [String],
    jobTypes: [String],
  },

  skillsData: [{
    name: { type: String },
    level: { type: Number, default: 1 },
    source: { type: String, default: 'manual' },
  }],

  // ──── Metadata ────
  // Hash nhanh để detect thay đổi (md5 of JSON data)
  dataHash: { type: String, default: '' },
  lastUpdatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

module.exports = mongoose.model('StudentAIProfile', studentAIProfileSchema);

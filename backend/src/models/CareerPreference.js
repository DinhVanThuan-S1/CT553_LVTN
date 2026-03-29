/**
 * CareerPreference Model
 * Sở thích nghề nghiệp của sinh viên
 */
const mongoose = require('mongoose');

const careerPreferenceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  // Hướng nghề nghiệp mong muốn
  careerPaths: [{
    type: String,
    trim: true,
    // VD: "Frontend Developer", "Backend Developer", "Data Engineer"
  }],
  // Khu vực làm việc mong muốn
  preferredLocations: [{
    type: String,
    trim: true,
    // VD: "Hồ Chí Minh", "Hà Nội", "Cần Thơ", "Remote"
  }],
  // Mức lương mong muốn (triệu VNĐ/tháng)
  expectedSalary: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
  },
  // Loại hình công việc mong muốn
  jobTypes: [{
    type: String,
    enum: ['full-time', 'part-time', 'internship', 'freelance', 'remote'],
  }],
  // Công ty quan tâm
  interestedCompanies: [{
    type: String,
    trim: true,
  }],
  // Ghi chú thêm
  notes: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('CareerPreference', careerPreferenceSchema);

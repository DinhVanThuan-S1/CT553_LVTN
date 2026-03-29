/**
 * CurriculumProgram Model
 * Chương trình đào tạo (VD: Kỹ thuật Phần mềm K50)
 */
const mongoose = require('mongoose');

const curriculumProgramSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Mã CTĐT là bắt buộc'],
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Tên CTĐT là bắt buộc'],
    trim: true,
  },
  department: {
    type: String, // Khoa
    trim: true,
  },
  university: {
    type: String, // Trường
    trim: true,
    default: 'Trường Đại học Cần Thơ',
  },
  description: {
    type: String,
    trim: true,
  },
  totalCredits: {
    type: Number,
    default: 0,
  },
  // Danh sách niên khóa - học kỳ
  semesters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('CurriculumProgram', curriculumProgramSchema);

/**
 * Semester Model
 * Học kỳ theo niên khóa (VD: HK1 - 2023-2024)
 */
const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  // Tên học kỳ (VD: "Học kỳ 1", "Học kỳ 2")
  name: {
    type: String,
    required: [true, 'Tên học kỳ là bắt buộc'],
    trim: true,
  },
  // Số thứ tự trong CTĐT (1-13)
  order: {
    type: Number,
    required: true,
  },
  // CTĐT mà học kỳ thuộc về
  curriculumProgram: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CurriculumProgram',
    required: true,
  },
  // Danh sách học phần trong HK này
  courses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    // Nhóm tự chọn (nếu có)
    electiveGroup: {
      type: String,
      default: null,
    },
  }],
  // Tổng tín chỉ bắt buộc
  requiredCredits: {
    type: Number,
    default: 0,
  },
  // Tổng tín chỉ tự chọn
  electiveCredits: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

semesterSchema.index({ curriculumProgram: 1, order: 1 });

module.exports = mongoose.model('Semester', semesterSchema);

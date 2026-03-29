/**
 * Course Model
 * Học phần (82 HP từ CTĐT K50)
 * Bao gồm mã HP, tên HP, số tín chỉ, tiên quyết, song hành, mô tả
 */
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  // Mã học phần (VD: CT101, CT177)
  code: {
    type: String,
    required: [true, 'Mã học phần là bắt buộc'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  // Tên học phần
  name: {
    type: String,
    required: [true, 'Tên học phần là bắt buộc'],
    trim: true,
  },
  // Số tín chỉ
  credits: {
    type: Number,
    required: [true, 'Số tín chỉ là bắt buộc'],
    min: [1, 'Tín chỉ phải >= 1'],
  },
  // Loại học phần
  courseType: {
    type: String,
    enum: ['required', 'elective', 'thesis', 'internship', 'general'],
    default: 'required',
  },
  // Học phần tiên quyết (mã HP)
  prerequisites: [{
    type: String,
    trim: true,
  }],
  // Học phần song hành (mã HP)
  corequisites: [{
    type: String,
    trim: true,
  }],
  // Mô tả học phần (đầy đủ)
  description: {
    type: String,
    trim: true,
    default: '',
  },
  // Kiến thức lý thuyết
  theoryKnowledge: {
    type: String,
    trim: true,
    default: '',
  },
  // Kiến thức thực hành
  practiceKnowledge: {
    type: String,
    trim: true,
    default: '',
  },
  // Kỹ năng liên quan (sẽ mapping sau)
  relatedSkills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
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
courseSchema.index({ code: 'text', name: 'text' });

module.exports = mongoose.model('Course', courseSchema);

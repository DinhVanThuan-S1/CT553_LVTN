/**
 * Course Model
 * Học phần (253 HP từ CTĐT K50)
 * Mỗi HP chuyên ngành lưu riêng theo từng ngành (cùng mã có thể bắt buộc ở ngành này, tự chọn ở ngành khác)
 * Bao gồm mã HP, tên HP, số tín chỉ, chuyên ngành, tiên quyết, song hành, mô tả
 */
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  // Mã học phần (VD: CT101, CT177)
  code: {
    type: String,
    required: [true, 'Mã học phần là bắt buộc'],
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
    max: [30, 'Tín chỉ phải <= 30'],
  },
  // Loại học phần (bắt buộc/tự chọn)
  courseType: {
    type: String,
    enum: ['required', 'elective'],
    default: 'required',
  },
  // Phân loại (đại cương/cơ sở ngành/chuyên ngành)
  courseCategory: {
    type: String,
    enum: ['general', 'foundation', 'specialized'],
    default: 'general',
  },
  // Chuyên ngành (mỗi entry thuộc đúng 1 ngành)
  major: {
    type: String,
    enum: [
      'KyThuatPhanMem',
      'AnToanThongTin',
      'CongNgheThongTin',
      'HeThongThongTin',
      'KhoaHocMayTinh',
      'MangMayTinhVaTruyenThongDuLieu',
      'chung', // học phần đại cương / cơ sở ngành chung cho tất cả
    ],
    default: 'chung',
    trim: true,
  },
  // Khối kiến thức
  knowledgeBlock: {
    type: String,
    enum: [
      'general_education',      // Đại cương
      'foundation',             // Cơ sở ngành
      'specialized_required',   // Chuyên ngành bắt buộc
      'specialized_elective',   // Chuyên ngành tự chọn
      'thesis',                 // Luận văn / Tiểu luận
      'internship',             // Thực tập
    ],
    default: 'general_education',
  },
  // Điều kiện đăng ký (VD: "Tích lũy >= 125 TC")
  condition: {
    type: String,
    trim: true,
    default: '',
  },
  // Không tính vào GPA tích lũy
  excludeFromCumulativeGPA: {
    type: Boolean,
    default: false,
  },
  // Không tính vào GPA học kỳ
  excludeFromSemesterGPA: {
    type: Boolean,
    default: false,
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

// Compound index: cùng mã + cùng ngành = unique
courseSchema.index({ code: 1, major: 1 }, { unique: true });
// Text index cho tìm kiếm
courseSchema.index({ code: 'text', name: 'text' });

module.exports = mongoose.model('Course', courseSchema);

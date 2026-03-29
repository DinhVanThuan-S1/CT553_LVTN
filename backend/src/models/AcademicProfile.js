/**
 * AcademicProfile Model
 * Hồ sơ học tập của sinh viên: CTĐT đã chọn, điểm theo từng học phần
 */
const mongoose = require('mongoose');

// Schema cho điểm từng học phần
const courseGradeSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true,
  },
  // Điểm chữ: A, B+, B, C+, C, D+, D, F
  grade: {
    type: String,
    enum: ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', ''],
    default: '',
  },
  // Điểm số tương ứng
  gradePoint: {
    type: Number,
    min: 0,
    max: 4,
    default: 0,
  },
}, { _id: true });

const academicProfileSchema = new mongoose.Schema({
  // Sinh viên
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  // CTĐT đã chọn
  curriculumProgram: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CurriculumProgram',
  },
  // Danh sách điểm từng HP
  courseGrades: [courseGradeSchema],
  // GPA tổng
  gpa: {
    type: Number,
    min: 0,
    max: 4,
    default: 0,
  },
  // Tổng tín chỉ đã hoàn thành
  completedCredits: {
    type: Number,
    default: 0,
  },
  // Học kỳ hiện tại
  currentSemester: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

// Grade to point mapping
const GRADE_POINTS = {
  'A': 4.0,
  'B+': 3.5,
  'B': 3.0,
  'C+': 2.5,
  'C': 2.0,
  'D+': 1.5,
  'D': 1.0,
  'F': 0.0,
  '': 0.0,
};

// Tính GPA trước khi lưu
academicProfileSchema.pre('save', function () {
  if (this.courseGrades && this.courseGrades.length > 0) {
    // Set grade points cho mỗi course grade
    this.courseGrades.forEach(cg => {
      cg.gradePoint = GRADE_POINTS[cg.grade] || 0;
    });

    // Tính GPA có trọng số (tín chỉ)
    const validGrades = this.courseGrades.filter(cg => cg.grade !== '');
    if (validGrades.length > 0) {
      const totalPoints = validGrades.reduce((sum, cg) => sum + cg.gradePoint, 0);
      this.gpa = Math.round((totalPoints / validGrades.length) * 100) / 100;
    }
  }
});

academicProfileSchema.statics.GRADE_POINTS = GRADE_POINTS;

module.exports = mongoose.model('AcademicProfile', academicProfileSchema);

/**
 * AcademicProfile Model
 * Hồ sơ học tập: CTĐT đã chọn, điểm theo từng học phần
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
  // Bắt buộc hay tự chọn (copy từ Semester.courses.isRequired)
  isRequired: {
    type: Boolean,
    default: true,
  },
  // Điểm số (thang 10, VD: 8.5)
  numericGrade: {
    type: Number,
    min: 0,
    max: 10,
    default: null,
  },
  // Điểm chữ: A, B+, B, C+, C, D+, D, F
  grade: {
    type: String,
    enum: ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', ''],
    default: '',
  },
  // Điểm hệ 4 tương ứng
  gradePoint: {
    type: Number,
    min: 0,
    max: 4,
    default: 0,
  },
  // Nhóm tự chọn (VD: LANG_2 = ngoại ngữ HK2, SPEC_5 = chuyên ngành HK5)
  electiveGroup: {
    type: String,
    default: null,
  },
}, { _id: true });

const academicProfileSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  curriculumProgram: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CurriculumProgram',
  },
  courseGrades: [courseGradeSchema],
  // GPA tích lũy
  gpa: {
    type: Number,
    min: 0, max: 4,
    default: 0,
  },
  // Tổng tín chỉ đã hoàn thành
  completedCredits: {
    type: Number,
    default: 0,
  },
  currentSemester: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

// Grade to point mapping
const GRADE_POINTS = {
  'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5,
  'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0, '': 0,
};

// Chuyển điểm số → điểm chữ
function numericToLetter(num) {
  if (num == null || num === '') return '';
  const n = parseFloat(num);
  if (isNaN(n)) return '';
  if (n >= 9) return 'A';
  if (n >= 8) return 'B+';
  if (n >= 7) return 'B';
  if (n >= 6.5) return 'C+';
  if (n >= 5.5) return 'C';
  if (n >= 5) return 'D+';
  if (n >= 4) return 'D';
  return 'F';
}

// Tính GPA trước khi lưu
academicProfileSchema.pre('save', async function () {
  if (!this.courseGrades || this.courseGrades.length === 0) return;

  // Set grade points cho mỗi course grade
  this.courseGrades.forEach(cg => {
    // Auto-convert numeric → letter nếu có điểm số
    if (cg.numericGrade != null && cg.numericGrade !== '') {
      cg.grade = numericToLetter(cg.numericGrade);
    }
    cg.gradePoint = GRADE_POINTS[cg.grade] ?? 0;
  });

  // populate course để lấy credits + excludeFromCumulativeGPA
  await this.populate('courseGrades.course', 'credits excludeFromCumulativeGPA excludeFromSemesterGPA courseType');

  // Tính GPA tích lũy (trọng số tín chỉ, loại trừ HP đánh dấu)
  const validForCumulativeGPA = this.courseGrades.filter(cg =>
    cg.grade && cg.grade !== '' && !cg.course?.excludeFromCumulativeGPA
  );
  if (validForCumulativeGPA.length > 0) {
    let totalWeightedPoints = 0;
    let totalCredits = 0;
    for (const cg of validForCumulativeGPA) {
      const credits = cg.course?.credits || 0;
      totalWeightedPoints += cg.gradePoint * credits;
      totalCredits += credits;
    }
    this.gpa = totalCredits > 0 ? Math.round((totalWeightedPoints / totalCredits) * 100) / 100 : 0;
  } else {
    this.gpa = 0;
  }

  // Tính completedCredits
  const completed = this.courseGrades.filter(cg => cg.grade && cg.grade !== '' && cg.grade !== 'F');
  this.completedCredits = completed.reduce((sum, cg) => sum + (cg.course?.credits || 0), 0);

  // Auto-compute currentSemester từ max semester order có điểm
  await this.populate('courseGrades.semester', 'order');
  let maxOrder = 0;
  for (const cg of this.courseGrades) {
    const order = cg.semester?.order || 0;
    if (order > maxOrder) maxOrder = order;
  }
  if (maxOrder > 0) {
    this.currentSemester = maxOrder;
  }
});

academicProfileSchema.statics.GRADE_POINTS = GRADE_POINTS;
academicProfileSchema.statics.numericToLetter = numericToLetter;

module.exports = mongoose.model('AcademicProfile', academicProfileSchema);

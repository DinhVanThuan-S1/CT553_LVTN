/**
 * AcademicProfile Service
 * Hồ sơ học tập: chọn CTĐT, nhập điểm, GPA theo HK
 */
const AcademicProfile = require('../models/AcademicProfile');
const CurriculumProgram = require('../models/CurriculumProgram');
const Semester = require('../models/Semester');

const POPULATE_FIELDS = [
  { path: 'curriculumProgram', select: 'code name totalCredits' },
  { path: 'courseGrades.course', select: 'code name credits courseType courseCategory excludeFromCumulativeGPA excludeFromSemesterGPA' },
  { path: 'courseGrades.semester', select: 'name order' },
];

class AcademicProfileService {
  /**
   * Lấy hồ sơ học tập (tự tạo nếu chưa có)
   */
  async getProfile(studentId) {
    let profile = await AcademicProfile.findOne({ student: studentId })
      .populate(POPULATE_FIELDS);

    if (!profile) {
      profile = await AcademicProfile.create({ student: studentId });
    }

    return profile;
  }

  /**
   * Chọn CTĐT có sẵn
   */
  async selectProgram(studentId, programId) {
    const program = await CurriculumProgram.findById(programId);
    if (!program) throw { status: 404, message: 'Không tìm thấy CTĐT' };

    // Lấy semesters + courses
    const semesters = await Semester.find({ curriculumProgram: programId })
      .populate('courses.course', 'code name credits courseType courseCategory')
      .sort('order');

    // Tạo courseGrades từ tất cả HP trong CTĐT
    const courseGrades = [];
    for (const sem of semesters) {
      for (const item of sem.courses || []) {
        if (item.course) {
          courseGrades.push({
            course: item.course._id,
            semester: sem._id,
            isRequired: item.isRequired !== false,
            grade: '',
            numericGrade: null,
            gradePoint: 0,
          });
        }
      }
    }

    const profile = await AcademicProfile.findOneAndUpdate(
      { student: studentId },
      { curriculumProgram: programId, courseGrades },
      { new: true, upsert: true }
    ).populate(POPULATE_FIELDS);

    return profile;
  }

  /**
   * Cập nhật điểm các HP
   * grades: [{ courseGradeId, numericGrade?, grade? }]
   */
  async updateGrades(studentId, grades) {
    const profile = await AcademicProfile.findOne({ student: studentId });
    if (!profile) throw { status: 404, message: 'Chưa có hồ sơ học tập' };

    for (const item of grades) {
      const cg = profile.courseGrades.id(item.courseGradeId);
      if (!cg) continue;

      if (item.numericGrade !== undefined) {
        // Nhập điểm số → auto convert
        if (item.numericGrade === null || item.numericGrade === '') {
          cg.numericGrade = null;
          cg.grade = '';
          cg.gradePoint = 0;
        } else {
          cg.numericGrade = parseFloat(item.numericGrade);
          // grade + gradePoint sẽ được tính trong pre-save hook
        }
      } else if (item.grade !== undefined) {
        // Nhập trực tiếp điểm chữ
        cg.grade = item.grade;
        cg.numericGrade = null;
      }
    }

    await profile.save(); // trigger pre-save hook → tính GPA

    return profile.populate(POPULATE_FIELDS);
  }

  /**
   * Cập nhật currentSemester
   */
  async updateSemester(studentId, currentSemester) {
    const profile = await AcademicProfile.findOneAndUpdate(
      { student: studentId },
      { currentSemester },
      { new: true, upsert: true }
    );
    return profile;
  }
}

module.exports = new AcademicProfileService();

/**
 * AcademicProfile Service
 * Hồ sơ học tập: chọn CTĐT, nhập điểm, tự tạo KHHT
 */
const AcademicProfile = require('../models/AcademicProfile');
const CurriculumProgram = require('../models/CurriculumProgram');
const Semester = require('../models/Semester');

class AcademicProfileService {
  /**
   * Lấy hồ sơ học tập (tự tạo nếu chưa có)
   */
  async getProfile(studentId) {
    let profile = await AcademicProfile.findOne({ student: studentId })
      .populate('curriculumProgram', 'code name totalCredits')
      .populate('courseGrades.course', 'code name credits courseType')
      .populate('courseGrades.semester', 'name order');

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
      .populate('courses.course', 'code name credits courseType')
      .sort('order');

    // Tạo courseGrades từ tất cả HP trong CTĐT
    const courseGrades = [];
    for (const sem of semesters) {
      for (const item of sem.courses || []) {
        if (item.course) {
          courseGrades.push({
            course: item.course._id,
            semester: sem._id,
            grade: '',
            gradePoint: 0,
          });
        }
      }
    }

    const profile = await AcademicProfile.findOneAndUpdate(
      { student: studentId },
      { curriculumProgram: programId, courseGrades },
      { new: true, upsert: true }
    ).populate('curriculumProgram', 'code name totalCredits')
      .populate('courseGrades.course', 'code name credits courseType')
      .populate('courseGrades.semester', 'name order');

    return profile;
  }

  /**
   * Cập nhật điểm các HP
   * grades: [{ courseGradeId, grade }]
   */
  async updateGrades(studentId, grades) {
    const profile = await AcademicProfile.findOne({ student: studentId });
    if (!profile) throw { status: 404, message: 'Chưa có hồ sơ học tập' };

    for (const { courseGradeId, grade } of grades) {
      const cg = profile.courseGrades.id(courseGradeId);
      if (cg) {
        cg.grade = grade;
      }
    }

    // Tính completedCredits
    await profile.populate('courseGrades.course', 'credits');
    const completed = profile.courseGrades.filter((cg) => cg.grade && cg.grade !== 'F');
    profile.completedCredits = completed.reduce((sum, cg) => sum + (cg.course?.credits || 0), 0);

    await profile.save();

    return profile.populate([
      { path: 'curriculumProgram', select: 'code name totalCredits' },
      { path: 'courseGrades.course', select: 'code name credits courseType' },
      { path: 'courseGrades.semester', select: 'name order' },
    ]);
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

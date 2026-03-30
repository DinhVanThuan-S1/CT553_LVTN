/**
 * AcademicProfile Service
 * Hồ sơ học tập: chọn CTĐT, nhập điểm, kéo thả HP, GPA theo HK
 */
const AcademicProfile = require('../models/AcademicProfile');
const CurriculumProgram = require('../models/CurriculumProgram');
const Semester = require('../models/Semester');
const Course = require('../models/Course');

const POPULATE_FIELDS = [
  { path: 'curriculumProgram', select: 'code name totalCredits' },
  { path: 'courseGrades.course', select: 'code name credits courseType courseCategory excludeFromCumulativeGPA excludeFromSemesterGPA prerequisites corequisites condition' },
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
          // Lấy isRequired + electiveGroup từ Semester (authoritative)
          courseGrades.push({
            course: item.course._id,
            semester: sem._id,
            isRequired: item.isRequired !== false,
            electiveGroup: item.electiveGroup || null,
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
        if (item.numericGrade === null || item.numericGrade === '') {
          cg.numericGrade = null;
          cg.grade = '';
          cg.gradePoint = 0;
        } else {
          cg.numericGrade = parseFloat(item.numericGrade);
        }
      } else if (item.grade !== undefined) {
        cg.grade = item.grade;
        cg.numericGrade = null;
      }
    }

    await profile.save();
    return profile.populate(POPULATE_FIELDS);
  }

  /**
   * Di chuyển HP sang học kỳ khác
   * Validate tiên quyết/song hành trước khi cho phép
   */
  async moveCourse(studentId, courseGradeId, targetSemesterId) {
    const profile = await AcademicProfile.findOne({ student: studentId })
      .populate('courseGrades.course', 'code name credits courseType prerequisites corequisites condition')
      .populate('courseGrades.semester', 'name order');

    if (!profile) throw { status: 404, message: 'Chưa có hồ sơ học tập' };

    const targetSemester = await Semester.findById(targetSemesterId);
    if (!targetSemester) throw { status: 404, message: 'Không tìm thấy học kỳ' };

    const movingCG = profile.courseGrades.id(courseGradeId);
    if (!movingCG) throw { status: 404, message: 'Không tìm thấy điểm HP' };

    const targetOrder = targetSemester.order;
    const movingCourseCode = movingCG.course?.code;

    // === Validate tiên quyết ===
    // HP di chuyển phải có tất cả tiên quyết ở HK trước targetOrder
    const prereqs = movingCG.course?.prerequisites || [];
    for (const prereqCode of prereqs) {
      const prereqCG = profile.courseGrades.find(cg => cg.course?.code === prereqCode);
      if (prereqCG) {
        const prereqOrder = prereqCG.semester?.order || 0;
        if (prereqOrder >= targetOrder) {
          throw {
            status: 400,
            message: `Không thể di chuyển: HP tiên quyết "${prereqCode}" phải ở học kỳ trước`,
          };
        }
      }
    }

    // === Validate song hành ===
    const coreqs = movingCG.course?.corequisites || [];
    for (const coreqCode of coreqs) {
      const coreqCG = profile.courseGrades.find(cg => cg.course?.code === coreqCode);
      if (coreqCG) {
        const coreqOrder = coreqCG.semester?.order || 0;
        if (coreqOrder > targetOrder) {
          throw {
            status: 400,
            message: `Không thể di chuyển: HP song hành "${coreqCode}" phải ở cùng hoặc trước học kỳ đích`,
          };
        }
      }
    }

    // === Validate ngược: HP khác phụ thuộc vào HP này ===
    for (const cg of profile.courseGrades) {
      if (cg._id.toString() === courseGradeId) continue;
      const depPrereqs = cg.course?.prerequisites || [];
      if (depPrereqs.includes(movingCourseCode)) {
        const depOrder = cg.semester?.order || 0;
        if (targetOrder >= depOrder) {
          throw {
            status: 400,
            message: `Không thể di chuyển: "${cg.course?.code}" phụ thuộc tiên quyết vào HP này`,
          };
        }
      }
    }

    // Di chuyển
    movingCG.semester = targetSemesterId;
    await profile.save();
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

  /**
   * Xóa HP khỏi hồ sơ (sinh viên bỏ HP không học)
   */
  async removeCourse(studentId, courseGradeId) {
    const profile = await AcademicProfile.findOne({ student: studentId });
    if (!profile) throw { status: 404, message: 'Chưa có hồ sơ học tập' };

    const cg = profile.courseGrades.id(courseGradeId);
    if (!cg) throw { status: 404, message: 'Không tìm thấy học phần' };

    profile.courseGrades.pull(courseGradeId);
    await profile.save(); // trigger GPA recalc
    return profile.populate(POPULATE_FIELDS);
  }
}

module.exports = new AcademicProfileService();

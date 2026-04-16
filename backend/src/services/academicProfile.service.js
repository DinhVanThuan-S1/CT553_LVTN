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

    const result = profile.toObject ? profile.toObject() : { ...profile };

    // Đính kèm danh sách HK từ CTĐT (để frontend hiển thị HK trống)
    if (result.curriculumProgram) {
      const programId = result.curriculumProgram._id || result.curriculumProgram;
      const semesters = await Semester.find({ curriculumProgram: programId })
        .select('_id name order')
        .sort('order');
      result.programSemesters = semesters;
    }

    return result;
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
   * Tạo CTĐT tùy chỉnh cho sinh viên
   */
  async createCustomProgram(studentId, name) {
    if (!name || !name.trim()) throw { status: 400, message: 'Tên CTĐT là bắt buộc' };

    const code = 'CUSTOM_' + Date.now().toString(36).toUpperCase();
    const program = await CurriculumProgram.create({
      code,
      name: name.trim(),
      department: 'Tùy chỉnh',
      description: 'Chương trình đào tạo tùy chỉnh bởi sinh viên',
      totalCredits: 0,
    });

    // Chọn CTĐT vừa tạo cho sinh viên (không có HP mẫu → courseGrades rỗng)
    const profile = await AcademicProfile.findOneAndUpdate(
      { student: studentId },
      { curriculumProgram: program._id, courseGrades: [] },
      { new: true, upsert: true }
    ).populate(POPULATE_FIELDS);

    return profile;
  }

  /**
   * Reset CTĐT — xóa program + tất cả courseGrades → quay về màn chọn
   */
  async resetProgram(studentId) {
    const profile = await AcademicProfile.findOneAndUpdate(
      { student: studentId },
      {
        $unset: { curriculumProgram: 1 },
        $set: { courseGrades: [], gpa: 0, completedCredits: 0 },
      },
      { new: true }
    ).populate(POPULATE_FIELDS);

    if (!profile) throw { status: 404, message: 'Chưa có hồ sơ học tập' };
    return profile;
  }

  /**
   * Thêm học kỳ vào CTĐT của sinh viên
   * body: { name: "Học kỳ 1", order: 1 }
   */
  async addSemester(studentId, { name, order }) {
    const profile = await AcademicProfile.findOne({ student: studentId });
    if (!profile || !profile.curriculumProgram) {
      throw { status: 400, message: 'Chưa chọn CTĐT' };
    }

    if (!name) throw { status: 400, message: 'Tên học kỳ là bắt buộc' };

    // Tìm order tiếp theo nếu không truyền
    if (!order) {
      const maxSem = await Semester.findOne({ curriculumProgram: profile.curriculumProgram })
        .sort('-order').select('order');
      order = (maxSem?.order || 0) + 1;
    }

    const semester = await Semester.create({
      name: name.trim(),
      order,
      courses: [],
      requiredCredits: 0,
      electiveCredits: 0,
      curriculumProgram: profile.curriculumProgram,
    });

    // Cập nhật CTĐT
    await CurriculumProgram.findByIdAndUpdate(profile.curriculumProgram, {
      $push: { semesters: semester._id },
    });

    // Reload profile
    return this.getProfile(studentId);
  }

  /**
   * Xóa học kỳ — xóa tất cả courseGrades thuộc HK đó + xóa semester
   */
  async removeSemester(studentId, semesterId) {
    if (!semesterId) throw { status: 400, message: 'Thiếu semesterId' };

    const profile = await AcademicProfile.findOne({ student: studentId });
    if (!profile || !profile.curriculumProgram) {
      throw { status: 400, message: 'Chưa chọn CTĐT' };
    }

    const semester = await Semester.findById(semesterId);
    if (!semester) throw { status: 404, message: 'Không tìm thấy học kỳ' };

    // Xóa tất cả courseGrades thuộc HK này
    profile.courseGrades = profile.courseGrades.filter(
      cg => cg.semester?.toString() !== semesterId
    );
    await profile.save();

    // Xóa semester khỏi CTĐT
    await CurriculumProgram.findByIdAndUpdate(profile.curriculumProgram, {
      $pull: { semesters: semester._id },
    });

    // Xóa semester document
    await Semester.findByIdAndDelete(semesterId);

    // Reload profile
    return this.getProfile(studentId);
  }

  /**
   * Thêm HP vào profile theo semester
   * body: { courseId, semesterId, isRequired? }
   */
  async addCourse(studentId, { courseId, semesterId, isRequired }) {
    if (!courseId || !semesterId) throw { status: 400, message: 'Thiếu courseId hoặc semesterId' };

    const profile = await AcademicProfile.findOne({ student: studentId });
    if (!profile) throw { status: 404, message: 'Chưa có hồ sơ học tập' };

    // Kiểm tra course tồn tại
    const course = await Course.findById(courseId);
    if (!course) throw { status: 404, message: 'Không tìm thấy học phần' };

    // Kiểm tra semester tồn tại
    const semester = await Semester.findById(semesterId);
    if (!semester) throw { status: 404, message: 'Không tìm thấy học kỳ' };

    // Xác định isRequired từ courseType nếu không được truyền rõ ràng
    const resolvedIsRequired = isRequired !== undefined
      ? isRequired !== false
      : course.courseType === 'required';

    // Kiểm tra trùng lặp
    const exists = profile.courseGrades.some(
      cg => cg.course?.toString() === courseId && cg.semester?.toString() === semesterId
    );
    if (exists) throw { status: 400, message: 'Học phần đã có trong học kỳ này' };

    // Thêm vào courseGrades
    profile.courseGrades.push({
      course: courseId,
      semester: semesterId,
      isRequired: resolvedIsRequired,
      grade: '',
      numericGrade: null,
      gradePoint: 0,
    });
    await profile.save();

    // Cũng thêm vào Semester.courses
    const semCourseExists = semester.courses.some(
      c => c.course?.toString() === courseId
    );
    if (!semCourseExists) {
      semester.courses.push({ course: courseId, isRequired: resolvedIsRequired });
      const credits = course.credits || 0;
      if (resolvedIsRequired) semester.requiredCredits += credits;
      else semester.electiveCredits += credits;
      await semester.save();
    }

    // Update totalCredits
    await CurriculumProgram.findByIdAndUpdate(profile.curriculumProgram, {
      $inc: { totalCredits: course.credits || 0 },
    });

    return this.getProfile(studentId);
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

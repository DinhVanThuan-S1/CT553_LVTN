/**
 * CurriculumProgram Service
 * Business logic cho QL CTĐT + Semesters
 *
 * Sync chain:
 *   Admin edits Semester.courses[].{isRequired, electiveGroup}
 *     → AcademicProfile.courseGrades[].{isRequired, electiveGroup} (tất cả SV đã chọn CTĐT)
 */
const CurriculumProgram = require('../models/CurriculumProgram');
const Semester = require('../models/Semester');

class CurriculumService {
  async getPrograms({ page = 1, limit = 20, search }) {
    const filter = { isActive: { $ne: false } };
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await CurriculumProgram.countDocuments(filter);
    const programs = await CurriculumProgram.find(filter)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return {
      data: programs,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    };
  }

  async getProgramById(id) {
    const program = await CurriculumProgram.findById(id);
    if (!program) throw { status: 404, message: 'Không tìm thấy CTĐT' };

    const semesters = await Semester.find({ curriculumProgram: program._id })
      .populate('courses.course', 'code name credits courseType')
      .sort('order');

    return { ...program.toObject(), semesterDetails: semesters };
  }

  async createProgram(data) {
    try {
      return await CurriculumProgram.create(data);
    } catch (error) {
      if (error.code === 11000) throw { status: 400, message: 'Mã CTĐT đã tồn tại' };
      throw error;
    }
  }

  async updateProgram(id, data) {
    const program = await CurriculumProgram.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!program) throw { status: 404, message: 'Không tìm thấy CTĐT' };
    return program;
  }

  async deleteProgram(id) {
    const program = await CurriculumProgram.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!program) throw { status: 404, message: 'Không tìm thấy CTĐT' };
    return program;
  }

  // === Semester ===

  async upsertSemester(programId, semesterId, data) {
    // Lazy import để tránh circular dependency
    const AcademicProfile = require('../models/AcademicProfile');
    const Course = require('../models/Course');

    const program = await CurriculumProgram.findById(programId);
    if (!program) throw { status: 404, message: 'Không tìm thấy CTĐT' };

    const { name, order, courses } = data;

    // Auto-recalculate requiredCredits/electiveCredits từ Course thực tế
    let requiredCredits = 0;
    let electiveCredits = 0;
    if (courses && courses.length > 0) {
      const courseIds = courses.map(c => c.course).filter(Boolean);
      const courseDocs = await Course.find({ _id: { $in: courseIds } }).select('_id credits');
      const creditMap = new Map(courseDocs.map(c => [c._id.toString(), c.credits]));

      for (const item of courses) {
        const credits = creditMap.get(item.course?.toString()) || 0;
        if (item.isRequired !== false) requiredCredits += credits;
        else electiveCredits += credits;
      }
    }

    // Lưu state cũ TRƯỚC KHI update (để so sánh và quyết định sync)
    const oldSemester = semesterId ? await Semester.findById(semesterId) : null;

    let semester;
    if (semesterId) {
      semester = await Semester.findByIdAndUpdate(semesterId, {
        name, order, courses, requiredCredits, electiveCredits,
      }, { new: true, runValidators: true });
    } else {
      semester = await Semester.create({
        name, order, courses, requiredCredits, electiveCredits,
        curriculumProgram: programId,
      });
      program.semesters.push(semester._id);
      await program.save();
    }

    // Sync AcademicProfile khi update Semester.courses[].isRequired / electiveGroup
    // Chỉ áp dụng khi UPDATE (semesterId có sẵn) vì CREATE mới thì SV chưa có profile entry
    if (oldSemester && courses && courses.length > 0) {
      for (const item of courses) {
        if (!item.course) continue;

        const newIsRequired = item.isRequired !== false;
        const newElectiveGroup = item.electiveGroup || null;

        // So sánh với giá trị cũ
        const oldItem = oldSemester.courses.find(
          c => c.course?.toString() === item.course?.toString()
        );
        const isRequiredChanged = !oldItem || oldItem.isRequired !== newIsRequired;
        const electiveGroupChanged = !oldItem || (oldItem.electiveGroup || null) !== newElectiveGroup;

        if (isRequiredChanged || electiveGroupChanged) {
          await AcademicProfile.updateMany(
            {
              'courseGrades.course': item.course,
              'courseGrades.semester': semesterId,
            },
            {
              $set: {
                'courseGrades.$[elem].isRequired': newIsRequired,
                'courseGrades.$[elem].electiveGroup': newElectiveGroup,
              },
            },
            {
              arrayFilters: [{
                'elem.course': item.course,
                'elem.semester': semesterId,
              }],
            }
          );
        }
      }
    }

    return semester;
  }

  async deleteSemester(programId, semesterId) {
    await Semester.findByIdAndDelete(semesterId);
    await CurriculumProgram.findByIdAndUpdate(programId, {
      $pull: { semesters: semesterId },
    });
  }
}

module.exports = new CurriculumService();

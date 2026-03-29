/**
 * CurriculumProgram Service
 * Business logic cho QL CTĐT + Semesters
 */
const CurriculumProgram = require('../models/CurriculumProgram');
const Semester = require('../models/Semester');

class CurriculumService {
  async getPrograms({ page = 1, limit = 20, search }) {
    const filter = {};
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
    const program = await CurriculumProgram.findById(programId);
    if (!program) throw { status: 404, message: 'Không tìm thấy CTĐT' };

    const { name, order, courses, requiredCredits, electiveCredits } = data;
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

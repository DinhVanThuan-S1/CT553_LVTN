/**
 * CurriculumProgram Controller
 * CRUD CTĐT + quản lý semesters
 */
const CurriculumProgram = require('../models/CurriculumProgram');
const Semester = require('../models/Semester');

// Danh sách CTĐT
exports.getPrograms = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
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

    res.json({
      success: true,
      data: programs,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Chi tiết CTĐT (kèm semesters + courses)
exports.getProgram = async (req, res) => {
  try {
    const program = await CurriculumProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy CTĐT' });
    }

    // Lấy các học kỳ kèm populate courses
    const semesters = await Semester.find({ curriculumProgram: program._id })
      .populate('courses.course', 'code name credits courseType')
      .sort('order');

    res.json({
      success: true,
      data: { ...program.toObject(), semesterDetails: semesters },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tạo CTĐT
exports.createProgram = async (req, res) => {
  try {
    const program = await CurriculumProgram.create(req.body);
    res.status(201).json({ success: true, data: program, message: 'Tạo CTĐT thành công' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Mã CTĐT đã tồn tại' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật CTĐT
exports.updateProgram = async (req, res) => {
  try {
    const program = await CurriculumProgram.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!program) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy CTĐT' });
    }
    res.json({ success: true, data: program, message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa CTĐT (kèm xóa semesters)
exports.deleteProgram = async (req, res) => {
  try {
    const program = await CurriculumProgram.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!program) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy CTĐT' });
    }
    res.json({ success: true, message: 'Đã xóa CTĐT' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// === Semester Management ===

// Thêm/cập nhật học kỳ cho CTĐT
exports.upsertSemester = async (req, res) => {
  try {
    const { programId } = req.params;
    const { name, order, courses, requiredCredits, electiveCredits } = req.body;

    const program = await CurriculumProgram.findById(programId);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy CTĐT' });
    }

    let semester;
    if (req.params.semesterId) {
      // Update
      semester = await Semester.findByIdAndUpdate(req.params.semesterId, {
        name, order, courses, requiredCredits, electiveCredits,
      }, { new: true, runValidators: true });
    } else {
      // Create
      semester = await Semester.create({
        name, order, courses, requiredCredits, electiveCredits,
        curriculumProgram: programId,
      });
      // Thêm vào CTĐT
      program.semesters.push(semester._id);
      await program.save();
    }

    res.json({ success: true, data: semester, message: 'Lưu học kỳ thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa học kỳ
exports.deleteSemester = async (req, res) => {
  try {
    const { programId, semesterId } = req.params;
    await Semester.findByIdAndDelete(semesterId);

    // Xóa khỏi CTĐT
    await CurriculumProgram.findByIdAndUpdate(programId, {
      $pull: { semesters: semesterId },
    });

    res.json({ success: true, message: 'Đã xóa học kỳ' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

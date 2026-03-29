/**
 * CurriculumProgram Controller
 * CRUD CTĐT + Semesters - delegate sang CurriculumService
 */
const curriculumService = require('../services/curriculum.service');

exports.getPrograms = async (req, res) => {
  try {
    const result = await curriculumService.getPrograms(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getProgram = async (req, res) => {
  try {
    const data = await curriculumService.getProgramById(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.createProgram = async (req, res) => {
  try {
    const data = await curriculumService.createProgram(req.body);
    res.status(201).json({ success: true, data, message: 'Tạo CTĐT thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.updateProgram = async (req, res) => {
  try {
    const data = await curriculumService.updateProgram(req.params.id, req.body);
    res.json({ success: true, data, message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.deleteProgram = async (req, res) => {
  try {
    await curriculumService.deleteProgram(req.params.id);
    res.json({ success: true, message: 'Đã xóa CTĐT' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// === Semester ===

exports.upsertSemester = async (req, res) => {
  try {
    const data = await curriculumService.upsertSemester(
      req.params.programId, req.params.semesterId, req.body
    );
    res.json({ success: true, data, message: 'Lưu học kỳ thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.deleteSemester = async (req, res) => {
  try {
    await curriculumService.deleteSemester(req.params.programId, req.params.semesterId);
    res.json({ success: true, message: 'Đã xóa học kỳ' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

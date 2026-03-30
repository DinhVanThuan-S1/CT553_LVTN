/**
 * AcademicProfile Controller
 * Hồ sơ học tập của sinh viên
 */
const profileService = require('../services/academicProfile.service');

exports.getProfile = async (req, res) => {
  try {
    const data = await profileService.getProfile(req.user._id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.selectProgram = async (req, res) => {
  try {
    const data = await profileService.selectProgram(req.user._id, req.body.programId);
    res.json({ success: true, data, message: 'Đã chọn CTĐT' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.updateGrades = async (req, res) => {
  try {
    const data = await profileService.updateGrades(req.user._id, req.body.grades);
    res.json({ success: true, data, message: 'Đã cập nhật điểm' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.updateSemester = async (req, res) => {
  try {
    const data = await profileService.updateSemester(req.user._id, req.body.currentSemester);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.moveCourse = async (req, res) => {
  try {
    const data = await profileService.moveCourse(req.user._id, req.body.courseGradeId, req.body.targetSemesterId);
    res.json({ success: true, data, message: 'Đã di chuyển học phần' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.removeCourse = async (req, res) => {
  try {
    const data = await profileService.removeCourse(req.user._id, req.params.courseGradeId);
    res.json({ success: true, data, message: 'Đã xóa học phần' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

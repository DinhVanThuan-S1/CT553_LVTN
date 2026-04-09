/**
 * AcademicProfile Controller
 * Hồ sơ học tập của sinh viên
 */
const profileService = require('../services/academicProfile.service');
const studentSkillService = require('../services/studentSkill.service');
const aiProfileService = require('../services/studentAIProfile.service');

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

exports.createCustomProgram = async (req, res) => {
  try {
    const data = await profileService.createCustomProgram(req.user._id, req.body.name);
    res.json({ success: true, data, message: 'Đã tạo và chọn CTĐT riêng' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.resetProgram = async (req, res) => {
  try {
    const data = await profileService.resetProgram(req.user._id);
    res.json({ success: true, data, message: 'Đã reset CTĐT' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.addSemester = async (req, res) => {
  try {
    const data = await profileService.addSemester(req.user._id, req.body);
    res.json({ success: true, data, message: 'Đã thêm học kỳ' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.addCourse = async (req, res) => {
  try {
    const data = await profileService.addCourse(req.user._id, req.body);
    res.json({ success: true, data, message: 'Đã thêm học phần' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.updateGrades = async (req, res) => {
  try {
    const data = await profileService.updateGrades(req.user._id, req.body.grades);
    // Auto sync skills từ HP điểm cao
    studentSkillService.syncAcademicSkills(req.user._id).catch(err =>
      console.error('Auto-sync academic skills error:', err)
    );
    // Refresh AI profile (async, không block)
    aiProfileService.refreshAcademic(req.user._id, req.user.fullName).catch(err =>
      console.error('AI profile refresh error:', err)
    );
    res.json({ success: true, data, message: 'Đã cập nhật điểm' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.updateSemester = async (req, res) => {
  try {
    const data = await profileService.updateSemester(req.user._id, req.body.currentSemester);
    aiProfileService.refreshAcademic(req.user._id, req.user.fullName).catch(() => {});
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
    aiProfileService.refreshAcademic(req.user._id, req.user.fullName).catch(() => {});
    res.json({ success: true, data, message: 'Đã xóa học phần' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.removeSemester = async (req, res) => {
  try {
    const data = await profileService.removeSemester(req.user._id, req.params.semesterId);
    aiProfileService.refreshAcademic(req.user._id, req.user.fullName).catch(() => {});
    res.json({ success: true, data, message: 'Đã xóa học kỳ' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

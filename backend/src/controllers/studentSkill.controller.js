/**
 * StudentSkill Controller
 * API quản lý kỹ năng sinh viên (3 nguồn)
 */
const studentSkillService = require('../services/studentSkill.service');

/**
 * GET /api/student/skills — Lấy tất cả skills của mình
 * Auto-sync roadmap + academic trước khi trả về
 */
exports.getMySkills = async (req, res) => {
  try {
    // Auto-sync để đảm bảo dữ liệu luôn cập nhật
    await Promise.all([
      studentSkillService.syncRoadmapSkills(req.user._id),
      studentSkillService.syncAcademicSkills(req.user._id),
    ]);
    const skills = await studentSkillService.getStudentSkills(req.user._id);
    res.json({ success: true, data: skills });
  } catch (err) {
    console.error('getMySkills error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * POST /api/student/skills/self — Tự khai báo skills
 * Body: { skillIds: [ObjectId] }
 */
exports.addSelfSkills = async (req, res) => {
  try {
    const { skillIds } = req.body;
    if (!skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Chọn ít nhất 1 kỹ năng' });
    }
    const skills = await studentSkillService.addSelfSkills(req.user._id, skillIds);
    res.json({ success: true, data: skills, message: 'Đã thêm kỹ năng' });
  } catch (err) {
    console.error('addSelfSkills error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * DELETE /api/student/skills/self/:skillId — Xóa skill tự khai báo
 */
exports.removeSelfSkill = async (req, res) => {
  try {
    const skills = await studentSkillService.removeSelfSkill(req.user._id, req.params.skillId);
    res.json({ success: true, data: skills, message: 'Đã xóa kỹ năng' });
  } catch (err) {
    console.error('removeSelfSkill error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * PATCH /api/student/skills/self/:skillId/proficiency — Cập nhật level
 * Body: { level: 1-5 }
 */
exports.updateProficiency = async (req, res) => {
  try {
    const { level } = req.body;
    if (!level || level < 1 || level > 5) {
      return res.status(400).json({ success: false, message: 'Level phải từ 1-5' });
    }
    const skills = await studentSkillService.updateProficiency(req.user._id, req.params.skillId, level);
    res.json({ success: true, data: skills });
  } catch (err) {
    console.error('updateProficiency error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * POST /api/student/skills/sync-academic — Sync kỹ năng từ hồ sơ học tập
 */
exports.syncAcademic = async (req, res) => {
  try {
    await studentSkillService.syncAcademicSkills(req.user._id);
    const skills = await studentSkillService.getStudentSkills(req.user._id);
    res.json({ success: true, data: skills, message: 'Đã đồng bộ kỹ năng từ hồ sơ học tập' });
  } catch (err) {
    console.error('syncAcademic error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * GET /api/student/skills/for-cv — Lấy skills phân loại cho CV
 * Auto-sync trước khi trả về
 */
exports.getSkillsForCV = async (req, res) => {
  try {
    await Promise.all([
      studentSkillService.syncRoadmapSkills(req.user._id),
      studentSkillService.syncAcademicSkills(req.user._id),
    ]);
    const data = await studentSkillService.getSkillsForCV(req.user._id);
    res.json({ success: true, data });
  } catch (err) {
    console.error('getSkillsForCV error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Skill Controller
 * CRUD Kỹ năng - delegate sang SkillService
 */
const skillService = require('../services/skill.service');

exports.getSkills = async (req, res) => {
  try {
    const result = await skillService.getSkills(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getAllSkills = async (req, res) => {
  try {
    const data = await skillService.getAllSkills();
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getSkill = async (req, res) => {
  try {
    const data = await skillService.getSkillById(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.createSkill = async (req, res) => {
  try {
    const data = await skillService.createSkill(req.body);
    res.status(201).json({ success: true, data, message: 'Tạo kỹ năng thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.updateSkill = async (req, res) => {
  try {
    const data = await skillService.updateSkill(req.params.id, req.body);
    res.json({ success: true, data, message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.deleteSkill = async (req, res) => {
  try {
    await skillService.deleteSkill(req.params.id);
    res.json({ success: true, message: 'Đã xóa kỹ năng' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

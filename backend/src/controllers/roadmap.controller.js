/**
 * Roadmap Controller
 * CRUD Lộ trình mẫu - delegate sang RoadmapService
 */
const roadmapService = require('../services/roadmap.service');

exports.getRoadmaps = async (req, res) => {
  try {
    const result = await roadmapService.getRoadmaps(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getRoadmap = async (req, res) => {
  try {
    const data = await roadmapService.getRoadmapById(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.createRoadmap = async (req, res) => {
  try {
    const data = await roadmapService.createRoadmap(req.body, req.user._id);
    res.status(201).json({ success: true, data, message: 'Tạo lộ trình thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.updateRoadmap = async (req, res) => {
  try {
    const data = await roadmapService.updateRoadmap(req.params.id, req.body);
    res.json({ success: true, data, message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.deleteRoadmap = async (req, res) => {
  try {
    await roadmapService.deleteRoadmap(req.params.id);
    res.json({ success: true, message: 'Đã xóa lộ trình' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

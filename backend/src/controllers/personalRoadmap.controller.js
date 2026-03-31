/**
 * PersonalRoadmap Controller
 */
const prService = require('../services/personalRoadmap.service');
const suggestionService = require('../services/roadmapSuggestion.service');

exports.getMyRoadmaps = async (req, res) => {
  try {
    const data = await prService.getMyRoadmaps(req.user._id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getRoadmapDetail = async (req, res) => {
  try {
    const data = await prService.getRoadmapDetail(req.user._id, req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.enrollRoadmap = async (req, res) => {
  try {
    const data = await prService.enrollRoadmap(req.user._id, req.body);
    res.status(201).json({ success: true, data, message: 'Đăng ký lộ trình thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.completeSession = async (req, res) => {
  try {
    const data = await prService.completeSession(req.user._id, req.params.id, req.params.sessionId);
    res.json({ success: true, data, message: 'Đã hoàn thành buổi học' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/student/roadmap-suggestions
 * Gợi ý lộ trình phù hợp dựa trên hồ sơ học tập + sở thích nghề nghiệp
 */
exports.getSuggestions = async (req, res) => {
  try {
    const suggestions = await suggestionService.suggestRoadmaps(req.user._id);
    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('getSuggestions error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi gợi ý lộ trình' });
  }
};

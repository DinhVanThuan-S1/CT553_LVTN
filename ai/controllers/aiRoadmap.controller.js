/**
 * AI Roadmap Controller
 */
const roadmapAI = require('../services/roadmapAI.service');

/**
 * POST /api/ai/suggest-roadmap
 * Gợi ý lộ trình cá nhân hóa bằng AI
 */
exports.suggestRoadmap = async (req, res) => {
  try {
    const result = await roadmapAI.suggestPersonalizedRoadmap(req.user._id);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('AI Roadmap error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Lỗi khi tạo gợi ý lộ trình AI',
    });
  }
};

/**
 * AI Job Suggestion Controller
 */
const jobAI = require('../services/jobAI.service');

/**
 * POST /api/ai/suggest-jobs
 * Gợi ý việc làm bằng AI
 */
exports.suggestJobs = async (req, res) => {
  try {
    const result = await jobAI.suggestJobs(req.user._id);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('AI Job error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Lỗi khi tạo gợi ý việc làm AI',
    });
  }
};

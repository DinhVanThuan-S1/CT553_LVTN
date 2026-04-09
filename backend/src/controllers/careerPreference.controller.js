/**
 * CareerPreference Controller
 */
const prefService = require('../services/careerPreference.service');
const aiProfileService = require('../services/studentAIProfile.service');

exports.getPreference = async (req, res) => {
  try {
    const data = await prefService.getPreference(req.user._id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.updatePreference = async (req, res) => {
  try {
    const data = await prefService.updatePreference(req.user._id, req.body);
    // Refresh AI profile (async)
    aiProfileService.refreshCareer(req.user._id).catch(() => {});
    res.json({ success: true, data, message: 'Đã cập nhật sở thích nghề nghiệp' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};


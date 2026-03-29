/**
 * Favorite Controller
 */
const favService = require('../services/favorite.service');

exports.getFavorites = async (req, res) => {
  try {
    const data = await favService.getFavorites(req.user._id, req.query.type);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const { type, itemId } = req.body;
    const result = await favService.toggleFavorite(req.user._id, type, itemId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.checkFavorite = async (req, res) => {
  try {
    const { type, itemId } = req.query;
    const isFavorited = await favService.isFavorited(req.user._id, type, itemId);
    res.json({ success: true, data: { isFavorited } });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

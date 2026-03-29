/**
 * Favorite Service
 * Yêu thích công việc / lộ trình
 */
const Favorite = require('../models/Favorite');

class FavoriteService {
  async getFavorites(studentId, type) {
    const filter = { student: studentId };
    if (type) filter.type = type;

    return Favorite.find(filter)
      .populate('jobPosting', 'title careerPath jobType salaryRange location locationText deadline status')
      .populate('roadmap', 'title careerPath difficulty estimatedMonths thumbnail')
      .sort('-createdAt');
  }

  async toggleFavorite(studentId, type, itemId) {
    const query = { student: studentId, type };
    if (type === 'job') query.jobPosting = itemId;
    else query.roadmap = itemId;

    const existing = await Favorite.findOne(query);
    if (existing) {
      await Favorite.findByIdAndDelete(existing._id);
      return { added: false, message: 'Đã bỏ yêu thích' };
    }

    const data = { student: studentId, type };
    if (type === 'job') data.jobPosting = itemId;
    else data.roadmap = itemId;

    await Favorite.create(data);
    return { added: true, message: 'Đã thêm vào yêu thích' };
  }

  async isFavorited(studentId, type, itemId) {
    const query = { student: studentId, type };
    if (type === 'job') query.jobPosting = itemId;
    else query.roadmap = itemId;
    return !!(await Favorite.findOne(query));
  }
}

module.exports = new FavoriteService();

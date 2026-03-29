/**
 * RoadmapReview Model
 * Đánh giá lộ trình (sao + nhận xét)
 */
const mongoose = require('mongoose');

const roadmapReviewSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  roadmap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
    required: true,
  },
  // Số sao (1-5)
  rating: {
    type: Number,
    required: [true, 'Điểm đánh giá là bắt buộc'],
    min: 1,
    max: 5,
  },
  // Nhận xét
  comment: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

// Mỗi SV chỉ đánh giá 1 lần cho 1 lộ trình
roadmapReviewSchema.index({ student: 1, roadmap: 1 }, { unique: true });

// Cập nhật averageRating trên Roadmap sau khi lưu
roadmapReviewSchema.post('save', async function () {
  const Roadmap = mongoose.model('Roadmap');
  const stats = await this.constructor.aggregate([
    { $match: { roadmap: this.roadmap } },
    {
      $group: {
        _id: '$roadmap',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Roadmap.findByIdAndUpdate(this.roadmap, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].count,
    });
  }
});

module.exports = mongoose.model('RoadmapReview', roadmapReviewSchema);

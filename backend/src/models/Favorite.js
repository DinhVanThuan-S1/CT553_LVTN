/**
 * Favorite Model
 * Yêu thích (công việc hoặc lộ trình)
 */
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Loại yêu thích
  type: {
    type: String,
    enum: ['job', 'roadmap'],
    required: true,
  },
  // Reference tới JobPosting hoặc Roadmap
  jobPosting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
  },
  roadmap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
  },
}, {
  timestamps: true,
});

// Dùng partialFilterExpression để chỉ index khi field tồn tại (tránh lỗi null duplicate)
favoriteSchema.index(
  { student: 1, jobPosting: 1 },
  { unique: true, partialFilterExpression: { jobPosting: { $exists: true } } }
);
favoriteSchema.index(
  { student: 1, roadmap: 1 },
  { unique: true, partialFilterExpression: { roadmap: { $exists: true } } }
);

module.exports = mongoose.model('Favorite', favoriteSchema);

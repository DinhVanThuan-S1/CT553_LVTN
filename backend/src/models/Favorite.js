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

// Mỗi SV chỉ yêu thích 1 lần cho mỗi item
favoriteSchema.index({ student: 1, type: 1, jobPosting: 1 }, { unique: true, sparse: true });
favoriteSchema.index({ student: 1, type: 1, roadmap: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Favorite', favoriteSchema);

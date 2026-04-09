/**
 * AIPersonalizedRoadmap Model
 * Lưu lộ trình cá nhân hóa do AI tạo riêng cho từng sinh viên.
 * Cache kết quả: lần 1 gọi AI (~30s), lần 2+ trả instant.
 * Auto-invalidate khi StudentAIProfile thay đổi.
 */
const mongoose = require('mongoose');

const aiPersonalizedRoadmapSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // ──── Kết quả AI ────
  analysis: {
    strengths: [String],
    weaknesses: [String],
    currentLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    summary: { type: String, default: '' },
  },

  suggestedCareerPaths: [{
    title: { type: String },
    matchScore: { type: Number },
    reason: { type: String },
  }],

  personalizedRoadmap: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    estimatedMonths: { type: Number, default: 6 },
    phases: [{
      name: { type: String },
      duration: { type: String },
      skills: [{
        name: { type: String },
        level: { type: String },
        sessions: { type: Number },
        reason: { type: String },
      }],
    }],
    adjustments: [String],
  },

  advice: { type: String, default: '' },

  // ──── Metadata ────
  modelUsed: { type: String, default: '' },
  generatedAt: { type: Date, default: Date.now },
  // Expire sau 7 ngày (tự động cần regenerate)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  // false khi profile thay đổi → cần regenerate
  isValid: { type: Boolean, default: true },
  // Hash profile lúc generate (so sánh để detect thay đổi)
  profileDataHash: { type: String, default: '' },
}, {
  timestamps: true,
});

// Index để tìm nhanh valid roadmap gần nhất
aiPersonalizedRoadmapSchema.index({ student: 1, isValid: 1, expiresAt: 1 });

module.exports = mongoose.model('AIPersonalizedRoadmap', aiPersonalizedRoadmapSchema);

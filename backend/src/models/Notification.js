/**
 * Notification Model
 * Thông báo hệ thống (real-time qua Socket.IO)
 */
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Người nhận
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Loại thông báo
  type: {
    type: String,
    enum: [
      'application_received',     // NTD nhận đơn ứng tuyển
      'application_reviewed',     // SV: đơn được xem
      'interview_scheduled',      // SV: được hẹn phỏng vấn
      'application_accepted',     // SV: được nhận
      'application_rejected',     // SV: bị từ chối
      'job_approved',             // NTD: tin được duyệt
      'job_rejected',             // NTD: tin bị từ chối
      'new_message',              // Tin nhắn mới
      'roadmap_completed',        // SV: hoàn thành lộ trình
      'skill_test_passed',        // SV: đạt bài test
      'system',                   // Thông báo hệ thống
    ],
    required: true,
  },
  // Tiêu đề
  title: {
    type: String,
    required: true,
  },
  // Nội dung
  content: {
    type: String,
    required: true,
  },
  // Link liên quan (để điều hướng)
  link: {
    type: String,
    default: '',
  },
  // Reference data (để truy vấn thêm)
  refModel: {
    type: String,
    enum: ['Application', 'JobPosting', 'Conversation', 'PersonalRoadmap', 'SkillTest'],
  },
  refId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  // Đã đọc chưa
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

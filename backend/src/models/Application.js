/**
 * Application Model
 * Đơn ứng tuyển của sinh viên
 */
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobPosting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
    required: true,
  },
  cv: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CV',
    required: true,
  },
  // Match % tại thời điểm ứng tuyển
  matchPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  // Trạng thái đơn
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'interview_scheduled', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending',
  },
  // Thông tin phỏng vấn (nếu được hẹn)
  interview: {
    date: { type: Date },
    time: { type: String },
    type: {
      type: String,
      enum: ['online', 'offline'],
    },
    location: { type: String, default: '' }, // Địa chỉ hoặc link online
    notes: { type: String, default: '' },
  },
  // Lý do từ chối (nếu bị rejected)
  rejectionReason: {
    type: String,
    default: '',
  },
  // Ghi chú của NTD
  employerNotes: {
    type: String,
    default: '',
  },
  // Thời gian thay đổi trạng thái
  reviewedAt: { type: Date },
  interviewScheduledAt: { type: Date },
  respondedAt: { type: Date },
}, {
  timestamps: true,
});

// Mỗi SV chỉ ứng tuyển 1 lần cho 1 tin
applicationSchema.index({ student: 1, jobPosting: 1 }, { unique: true });
applicationSchema.index({ jobPosting: 1, status: 1 });

module.exports = mongoose.model('Application', applicationSchema);

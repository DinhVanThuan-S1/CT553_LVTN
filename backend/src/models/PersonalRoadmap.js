/**
 * PersonalRoadmap Model
 * Lộ trình cá nhân hóa của sinh viên
 * Bao gồm thời gian học, TKB, giờ rảnh, lịch học chi tiết
 */
const mongoose = require('mongoose');

// Schema cho khung giờ (TKB trường hoặc giờ rảnh)
const timeSlotSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number, // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
    required: true,
    min: 0,
    max: 6,
  },
  startTime: {
    type: String, // "08:00"
    required: true,
  },
  endTime: {
    type: String, // "10:00"
    required: true,
  },
}, { _id: false });

// Schema cho buổi học
const sessionSchema = new mongoose.Schema({
  // Kỹ năng
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
  },
  // Ngày học
  date: {
    type: Date,
    required: true,
  },
  // Giờ bắt đầu - kết thúc
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  // Trạng thái
  status: {
    type: String,
    enum: ['upcoming', 'in_progress', 'completed', 'missed'],
    default: 'upcoming',
  },
  // Ghi chú
  notes: { type: String, default: '' },
  completedAt: { type: Date },
}, { _id: true });

// Schema điều chỉnh skill (dùng cho lộ trình AI-generated)
const adjustmentSchema = new mongoose.Schema({
  skillName: { type: String, required: true },
  originalHours: { type: Number, required: true },
  adjustedHours: { type: Number, required: true },
  reason: { type: String, default: '' },
}, { _id: false });

const personalRoadmapSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Lộ trình gốc
  roadmap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
    required: true,
  },
  // Nguồn tạo lộ trình
  source: {
    type: String,
    enum: ['manual', 'ai-generated'],
    default: 'manual',
  },
  // Tên lộ trình gốc (lưu để reference khi roadmap mẫu thay đổi)
  baseRoadmapTitle: { type: String, default: '' },
  // Danh sách điều chỉnh giờ học (chỉ có khi source = 'ai-generated')
  adjustments: [adjustmentSchema],
  // Thời gian học đã chọn (tháng) — tự tính từ số slot rảnh
  durationMonths: {
    type: Number,
    min: 1,
    required: true,
  },
  // TKB trường (lịch bận)
  schoolSchedule: [timeSlotSchema],
  // Giờ rảnh đã chọn
  freeTimeSlots: [timeSlotSchema],
  // Ngày bắt đầu
  startDate: {
    type: Date,
    default: Date.now,
  },
  // Ngày kết thúc dự kiến
  expectedEndDate: {
    type: Date,
  },
  // Danh sách buổi học
  sessions: [sessionSchema],
  // Tiến độ tổng (%)
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  // Tổng giờ đã học
  totalHoursLearned: {
    type: Number,
    default: 0,
  },
  // Tổng giờ của lộ trình (giờ kế hoạch, tính từ skills khi enroll)
  totalHoursPlanned: {
    type: Number,
    default: 0,
  },
  // Readiness Score (điểm sẵn sàng đi làm)
  readinessScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  // Trạng thái
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active',
  },
}, {
  timestamps: true,
});

personalRoadmapSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('PersonalRoadmap', personalRoadmapSchema);

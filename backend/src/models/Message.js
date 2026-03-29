/**
 * Message Model
 * Tin nhắn trong cuộc trò chuyện
 */
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Nội dung tin nhắn là bắt buộc'],
    trim: true,
  },
  // Loại tin nhắn
  type: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text',
  },
  // File đính kèm (nếu có)
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  // Đã đọc bởi
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);

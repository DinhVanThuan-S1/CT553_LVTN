/**
 * Chat Controller
 * CRUD conversations + messages, real-time via Socket.IO
 */
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { getIO } = require('../config/socket');

/**
 * GET /api/chat/users/search?q=keyword
 * Tìm user để bắt đầu chat
 * SV ↔ SV, SV ↔ NTD, NTD ↔ NTD (không chat với admin)
 */
exports.searchUsers = async (req, res) => {
  try {
    const { q = '' } = req.query;

    // Cho phép tìm tất cả user active (trừ admin và chính mình)
    const users = await User.find({
      role: { $in: ['student', 'employer'] },
      isActive: true,
      _id: { $ne: req.user._id },
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    })
      .select('fullName email avatar role')
      .limit(15);

    res.json({ success: true, data: users });
  } catch (err) {
    console.error('searchUsers error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * GET /api/chat/conversations
 * Danh sách cuộc trò chuyện của user hiện tại
 */
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'fullName email role avatar')
      .sort('-updatedAt');

    res.json({ success: true, data: conversations });
  } catch (err) {
    console.error('getConversations error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * POST /api/chat/conversations
 * Tạo hoặc lấy conversation với user khác
 * Body: { participantId }
 */
exports.createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user._id;

    if (!participantId) {
      return res.status(400).json({ success: false, message: 'participantId là bắt buộc' });
    }

    if (participantId === userId.toString()) {
      return res.status(400).json({ success: false, message: 'Không thể chat với chính mình' });
    }

    // Check participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // Check existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId], $size: 2 },
    }).populate('participants', 'fullName email role avatar');

    if (conversation) {
      return res.json({ success: true, data: conversation });
    }

    // Create new conversation
    conversation = await Conversation.create({
      participants: [userId, participantId],
    });

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'fullName email role avatar');

    res.status(201).json({ success: true, data: conversation });
  } catch (err) {
    console.error('createConversation error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * GET /api/chat/conversations/:conversationId/messages
 * Lấy tin nhắn của cuộc trò chuyện (phân trang)
 */
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Cuộc trò chuyện không tồn tại' });
    }

    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId })
        .populate('sender', 'fullName avatar role')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ conversation: conversationId }),
    ]);

    // Mark messages as read
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    // Reset unread count for this user
    conversation.unreadCount.set(req.user._id.toString(), 0);
    await conversation.save();

    res.json({
      success: true,
      data: messages.reverse(), // oldest first
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * POST /api/chat/conversations/:conversationId/messages
 * Gửi tin nhắn mới
 * Body: { content, type? }
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, type = 'text' } = req.body;
    const userId = req.user._id;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung tin nhắn là bắt buộc' });
    }

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Cuộc trò chuyện không tồn tại' });
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      content: content.trim(),
      type,
      readBy: [userId],
    });

    // Update conversation lastMessage
    conversation.lastMessage = {
      content: content.trim(),
      sender: userId,
      timestamp: new Date(),
    };

    // Increment unread count for other participants
    conversation.participants.forEach((pid) => {
      if (pid.toString() !== userId.toString()) {
        const current = conversation.unreadCount.get(pid.toString()) || 0;
        conversation.unreadCount.set(pid.toString(), current + 1);
      }
    });
    await conversation.save();

    // Populate sender info for response
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'fullName avatar role');

    // Emit real-time via Socket.IO
    const io = getIO();
    io.to(`conv:${conversationId}`).emit('new_message', populatedMessage);

    // Notify other participants (even if not in conversation room)
    conversation.participants.forEach((pid) => {
      if (pid.toString() !== userId.toString()) {
        io.to(`user:${pid}`).emit('conversation_updated', {
          conversationId,
          lastMessage: conversation.lastMessage,
          unreadCount: conversation.unreadCount.get(pid.toString()) || 0,
        });
      }
    });

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * GET /api/chat/unread-count
 * Tổng số tin nhắn chưa đọc
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const conversations = await Conversation.find({ participants: req.user._id });

    let totalUnread = 0;
    conversations.forEach((conv) => {
      totalUnread += conv.unreadCount.get(userId) || 0;
    });

    res.json({ success: true, data: { count: totalUnread } });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * DELETE /api/chat/conversations/:conversationId
 * Xóa cuộc trò chuyện + toàn bộ tin nhắn
 * Chỉ participant mới được xóa
 */
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Cuộc trò chuyện không tồn tại' });
    }

    // Xóa tất cả tin nhắn trong conversation
    await Message.deleteMany({ conversation: conversationId });
    await conversation.deleteOne();

    res.json({ success: true, message: 'Đã xóa cuộc trò chuyện' });
  } catch (err) {
    console.error('deleteConversation error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

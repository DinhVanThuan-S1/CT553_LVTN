/**
 * Notification Controller
 * CRUD thông báo + đánh dấu đã đọc + real-time via Socket.IO
 */
const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');

/**
 * GET /api/notifications
 * Lấy danh sách thông báo của user hiện tại (phân trang)
 */
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = req.query.filter; // 'unread' | 'read' | undefined (all)

    const query = { recipient: req.user._id };
    if (filter === 'unread') query.isRead = false;
    if (filter === 'read') query.isRead = true;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * GET /api/notifications/unread-count
 * Tổng số thông báo chưa đọc
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });
    res.json({ success: true, data: { count } });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Đánh dấu 1 thông báo đã đọc
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    }

    res.json({ success: true, data: notification });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * PATCH /api/notifications/mark-all-read
 * Đánh dấu tất cả thông báo đã đọc
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, message: 'Đã đánh dấu tất cả đã đọc' });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * DELETE /api/notifications/:id
 * Xóa 1 thông báo
 */
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    }

    res.json({ success: true, message: 'Đã xóa thông báo' });
  } catch (err) {
    console.error('deleteNotification error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Helper: Tạo thông báo và gửi real-time
 * Dùng bởi các controller khác (application, jobPosting, ...)
 */
exports.createAndEmitNotification = async ({ recipient, type, title, content, link = '', refModel, refId }) => {
  try {
    const notification = await Notification.create({
      recipient,
      type,
      title,
      content,
      link,
      refModel,
      refId,
    });

    // Emit real-time via Socket.IO
    try {
      const io = getIO();
      io.to(`user:${recipient}`).emit('new_notification', notification);
    } catch {
      // Socket.IO chưa sẵn sàng — bỏ qua, notification vẫn được lưu DB
    }

    return notification;
  } catch (err) {
    console.error('createAndEmitNotification error:', err);
    return null;
  }
};

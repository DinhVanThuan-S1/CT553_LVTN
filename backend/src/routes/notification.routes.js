/**
 * Notification Routes
 * /api/notifications
 * Yêu cầu xác thực (tất cả role)
 */
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const notifCtrl = require('../controllers/notification.controller');

// Tất cả route cần xác thực
router.use(protect);

// Danh sách thông báo (phân trang, lọc)
router.get('/', notifCtrl.getNotifications);

// Số thông báo chưa đọc
router.get('/unread-count', notifCtrl.getUnreadCount);

// Đánh dấu tất cả đã đọc
router.patch('/mark-all-read', notifCtrl.markAllAsRead);

// Đánh dấu 1 thông báo đã đọc
router.patch('/:id/read', notifCtrl.markAsRead);

// Xóa thông báo
router.delete('/:id', notifCtrl.deleteNotification);

module.exports = router;

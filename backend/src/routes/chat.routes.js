/**
 * Chat Routes
 * /api/chat
 * Yêu cầu xác thực (student hoặc employer)
 */
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const chatCtrl = require('../controllers/chat.controller');

// Tất cả route cần xác thực
router.use(protect);

// Conversations
router.get('/conversations', chatCtrl.getConversations);
router.post('/conversations', chatCtrl.createConversation);

// Messages
router.get('/conversations/:conversationId/messages', chatCtrl.getMessages);
router.post('/conversations/:conversationId/messages', chatCtrl.sendMessage);

// Unread count
router.get('/unread-count', chatCtrl.getUnreadCount);

// Tìm kiếm user để bắt đầu chat (student tìm employer và ngược lại)
router.get('/users/search', chatCtrl.searchUsers);

// Xóa cuộc trò chuyện
router.delete('/conversations/:conversationId', chatCtrl.deleteConversation);

module.exports = router;

/**
 * Admin Routes
 * Tất cả routes yêu cầu role admin
 * Prefix: /api/admin
 */
const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');

// Controllers
const userCtrl = require('../controllers/user.controller');
const jobCtrl = require('../controllers/jobPosting.controller');

// Tất cả admin routes đều yêu cầu auth + admin role
router.use(protect, authorize('admin'));

// === QL Người dùng ===
router.get('/users/stats', userCtrl.getUserStats);
router.get('/users', userCtrl.getUsers);
router.get('/users/:id', userCtrl.getUser);
router.patch('/users/:id/toggle-status', userCtrl.toggleUserStatus);

// === QL Tin tuyển dụng ===
router.get('/job-postings', jobCtrl.getAdminJobs);
router.patch('/job-postings/:id/approve', jobCtrl.approveJob);

module.exports = router;

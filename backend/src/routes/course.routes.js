/**
 * Course Routes
 * CRUD HP (admin) + public read
 * Prefix: /api/courses
 */
const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const courseCtrl = require('../controllers/course.controller');

// Public: Lấy danh sách (cho dropdown, student chọn)
router.get('/all', courseCtrl.getAllCourses);

// Admin CRUD
router.get('/', protect, authorize('admin'), courseCtrl.getCourses);
router.get('/:id', courseCtrl.getCourse);
router.post('/', protect, authorize('admin'), courseCtrl.createCourse);
router.put('/:id', protect, authorize('admin'), courseCtrl.updateCourse);
router.delete('/:id', protect, authorize('admin'), courseCtrl.deleteCourse);

module.exports = router;

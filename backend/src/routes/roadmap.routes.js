/**
 * Roadmap Routes
 * CRUD Lộ trình mẫu (admin) + public read
 * Prefix: /api/roadmaps
 */
const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const roadmapCtrl = require('../controllers/roadmap.controller');

// Public
router.get('/', roadmapCtrl.getRoadmaps);
router.get('/:id', roadmapCtrl.getRoadmap);

// Admin CRUD
router.post('/', protect, authorize('admin'), roadmapCtrl.createRoadmap);
router.put('/:id', protect, authorize('admin'), roadmapCtrl.updateRoadmap);
router.delete('/:id', protect, authorize('admin'), roadmapCtrl.deleteRoadmap);

module.exports = router;

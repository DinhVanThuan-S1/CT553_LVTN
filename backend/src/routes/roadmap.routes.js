/**
 * Roadmap Routes
 * CRUD Lộ trình mẫu (admin) + public read
 * Prefix: /api/roadmaps
 */
const router = require('express').Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const roadmapCtrl = require('../controllers/roadmap.controller');
const learnCtrl = require('../controllers/learning.controller');

// Public
router.get('/', roadmapCtrl.getRoadmaps);
router.get('/:id', roadmapCtrl.getRoadmap);

// Reviews (public read, optional auth for myReview)
router.get('/:roadmapId/reviews', optionalAuth, learnCtrl.getRoadmapReviews);

// Admin CRUD
router.post('/', protect, authorize('admin'), roadmapCtrl.createRoadmap);
router.put('/:id', protect, authorize('admin'), roadmapCtrl.updateRoadmap);
router.delete('/:id', protect, authorize('admin'), roadmapCtrl.deleteRoadmap);

module.exports = router;

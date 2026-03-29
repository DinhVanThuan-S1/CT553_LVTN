/**
 * Student Routes
 * Tất cả routes yêu cầu role student
 * Prefix: /api/student
 */
const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');

const profileCtrl = require('../controllers/academicProfile.controller');
const prefCtrl = require('../controllers/careerPreference.controller');
const prCtrl = require('../controllers/personalRoadmap.controller');
const favCtrl = require('../controllers/favorite.controller');

router.use(protect, authorize('student'));

// === Hồ sơ học tập ===
router.get('/academic-profile', profileCtrl.getProfile);
router.post('/academic-profile/select-program', profileCtrl.selectProgram);
router.put('/academic-profile/grades', profileCtrl.updateGrades);
router.patch('/academic-profile/semester', profileCtrl.updateSemester);

// === Sở thích nghề nghiệp ===
router.get('/career-preferences', prefCtrl.getPreference);
router.put('/career-preferences', prefCtrl.updatePreference);

// === Lộ trình cá nhân ===
router.get('/my-roadmaps', prCtrl.getMyRoadmaps);
router.get('/my-roadmaps/:id', prCtrl.getRoadmapDetail);
router.post('/my-roadmaps/enroll', prCtrl.enrollRoadmap);
router.patch('/my-roadmaps/:id/sessions/:sessionId/complete', prCtrl.completeSession);

// === Yêu thích ===
router.get('/favorites', favCtrl.getFavorites);
router.post('/favorites/toggle', favCtrl.toggleFavorite);
router.get('/favorites/check', favCtrl.checkFavorite);

module.exports = router;

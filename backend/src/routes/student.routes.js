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

const cvCtrl = require('../controllers/cv.controller');
const appCtrl = require('../controllers/application.controller');

router.use(protect, authorize('student'));

// === Hồ sơ học tập ===
router.get('/academic-profile', profileCtrl.getProfile);
router.post('/academic-profile/select-program', profileCtrl.selectProgram);
router.put('/academic-profile/grades', profileCtrl.updateGrades);
router.put('/academic-profile/move-course', profileCtrl.moveCourse);
router.delete('/academic-profile/course/:courseGradeId', profileCtrl.removeCourse);
router.patch('/academic-profile/semester', profileCtrl.updateSemester);

// === Sở thích nghề nghiệp ===
router.get('/career-preferences', prefCtrl.getPreference);
router.put('/career-preferences', prefCtrl.updatePreference);

// === Lộ trình cá nhân ===
router.get('/my-roadmaps', prCtrl.getMyRoadmaps);
router.get('/my-roadmaps/:id', prCtrl.getRoadmapDetail);
router.post('/my-roadmaps/enroll', prCtrl.enrollRoadmap);
router.patch('/my-roadmaps/:id/sessions/:sessionId/complete', prCtrl.completeSession);

// === CV ===
router.get('/cvs', cvCtrl.getMyCVs);
router.get('/cvs/:id', cvCtrl.getCVById);
router.post('/cvs', cvCtrl.createCV);
router.put('/cvs/:id', cvCtrl.updateCV);
router.delete('/cvs/:id', cvCtrl.deleteCV);
router.patch('/cvs/:id/default', cvCtrl.setDefault);

// === Đơn ứng tuyển ===
router.get('/applications', appCtrl.getMyApplications);
router.get('/applications/:id', appCtrl.getApplicationDetail);
router.post('/applications', appCtrl.apply);
router.patch('/applications/:id/withdraw', appCtrl.withdraw);

// === Yêu thích ===
router.get('/favorites', favCtrl.getFavorites);
router.post('/favorites/toggle', favCtrl.toggleFavorite);
router.get('/favorites/check', favCtrl.checkFavorite);

module.exports = router;

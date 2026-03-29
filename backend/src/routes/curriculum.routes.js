/**
 * Curriculum Program Routes
 * CRUD CTĐT + Semesters (admin) + public read
 * Prefix: /api/curriculum-programs
 */
const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const curriculumCtrl = require('../controllers/curriculum.controller');

// Public
router.get('/', curriculumCtrl.getPrograms);
router.get('/:id', curriculumCtrl.getProgram);

// Admin CRUD
router.post('/', protect, authorize('admin'), curriculumCtrl.createProgram);
router.put('/:id', protect, authorize('admin'), curriculumCtrl.updateProgram);
router.delete('/:id', protect, authorize('admin'), curriculumCtrl.deleteProgram);

// Semester management
router.post('/:programId/semesters', protect, authorize('admin'), curriculumCtrl.upsertSemester);
router.put('/:programId/semesters/:semesterId', protect, authorize('admin'), curriculumCtrl.upsertSemester);
router.delete('/:programId/semesters/:semesterId', protect, authorize('admin'), curriculumCtrl.deleteSemester);

module.exports = router;

/**
 * Skill Routes
 * CRUD Kỹ năng (admin) + public read
 * Prefix: /api/skills
 */
const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const skillCtrl = require('../controllers/skill.controller');

// Public
router.get('/all', skillCtrl.getAllSkills);

// Admin CRUD
router.get('/', protect, authorize('admin'), skillCtrl.getSkills);
router.get('/:id', skillCtrl.getSkill);
router.post('/', protect, authorize('admin'), skillCtrl.createSkill);
router.put('/:id', protect, authorize('admin'), skillCtrl.updateSkill);
router.delete('/:id', protect, authorize('admin'), skillCtrl.deleteSkill);

module.exports = router;

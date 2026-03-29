/**
 * Job Routes
 * Public listing + Student specific
 * Prefix: /api/jobs
 */
const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const jobCtrl = require('../controllers/jobPosting.controller');

// Public
router.get('/', jobCtrl.getPublicJobs);
router.get('/:id', jobCtrl.getJobDetail);

module.exports = router;

/**
 * Employer Routes
 * Tất cả routes yêu cầu role employer
 * Prefix: /api/employer
 */
const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');

const companyCtrl = require('../controllers/company.controller');
const jobCtrl = require('../controllers/jobPosting.controller');
const appCtrl = require('../controllers/application.controller');
const cvCtrl = require('../controllers/cv.controller');

router.use(protect, authorize('employer'));

// === Hồ sơ công ty ===
router.get('/company', companyCtrl.getMyCompany);
router.put('/company', companyCtrl.upsertCompany);

// === Tin tuyển dụng ===
router.get('/job-postings', jobCtrl.getEmployerJobs);
router.post('/job-postings', jobCtrl.createJob);
router.put('/job-postings/:id', jobCtrl.updateJob);

// === Ứng viên ===
router.get('/job-postings/:jobId/applicants', appCtrl.getApplicationsByJob);
router.patch('/applications/:id/status', appCtrl.updateApplicationStatus);
router.get('/applicant-cv/:cvId', cvCtrl.getApplicantCV);

module.exports = router;

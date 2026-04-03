/**
 * Resource Routes
 * /api/admin/resources
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/resource.controller');

const adminOnly = [protect, authorize('admin')];

// Specific routes trước param routes
router.get('/all', adminOnly, ctrl.getAllResources);
router.get('/stats', adminOnly, ctrl.getStats);

router.route('/')
  .get(adminOnly, ctrl.getResources)
  .post(adminOnly, ctrl.createResource);

router.route('/:id')
  .get(adminOnly, ctrl.getResourceById)
  .put(adminOnly, ctrl.updateResource)
  .delete(adminOnly, ctrl.deleteResource);

router.post('/:id/view', protect, ctrl.incrementView);

module.exports = router;

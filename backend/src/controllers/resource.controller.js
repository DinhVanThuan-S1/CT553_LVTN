/**
 * Resource Controller
 * Handles HTTP requests cho tài nguyên học tập
 */
const resourceService = require('../services/resource.service');

const handleError = (res, error) => {
  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';
  return res.status(status).json({ success: false, message });
};

// GET /api/admin/resources
exports.getResources = async (req, res) => {
  try {
    const result = await resourceService.getResources(req.query);
    res.json({ success: true, ...result });
  } catch (err) { handleError(res, err); }
};

// GET /api/admin/resources/all (no pagination — for pickers)
exports.getAllResources = async (req, res) => {
  try {
    const data = await resourceService.getAllResources(req.query);
    res.json({ success: true, data });
  } catch (err) { handleError(res, err); }
};

// GET /api/admin/resources/stats
exports.getStats = async (req, res) => {
  try {
    const data = await resourceService.getStats();
    res.json({ success: true, data });
  } catch (err) { handleError(res, err); }
};

// GET /api/admin/resources/:id
exports.getResourceById = async (req, res) => {
  try {
    const data = await resourceService.getResourceById(req.params.id);
    res.json({ success: true, data });
  } catch (err) { handleError(res, err); }
};

// POST /api/admin/resources
exports.createResource = async (req, res) => {
  try {
    const data = await resourceService.createResource(req.body);
    res.status(201).json({ success: true, data, message: 'Tạo tài nguyên thành công' });
  } catch (err) { handleError(res, err); }
};

// PUT /api/admin/resources/:id
exports.updateResource = async (req, res) => {
  try {
    const data = await resourceService.updateResource(req.params.id, req.body);
    res.json({ success: true, data, message: 'Cập nhật tài nguyên thành công' });
  } catch (err) { handleError(res, err); }
};

// DELETE /api/admin/resources/:id
exports.deleteResource = async (req, res) => {
  try {
    await resourceService.deleteResource(req.params.id);
    res.json({ success: true, message: 'Đã xóa tài nguyên' });
  } catch (err) { handleError(res, err); }
};

// POST /api/admin/resources/:id/view
exports.incrementView = async (req, res) => {
  try {
    await resourceService.incrementView(req.params.id);
    res.json({ success: true });
  } catch (err) { handleError(res, err); }
};

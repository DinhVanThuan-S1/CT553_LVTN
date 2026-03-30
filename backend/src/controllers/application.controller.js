/**
 * Application Controller
 */
const appService = require('../services/application.service');

exports.getMyApplications = async (req, res) => {
  try {
    const data = await appService.getMyApplications(req.user._id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getApplicationDetail = async (req, res) => {
  try {
    const data = await appService.getApplicationDetail(req.user._id, req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.apply = async (req, res) => {
  try {
    const data = await appService.apply(req.user._id, req.body);
    res.status(201).json({ success: true, data, message: 'Ứng tuyển thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const data = await appService.withdraw(req.user._id, req.params.id);
    res.json({ success: true, data, message: 'Đã rút đơn ứng tuyển' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// --- Employer endpoints ---
exports.getApplicationsByJob = async (req, res) => {
  try {
    const data = await appService.getApplicationsByJob(req.user._id, req.params.jobId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const data = await appService.updateStatus(req.user._id, req.params.id, req.body);
    res.json({ success: true, data, message: 'Cập nhật trạng thái thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

/**
 * JobPosting Controller
 */
const jobService = require('../services/jobPosting.service');

// Public
exports.getPublicJobs = async (req, res) => {
  try {
    const result = await jobService.getPublicJobs(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getJobDetail = async (req, res) => {
  try {
    const data = await jobService.getJobDetail(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// Admin
exports.getAdminJobs = async (req, res) => {
  try {
    const result = await jobService.getAdminJobs(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.approveJob = async (req, res) => {
  try {
    const { approved, rejectionReason } = req.body;
    const data = await jobService.approveJob(req.params.id, req.user._id, approved, rejectionReason);
    res.json({
      success: true, data,
      message: approved ? 'Đã duyệt tin tuyển dụng' : 'Đã từ chối tin tuyển dụng',
    });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// Employer
exports.createJob = async (req, res) => {
  try {
    const data = await jobService.createJob(req.user._id, req.body);
    res.status(201).json({ success: true, data, message: 'Đã tạo tin tuyển dụng, chờ admin duyệt' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const data = await jobService.updateJob(req.user._id, req.params.id, req.body);
    res.json({ success: true, data, message: 'Đã cập nhật tin tuyển dụng' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getEmployerJobs = async (req, res) => {
  try {
    const result = await jobService.getEmployerJobs(req.user._id, req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

/**
 * JobPosting Controller
 * CRUD tin tuyển dụng + notification triggers khi duyệt/từ chối
 */
const jobService = require('../services/jobPosting.service');
const { createAndEmitNotification } = require('./notification.controller');

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

    // Notify employer về kết quả duyệt
    try {
      if (approved) {
        await createAndEmitNotification({
          recipient: data.employer,
          type: 'job_approved',
          title: 'Tin tuyển dụng đã được duyệt',
          content: `Tin "${data.title}" đã được admin duyệt và đang hiển thị cho ứng viên.`,
          link: `/employer/job-postings`,
          refModel: 'JobPosting',
          refId: data._id,
        });
      } else {
        await createAndEmitNotification({
          recipient: data.employer,
          type: 'job_rejected',
          title: 'Tin tuyển dụng bị từ chối',
          content: `Tin "${data.title}" đã bị từ chối.${rejectionReason ? ` Lý do: ${rejectionReason}` : ''}`,
          link: `/employer/job-postings`,
          refModel: 'JobPosting',
          refId: data._id,
        });
      }
    } catch (notifErr) {
      console.error('Notification error (approveJob):', notifErr);
    }
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

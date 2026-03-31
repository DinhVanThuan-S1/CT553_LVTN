/**
 * Application Controller
 * Ứng tuyển + quản lý đơn + notification triggers
 */
const appService = require('../services/application.service');
const JobPosting = require('../models/JobPosting');
const { createAndEmitNotification } = require('./notification.controller');

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

    // Notify employer: có ứng viên mới
    try {
      const job = await JobPosting.findById(req.body.jobPostingId).select('employer title');
      if (job) {
        await createAndEmitNotification({
          recipient: job.employer,
          type: 'application_received',
          title: 'Ứng viên mới',
          content: `${req.user.fullName} đã ứng tuyển vị trí "${job.title}"`,
          link: `/employer/applicants`,
          refModel: 'Application',
          refId: data._id,
        });
      }
    } catch (notifErr) {
      console.error('Notification error (apply):', notifErr);
    }
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

    // Notify student về kết quả
    try {
      const { status } = req.body;
      const notifMap = {
        reviewed: {
          type: 'application_reviewed',
          title: 'Đơn đã được xem',
          content: 'Nhà tuyển dụng đã xem đơn ứng tuyển của bạn',
        },
        interview_scheduled: {
          type: 'interview_scheduled',
          title: 'Lịch phỏng vấn',
          content: 'Bạn đã được mời phỏng vấn! Kiểm tra chi tiết trong đơn ứng tuyển.',
        },
        accepted: {
          type: 'application_accepted',
          title: 'Chúc mừng! Đơn được chấp nhận',
          content: 'Đơn ứng tuyển của bạn đã được chấp nhận!',
        },
        rejected: {
          type: 'application_rejected',
          title: 'Kết quả ứng tuyển',
          content: 'Rất tiếc, đơn ứng tuyển của bạn không được chấp nhận.',
        },
      };

      const notifConfig = notifMap[status];
      if (notifConfig) {
        await createAndEmitNotification({
          recipient: data.student,
          ...notifConfig,
          link: `/student/applications`,
          refModel: 'Application',
          refId: data._id,
        });
      }
    } catch (notifErr) {
      console.error('Notification error (updateStatus):', notifErr);
    }
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

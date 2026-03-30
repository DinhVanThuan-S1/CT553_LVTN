/**
 * Application Service
 * Ứng tuyển công việc + quản lý đơn
 */
const Application = require('../models/Application');
const JobPosting = require('../models/JobPosting');
require('../models/Company');
require('../models/CV');

class ApplicationService {
  /** Danh sách đơn ứng tuyển của SV */
  async getMyApplications(studentId) {
    return Application.find({ student: studentId })
      .populate({
        path: 'jobPosting',
        select: 'title company jobType salaryRange status locationText deadline',
        populate: { path: 'company', select: 'name logo' },
      })
      .populate('cv', 'title')
      .sort('-createdAt');
  }

  /** Chi tiết đơn */
  async getApplicationDetail(studentId, appId) {
    const app = await Application.findOne({ _id: appId, student: studentId })
      .populate({
        path: 'jobPosting',
        populate: [
          { path: 'company', select: 'name logo industry website' },
          { path: 'requiredSkills.skill', select: 'name icon' },
        ],
      })
      .populate({
        path: 'cv',
        populate: { path: 'skills', select: 'name icon' },
      });
    if (!app) throw { status: 404, message: 'Không tìm thấy đơn ứng tuyển' };
    return app;
  }

  /** Ứng tuyển */
  async apply(studentId, data) {
    const { jobPostingId, cvId, coverLetter } = data;

    // Check job exists and approved
    const job = await JobPosting.findById(jobPostingId);
    if (!job) throw { status: 404, message: 'Không tìm thấy tin tuyển dụng' };
    if (job.status !== 'approved') throw { status: 400, message: 'Tin tuyển dụng chưa được duyệt' };
    if (job.deadline && new Date(job.deadline) < new Date()) {
      throw { status: 400, message: 'Tin tuyển dụng đã hết hạn' };
    }

    // Check duplicate
    const existing = await Application.findOne({ student: studentId, jobPosting: jobPostingId });
    if (existing) throw { status: 400, message: 'Bạn đã ứng tuyển vị trí này rồi' };

    return Application.create({
      student: studentId,
      jobPosting: jobPostingId,
      cv: cvId,
    });
  }

  /** Rút đơn */
  async withdraw(studentId, appId) {
    const app = await Application.findOne({ _id: appId, student: studentId });
    if (!app) throw { status: 404, message: 'Không tìm thấy đơn' };
    if (['accepted', 'rejected', 'withdrawn'].includes(app.status)) {
      throw { status: 400, message: 'Không thể rút đơn ở trạng thái hiện tại' };
    }
    app.status = 'withdrawn';
    app.respondedAt = new Date();
    await app.save();
    return app;
  }

  /** Employer: lấy danh sách ứng viên cho 1 job */
  async getApplicationsByJob(employerId, jobPostingId) {
    const job = await JobPosting.findOne({ _id: jobPostingId, employer: employerId });
    if (!job) throw { status: 404, message: 'Không tìm thấy tin tuyển dụng' };

    return Application.find({ jobPosting: jobPostingId })
      .populate('student', 'fullName email avatar')
      .populate('cv', 'title headline skills')
      .sort('-createdAt');
  }

  /** Employer: cập nhật trạng thái đơn */
  async updateStatus(employerId, appId, data) {
    const app = await Application.findById(appId).populate('jobPosting', 'employer');
    if (!app) throw { status: 404, message: 'Không tìm thấy đơn' };
    if (app.jobPosting.employer.toString() !== employerId.toString()) {
      throw { status: 403, message: 'Không có quyền' };
    }

    const { status, rejectionReason, interview, employerNotes } = data;
    if (status) app.status = status;
    if (rejectionReason) app.rejectionReason = rejectionReason;
    if (interview) app.interview = interview;
    if (employerNotes) app.employerNotes = employerNotes;

    if (status === 'reviewed') app.reviewedAt = new Date();
    if (status === 'interview_scheduled') app.interviewScheduledAt = new Date();
    if (['accepted', 'rejected'].includes(status)) app.respondedAt = new Date();

    await app.save();
    return app;
  }
}

module.exports = new ApplicationService();

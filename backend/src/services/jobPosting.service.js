/**
 * JobPosting Service
 * Công việc: dành cho public listing + admin approval
 */
const JobPosting = require('../models/JobPosting');
require('../models/Company'); // Ensure Company schema is registered for populate

class JobPostingService {
  /**
   * Danh sách công việc (approved only, cho student xem)
   */
  async getPublicJobs({ page = 1, limit = 12, search, jobType, careerPath, sort = '-createdAt' }) {
    const filter = { status: 'approved' };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { careerPath: { $regex: search, $options: 'i' } },
      ];
    }
    if (jobType) filter.jobType = jobType;
    if (careerPath) filter.careerPath = { $regex: careerPath, $options: 'i' };

    const total = await JobPosting.countDocuments(filter);
    const jobs = await JobPosting.find(filter)
      .populate('company', 'name logo')
      .populate('requiredSkills.skill', 'name icon')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return {
      data: jobs,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Chi tiết (tăng viewCount)
   */
  async getJobDetail(id) {
    const job = await JobPosting.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { new: true })
      .populate('company', 'name logo description website addresses')
      .populate('employer', 'fullName email')
      .populate('requiredSkills.skill', 'name category icon');

    if (!job) throw { status: 404, message: 'Không tìm thấy tin tuyển dụng' };
    return job;
  }

  /**
   * Admin: lấy tất cả (pending/approved/rejected)
   */
  async getAdminJobs({ page = 1, limit = 20, status, search, sort = '-createdAt' }) {
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { careerPath: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await JobPosting.countDocuments(filter);
    const jobs = await JobPosting.find(filter)
      .populate('company', 'name logo')
      .populate('employer', 'fullName email')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return {
      data: jobs,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Admin duyệt / từ chối
   */
  async approveJob(jobId, adminId, approved, rejectionReason = '') {
    const update = approved
      ? { status: 'approved', approvedBy: adminId, approvedAt: new Date() }
      : { status: 'rejected', rejectionReason };

    const job = await JobPosting.findByIdAndUpdate(jobId, update, { new: true });
    if (!job) throw { status: 404, message: 'Không tìm thấy tin tuyển dụng' };
    return job;
  }

  /**
   * Employer: tạo tin
   */
  async createJob(employerId, data) {
    data.employer = employerId;
    // Cho phép lưu nháp hoặc gửi duyệt
    if (!['draft', 'pending'].includes(data.status)) {
      data.status = 'pending';
    }
    return JobPosting.create(data);
  }

  /**
   * Employer: cập nhật tin (chỉ draft/rejected mới sửa được)
   */
  async updateJob(employerId, jobId, data) {
    const job = await JobPosting.findOne({ _id: jobId, employer: employerId });
    if (!job) throw { status: 404, message: 'Không tìm thấy tin tuyển dụng' };
    if (!['draft', 'rejected'].includes(job.status)) {
      throw { status: 400, message: 'Chỉ sửa được tin nháp hoặc bị từ chối' };
    }

    Object.assign(job, data);
    // Cho phép giữ nguyên draft hoặc chuyển sang pending
    if (data.status && ['draft', 'pending'].includes(data.status)) {
      job.status = data.status;
    } else {
      job.status = 'pending';
    }
    await job.save();
    return job;
  }

  /**
   * Employer: danh sách tin của mình
   */
  async getEmployerJobs(employerId, { page = 1, limit = 20 }) {
    const filter = { employer: employerId };
    const total = await JobPosting.countDocuments(filter);
    const jobs = await JobPosting.find(filter)
      .populate('company', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return {
      data: jobs,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    };
  }
}

module.exports = new JobPostingService();

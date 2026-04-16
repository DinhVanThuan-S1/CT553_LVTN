/**
 * Report Controller
 * API thống kê và báo cáo cho Admin Dashboard
 */
const User = require('../models/User');
const PersonalRoadmap = require('../models/PersonalRoadmap');
const Application = require('../models/Application');
const JobPosting = require('../models/JobPosting');
const CareerPreference = require('../models/CareerPreference');
const Skill = require('../models/Skill');
const Roadmap = require('../models/Roadmap');

/**
 * Build a date filter from query params.
 * Priority: startDate+endDate (custom range) > months > all time
 * @returns {{ createdAt: Object } | {}}
 */
function buildDateFilter(query) {
  const { startDate, endDate, months } = query;
  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      return { createdAt: { $gte: start, $lte: end } };
    }
  }
  const m = parseInt(months) || 0;
  if (m > 0) {
    const since = new Date();
    since.setMonth(since.getMonth() - m);
    since.setHours(0, 0, 0, 0);
    return { createdAt: { $gte: since } };
  }
  return {};
}

/**
 * GET /api/admin/reports/overview
 * Tổng quan hệ thống: tổng SV, NTD, tin tuyển dụng, đơn ứng tuyển
 */
exports.getOverview = async (req, res) => {
  try {
    const dateFilter = buildDateFilter(req.query);

    const [
      totalStudents, totalEmployers, totalJobPostings,
      pendingJobs, totalApplications, totalRoadmaps, activePersonalRoadmaps,
    ] = await Promise.all([
      User.countDocuments({ role: 'student', ...dateFilter }),
      User.countDocuments({ role: 'employer', ...dateFilter }),
      JobPosting.countDocuments({ status: 'approved', ...dateFilter }),
      JobPosting.countDocuments({ status: 'pending' }),
      Application.countDocuments(dateFilter),
      Roadmap.countDocuments(),
      PersonalRoadmap.countDocuments({ status: { $ne: 'cancelled' }, ...dateFilter }),
    ]);

    res.json({
      success: true,
      data: { totalStudents, totalEmployers, totalJobPostings, pendingJobs, totalApplications, totalRoadmaps, activePersonalRoadmaps },
    });
  } catch (err) {
    console.error('getOverview error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * GET /api/admin/reports/registrations
 * Số lượng đăng ký theo tháng (12 tháng gần nhất)
 */
exports.getRegistrations = async (req, res) => {
  try {
    // Determine effective start/end
    let startDate, endDate, monthCount;
    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
      // months = diff in months (min 1)
      monthCount = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)));
    } else {
      monthCount = parseInt(req.query.months) || 12;
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthCount);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
    }

    const pipeline = [
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, role: { $in: ['student', 'employer'] } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            role: '$role',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ];

    const results = await User.aggregate(pipeline);

    // Build month labels from startDate → endDate
    const monthLabels = [];
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    while (cursor <= endMonth) {
      monthLabels.push({
        year: cursor.getFullYear(),
        month: cursor.getMonth() + 1,
        label: `T${cursor.getMonth() + 1}/${cursor.getFullYear()}`,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const data = monthLabels.map(({ year, month, label }) => {
      const studentEntry = results.find(r => r._id.year === year && r._id.month === month && r._id.role === 'student');
      const employerEntry = results.find(r => r._id.year === year && r._id.month === month && r._id.role === 'employer');
      return {
        label,
        students: studentEntry?.count || 0,
        employers: employerEntry?.count || 0,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('getRegistrations error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * GET /api/admin/reports/career-paths
 * Hướng nghề nghiệp phổ biến
 */
exports.getPopularCareerPaths = async (req, res) => {
  try {
    const results = await CareerPreference.aggregate([
      { $unwind: '$careerPaths' },
      { $group: { _id: '$careerPaths', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const data = results.map(r => ({ name: r._id, count: r.count }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('getPopularCareerPaths error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * GET /api/admin/reports/roadmap-completion
 * Tỷ lệ hoàn thành lộ trình
 */
exports.getRoadmapCompletion = async (req, res) => {
  try {
    const results = await PersonalRoadmap.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap = {
      active: 'Đang học',
      completed: 'Hoàn thành',
      paused: 'Tạm dừng',
      cancelled: 'Đã hủy',
      not_started: 'Chưa bắt đầu',
    };

    const data = results.map(r => ({
      status: r._id,
      label: statusMap[r._id] || r._id,
      count: r.count,
    }));

    // Tính % completion trung bình
    const avgCompletion = await PersonalRoadmap.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, avg: { $avg: '$completionPercentage' } } },
    ]);

    res.json({
      success: true,
      data: {
        distribution: data,
        averageCompletion: Math.round(avgCompletion[0]?.avg || 0),
      },
    });
  } catch (err) {
    console.error('getRoadmapCompletion error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * GET /api/admin/reports/top-skills
 * Top kỹ năng được học nhiều nhất
 */
exports.getTopSkills = async (req, res) => {
  try {
    const results = await PersonalRoadmap.aggregate([
      { $unwind: '$sessions' },
      { $group: { _id: '$sessions.skill', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'skills',
          localField: '_id',
          foreignField: '_id',
          as: 'skillInfo',
        },
      },
      { $unwind: { path: '$skillInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ['$skillInfo.name', 'Không xác định'] },
          category: '$skillInfo.category',
          count: 1,
        },
      },
    ]);

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('getTopSkills error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * GET /api/admin/reports/applications
 * Thống kê ứng tuyển theo trạng thái
 */
exports.getApplicationStats = async (req, res) => {
  try {
    const dateFilter = buildDateFilter(req.query);

    const results = await Application.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusLabels = {
      pending: 'Chờ xem xét', reviewed: 'Đã xem',
      interview_scheduled: 'Hẹn phỏng vấn', accepted: 'Được nhận',
      rejected: 'Bị từ chối', withdrawn: 'Đã rút',
    };

    const data = results.map(r => ({ status: r._id, label: statusLabels[r._id] || r._id, count: r.count }));

    const monthlyStats = await Application.aggregate([
      { $match: dateFilter },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthly = monthlyStats.map(r => ({
      label: `T${r._id.month}/${r._id.year}`,
      count: r.count,
    }));

    res.json({ success: true, data: { byStatus: data, monthly } });
  } catch (err) {
    console.error('getApplicationStats error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * GET /api/admin/reports/job-postings
 * Thống kê tin tuyển dụng
 */
exports.getJobPostingStats = async (req, res) => {
  try {
    const results = await JobPosting.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusLabels = {
      draft: 'Nháp',
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Bị từ chối',
      expired: 'Hết hạn',
    };

    const data = results.map(r => ({
      status: r._id,
      label: statusLabels[r._id] || r._id,
      count: r.count,
    }));

    // Top công ty đăng tin nhiều nhất
    const topCompanies = await JobPosting.aggregate([
      { $match: { company: { $ne: null } } },
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'companyInfo',
        },
      },
      { $unwind: { path: '$companyInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ['$companyInfo.name', 'Không xác định'] },
          count: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: { byStatus: data, topCompanies },
    });
  } catch (err) {
    console.error('getJobPostingStats error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

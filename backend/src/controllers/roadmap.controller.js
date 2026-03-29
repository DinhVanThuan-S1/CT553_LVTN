/**
 * Roadmap Controller
 * CRUD Lộ trình mẫu
 */
const Roadmap = require('../models/Roadmap');

// Danh sách lộ trình (public / admin)
exports.getRoadmaps = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, difficulty, sort = '-createdAt' } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { careerPath: { $regex: search, $options: 'i' } },
      ];
    }
    if (difficulty) filter.difficulty = difficulty;

    const total = await Roadmap.countDocuments(filter);
    const roadmaps = await Roadmap.find(filter)
      .populate('skills.skill', 'name category icon estimatedHours')
      .populate('createdBy', 'fullName')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: roadmaps,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Chi tiết lộ trình
exports.getRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id)
      .populate('skills.skill', 'name category icon description estimatedHours resources exercises')
      .populate('relatedJobs', 'title careerPath skillsRequired')
      .populate('createdBy', 'fullName');

    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lộ trình' });
    }
    res.json({ success: true, data: roadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tạo lộ trình (admin)
exports.createRoadmap = async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    const roadmap = await Roadmap.create(req.body);
    res.status(201).json({ success: true, data: roadmap, message: 'Tạo lộ trình thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật lộ trình (admin)
exports.updateRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lộ trình' });
    }
    res.json({ success: true, data: roadmap, message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa lộ trình (soft delete)
exports.deleteRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lộ trình' });
    }
    res.json({ success: true, message: 'Đã xóa lộ trình' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

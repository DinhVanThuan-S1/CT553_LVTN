/**
 * Admin Skill Controller
 * CRUD Kỹ năng (bao gồm resources, exercises, testQuestions)
 */
const Skill = require('../models/Skill');

// Lấy danh sách kỹ năng
exports.getSkills = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, sort = 'name' } = req.query;
    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category) filter.category = category;

    const total = await Skill.countDocuments(filter);
    const skills = await Skill.find(filter)
      .select('-testQuestions') // Không trả test questions trong danh sách
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: skills,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy tất cả (cho dropdown)
exports.getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find({ isActive: true })
      .select('name category icon estimatedHours')
      .sort('category name');
    res.json({ success: true, data: skills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Chi tiết (bao gồm resources, exercises, testQuestions)
exports.getSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy kỹ năng' });
    }
    res.json({ success: true, data: skill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tạo mới
exports.createSkill = async (req, res) => {
  try {
    const skill = await Skill.create(req.body);
    res.status(201).json({ success: true, data: skill, message: 'Tạo kỹ năng thành công' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Tên kỹ năng đã tồn tại' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật
exports.updateSkill = async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy kỹ năng' });
    }
    res.json({ success: true, data: skill, message: 'Cập nhật thành công' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Tên kỹ năng đã tồn tại' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa (soft delete)
exports.deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy kỹ năng' });
    }
    res.json({ success: true, message: 'Đã xóa kỹ năng' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

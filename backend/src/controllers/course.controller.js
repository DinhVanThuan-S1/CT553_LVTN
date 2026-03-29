/**
 * Admin Course Controller
 * CRUD Học phần
 */
const Course = require('../models/Course');

// Lấy danh sách học phần (phân trang, tìm kiếm, lọc)
exports.getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, courseType, sort = 'code' } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }
    if (courseType) filter.courseType = courseType;

    const total = await Course.countDocuments(filter);
    const courses = await Course.find(filter)
      .populate('relatedSkills', 'name category icon')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: courses,
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

// Lấy tất cả (cho dropdown / select)
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select('code name credits courseType')
      .sort('code');
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Chi tiết
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('relatedSkills', 'name category icon');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học phần' });
    }
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tạo mới
exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, data: course, message: 'Tạo học phần thành công' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Mã học phần đã tồn tại' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học phần' });
    }
    res.json({ success: true, data: course, message: 'Cập nhật thành công' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Mã học phần đã tồn tại' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa (soft delete)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!course) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học phần' });
    }
    res.json({ success: true, message: 'Đã xóa học phần' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

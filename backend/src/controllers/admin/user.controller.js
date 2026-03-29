/**
 * Admin User Controller
 * QL Người dùng: Danh sách, tìm kiếm, khóa/mở khóa, xem chi tiết
 */
const User = require('../../models/User');

// Lấy danh sách users (có phân trang, lọc, tìm kiếm)
exports.getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      isActive,
      search,
      sort = '-createdAt',
    } = req.query;

    const filter = {};
    // Không hiển thị admin khác
    filter.role = { $ne: 'admin' };

    if (role && ['student', 'employer'].includes(role)) {
      filter.role = role;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-refreshToken -password')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: users,
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

// Xem chi tiết user
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-refreshToken -password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Khóa / Mở khóa tài khoản
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Không thể thay đổi trạng thái admin' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      data: user,
      message: user.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thống kê nhanh users
exports.getUserStats = async (req, res) => {
  try {
    const [totalStudents, totalEmployers, activeStudents, activeEmployers] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'employer' }),
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'employer', isActive: true }),
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalEmployers,
        activeStudents,
        activeEmployers,
        lockedStudents: totalStudents - activeStudents,
        lockedEmployers: totalEmployers - activeEmployers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

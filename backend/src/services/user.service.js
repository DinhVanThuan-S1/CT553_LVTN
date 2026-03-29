/**
 * User Service
 * Business logic cho QL người dùng
 */
const User = require('../models/User');

class UserService {
  /**
   * Lấy danh sách users (phân trang, lọc, tìm kiếm)
   */
  async getUsers({ page = 1, limit = 20, role, isActive, search, sort = '-createdAt' }) {
    const filter = {};
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

    return {
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy chi tiết user
   */
  async getUserById(id) {
    const user = await User.findById(id).select('-refreshToken -password');
    if (!user) throw { status: 404, message: 'Không tìm thấy người dùng' };
    return user;
  }

  /**
   * Khóa / Mở khóa tài khoản
   */
  async toggleUserStatus(id) {
    const user = await User.findById(id);
    if (!user) throw { status: 404, message: 'Không tìm thấy người dùng' };
    if (user.role === 'admin') throw { status: 403, message: 'Không thể thay đổi trạng thái admin' };

    user.isActive = !user.isActive;
    await user.save();

    return {
      data: user,
      message: user.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
    };
  }

  /**
   * Thống kê nhanh users
   */
  async getUserStats() {
    const [totalStudents, totalEmployers, activeStudents, activeEmployers] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'employer' }),
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'employer', isActive: true }),
    ]);

    return {
      totalStudents,
      totalEmployers,
      activeStudents,
      activeEmployers,
      lockedStudents: totalStudents - activeStudents,
      lockedEmployers: totalEmployers - activeEmployers,
    };
  }
}

module.exports = new UserService();

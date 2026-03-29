/**
 * User Controller
 * QL Người dùng: Danh sách, tìm kiếm, khóa/mở khóa, xem chi tiết
 * Delegate business logic sang UserService
 */
const userService = require('../services/user.service');

// Lấy danh sách users (có phân trang, lọc, tìm kiếm)
exports.getUsers = async (req, res) => {
  try {
    const result = await userService.getUsers(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// Xem chi tiết user
exports.getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// Khóa / Mở khóa tài khoản
exports.toggleUserStatus = async (req, res) => {
  try {
    const result = await userService.toggleUserStatus(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// Thống kê nhanh users
exports.getUserStats = async (req, res) => {
  try {
    const data = await userService.getUserStats();
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

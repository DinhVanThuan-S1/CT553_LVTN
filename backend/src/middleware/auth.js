/**
 * Auth Middleware
 * JWT xác thực + phân quyền
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

/**
 * Bảo vệ route - yêu cầu đăng nhập
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Lấy token từ header hoặc cookie
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để truy cập',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Tìm user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ',
    });
  }
};

/**
 * Phân quyền theo role
 * @param  {...string} roles - Danh sách role được phép
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' không có quyền truy cập`,
      });
    }

    next();
  };
};

/**
 * Optional auth - không bắt buộc đăng nhập
 * Nếu có token hợp lệ thì gán req.user
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }
  } catch {
    // Bỏ qua lỗi - user vẫn là null
  }
  next();
};

module.exports = { protect, authorize, optionalAuth };

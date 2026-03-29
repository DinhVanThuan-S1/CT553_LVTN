/**
 * Auth Controller
 * Xử lý đăng ký, đăng nhập, Google OAuth, refresh token, đổi mật khẩu
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

// ===== HELPERS =====

/** Tạo Access Token (ngắn hạn) */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRE });
};

/** Tạo Refresh Token (dài hạn) */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRE });
};

/** Gửi response với tokens */
const sendTokenResponse = async (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Lưu refresh token vào DB
  await User.findByIdAndUpdate(user._id, {
    refreshToken,
    lastLogin: new Date(),
  });

  // Set cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, cookieOptions);

  const userObj = user.toJSON ? user.toJSON() : user;

  res.status(statusCode).json({
    success: true,
    message: statusCode === 201 ? 'Đăng ký thành công' : 'Đăng nhập thành công',
    data: {
      user: userObj,
      accessToken,
      refreshToken,
    },
  });
};

// ===== CONTROLLERS =====

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký tài khoản mới
 */
const register = async (req, res) => {
  try {
    const { email, password, fullName, role, phone } = req.body;

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng',
      });
    }

    // Chỉ cho phép role student hoặc employer khi tự đăng ký
    const allowedRoles = ['student', 'employer'];
    const userRole = allowedRoles.includes(role) ? role : 'student';

    const user = await User.create({
      email,
      password,
      fullName,
      role: userRole,
      phone,
      authProvider: 'local',
      isVerified: false,
    });

    await sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Đăng ký thất bại',
      ...(env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập bằng email/password
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu',
      });
    }

    // Tìm user + lấy password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
      });
    }

    // Kiểm tra auth provider
    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này sử dụng đăng nhập Google. Vui lòng đăng nhập bằng Google.',
      });
    }

    // Kiểm tra tài khoản active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa',
      });
    }

    // So sánh password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
      });
    }

    await sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Đăng nhập thất bại',
      ...(env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Lấy access token mới bằng refresh token
 */
const refreshToken = async (req, res) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không tồn tại',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);

    // Tìm user và kiểm tra refresh token
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ',
      });
    }

    // Tạo tokens mới
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Cập nhật refresh token trong DB
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    const cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    };

    res.cookie('accessToken', newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token đã hết hạn, vui lòng đăng nhập lại',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Không thể refresh token',
    });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Đăng xuất
 */
const logout = async (req, res) => {
  try {
    // Xóa refresh token trong DB
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }

    // Xóa cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Đã đăng xuất',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Đăng xuất thất bại',
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Lấy thông tin user hiện tại
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin người dùng',
    });
  }
};

/**
 * @route   PUT /api/auth/change-password
 * @desc    Đổi mật khẩu
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Đổi mật khẩu thất bại',
    });
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Cập nhật thông tin cá nhân
 */
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, phone, address },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cập nhật thông tin thất bại',
    });
  }
};

/**
 * Google OAuth callback handler
 * Được gọi sau khi Passport xác thực Google
 */
const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, {
      refreshToken,
      lastLogin: new Date(),
    });

    const cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    };

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    // Redirect về frontend với token
    res.redirect(`${env.CLIENT_URL}/auth/google/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${env.CLIENT_URL}/login?error=google_auth_failed`);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
  updateProfile,
  googleCallback,
};

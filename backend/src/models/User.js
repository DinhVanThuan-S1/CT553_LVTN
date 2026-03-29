/**
 * User Model
 * Tài khoản người dùng + phân quyền
 * Roles: student, employer, admin
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Thông tin đăng nhập
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/, 'Email không hợp lệ'],
  },
  password: {
    type: String,
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false, // Không trả về password khi query
  },

  // Thông tin cá nhân
  fullName: {
    type: String,
    required: [true, 'Họ tên là bắt buộc'],
    trim: true,
    maxlength: [100, 'Họ tên không quá 100 ký tự'],
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'],
  },
  avatar: {
    type: String, // URL ảnh (Cloudinary)
    default: '',
  },
  address: {
    type: String,
    trim: true,
  },

  // Phân quyền
  role: {
    type: String,
    enum: {
      values: ['student', 'employer', 'admin'],
      message: 'Role phải là student, employer hoặc admin',
    },
    default: 'student',
  },

  // Trạng thái tài khoản
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },

  // Google OAuth
  googleId: {
    type: String,
    sparse: true,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },

  // Refresh token
  refreshToken: {
    type: String,
    select: false,
  },

  // Lần đăng nhập cuối
  lastLogin: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index cho tìm kiếm nhanh
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ googleId: 1 });

// Hash password trước khi lưu
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// So sánh password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Ẩn các field nhạy cảm khi serialize JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);

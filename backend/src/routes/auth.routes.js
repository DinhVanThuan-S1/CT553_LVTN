/**
 * Auth Routes
 * /api/auth/*
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const passport = require('../config/passport');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
  updateProfile,
  googleCallback,
  completeGoogleRegister,
} = require('../controllers/auth.controller');

// === Validation rules ===
const registerValidation = [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('fullName').trim().notEmpty().withMessage('Họ tên là bắt buộc'),
  body('role').optional().isIn(['student', 'employer']).withMessage('Role không hợp lệ'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại là bắt buộc'),
  body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
];

// === Routes ===

// Public
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/refresh-token', refreshToken);

// Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_failed' }),
  googleCallback
);
// Hoàn tất đăng ký Google khi user mới chọn role
router.post('/google/complete', completeGoogleRegister);

// Protected
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePasswordValidation, validate, changePassword);
router.put('/profile', protect, [
  body('fullName').optional().trim().notEmpty().withMessage('Họ tên không được trống'),
  body('phone').optional().matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
], validate, updateProfile);

module.exports = router;

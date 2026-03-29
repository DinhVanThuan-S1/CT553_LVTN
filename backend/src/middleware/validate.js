/**
 * Validation Middleware
 * Express-validator helpers
 */
const { validationResult } = require('express-validator');

/**
 * Xử lý kết quả validation
 * Nếu có lỗi => trả 400 với danh sách lỗi
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: formattedErrors,
    });
  }
  next();
};

module.exports = { validate };

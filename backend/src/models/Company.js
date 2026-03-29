/**
 * Company Model
 * Hồ sơ công ty của Nhà tuyển dụng
 */
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'Tên công ty là bắt buộc'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  industry: {
    type: String, // Ngành nghề
    trim: true,
  },
  website: {
    type: String,
    trim: true,
  },
  logo: {
    type: String, // URL ảnh
    default: '',
  },
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    default: '1-10',
  },
  // Địa chỉ tuyển dụng
  addresses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyAddress',
  }],
  // Trạng thái xác minh
  isVerified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Company', companySchema);

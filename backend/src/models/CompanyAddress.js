/**
 * CompanyAddress Model
 * Địa chỉ văn phòng/tuyển dụng của công ty
 */
const mongoose = require('mongoose');

const companyAddressSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  // Tên địa chỉ (VD: "Trụ sở chính", "Chi nhánh HCM")
  label: {
    type: String,
    trim: true,
    default: 'Trụ sở chính',
  },
  // Địa chỉ đầy đủ
  fullAddress: {
    type: String,
    required: [true, 'Địa chỉ là bắt buộc'],
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  district: {
    type: String,
    trim: true,
  },
  // Là trụ sở chính?
  isHeadquarter: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

companyAddressSchema.index({ company: 1 });

module.exports = mongoose.model('CompanyAddress', companyAddressSchema);

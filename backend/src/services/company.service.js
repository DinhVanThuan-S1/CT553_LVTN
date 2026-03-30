/**
 * Company Service
 * CRUD hồ sơ công ty cho employer
 */
const Company = require('../models/Company');
const CompanyAddress = require('../models/CompanyAddress');

class CompanyService {
  /** Lấy hoặc tạo hồ sơ công ty cho employer */
  async getMyCompany(employerId) {
    let company = await Company.findOne({ employer: employerId })
      .populate('addresses');
    return company;
  }

  /** Tạo / cập nhật hồ sơ */
  async upsertCompany(employerId, data) {
    const { addresses, ...companyData } = data;

    let company = await Company.findOne({ employer: employerId });

    if (company) {
      Object.assign(company, companyData);
      await company.save();
    } else {
      company = await Company.create({ employer: employerId, ...companyData });
    }

    // Xử lý addresses nếu có
    if (addresses && Array.isArray(addresses)) {
      // Xóa địa chỉ cũ
      await CompanyAddress.deleteMany({ company: company._id });
      // Tạo mới
      const newAddresses = [];
      for (const addr of addresses) {
        const created = await CompanyAddress.create({ company: company._id, ...addr });
        newAddresses.push(created._id);
      }
      company.addresses = newAddresses;
      await company.save();
    }

    return Company.findById(company._id).populate('addresses');
  }

  /** Lấy company theo ID (public) */
  async getCompanyById(companyId) {
    const company = await Company.findById(companyId).populate('addresses');
    if (!company) throw { status: 404, message: 'Không tìm thấy công ty' };
    return company;
  }
}

module.exports = new CompanyService();

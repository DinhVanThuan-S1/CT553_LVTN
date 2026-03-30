/**
 * Company Controller
 */
const companyService = require('../services/company.service');

exports.getMyCompany = async (req, res) => {
  try {
    const data = await companyService.getMyCompany(req.user._id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.upsertCompany = async (req, res) => {
  try {
    const data = await companyService.upsertCompany(req.user._id, req.body);
    res.json({ success: true, data, message: 'Cập nhật hồ sơ công ty thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

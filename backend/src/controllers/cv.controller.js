/**
 * CV Controller
 */
const cvService = require('../services/cv.service');

exports.getMyCVs = async (req, res) => {
  try {
    const data = await cvService.getMyCVs(req.user._id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getCVById = async (req, res) => {
  try {
    const data = await cvService.getCVById(req.user._id, req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getApplicantCV = async (req, res) => {
  try {
    const data = await cvService.getCVForEmployer(req.params.cvId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.createCV = async (req, res) => {
  try {
    const data = await cvService.createCV(req.user._id, req.body);
    res.status(201).json({ success: true, data, message: 'Tạo CV thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.updateCV = async (req, res) => {
  try {
    const data = await cvService.updateCV(req.user._id, req.params.id, req.body);
    res.json({ success: true, data, message: 'Cập nhật CV thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.deleteCV = async (req, res) => {
  try {
    await cvService.deleteCV(req.user._id, req.params.id);
    res.json({ success: true, message: 'Đã xóa CV' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.setDefault = async (req, res) => {
  try {
    const data = await cvService.setDefault(req.user._id, req.params.id);
    res.json({ success: true, data, message: 'Đã đặt CV mặc định' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

/**
 * JobTemplate Controller
 * CRUD endpoints cho admin QL mẫu công việc
 */
const jobTemplateService = require('../services/jobTemplate.service');

exports.getTemplates = async (req, res) => {
  try {
    const result = await jobTemplateService.getTemplates(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getTemplate = async (req, res) => {
  try {
    const data = await jobTemplateService.getById(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const data = await jobTemplateService.create(req.body);
    res.status(201).json({ success: true, data, message: 'Tạo mẫu công việc thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const data = await jobTemplateService.update(req.params.id, req.body);
    res.json({ success: true, data, message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    await jobTemplateService.remove(req.params.id);
    res.json({ success: true, message: 'Đã xóa mẫu công việc' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

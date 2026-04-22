/**
 * JobTemplate Service
 * CRUD mẫu công việc cho Admin
 */
const JobTemplate = require('../models/JobTemplate');

class JobTemplateService {
  async getTemplates({ page = 1, limit = 20, search, sort = '-createdAt' }) {
    const filter = { isActive: true };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { careerPath: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await JobTemplate.countDocuments(filter);
    const data = await JobTemplate.find(filter)
      .populate('requiredSkills.skill', 'name icon category')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return {
      data,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    };
  }

  async getById(id) {
    const tpl = await JobTemplate.findById(id)
      .populate('requiredSkills.skill', 'name icon category');
    if (!tpl) throw { status: 404, message: 'Không tìm thấy mẫu công việc' };
    return tpl;
  }

  async create(data) {
    return JobTemplate.create(data);
  }

  async update(id, data) {
    const tpl = await JobTemplate.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!tpl) throw { status: 404, message: 'Không tìm thấy mẫu công việc' };
    return tpl;
  }

  async remove(id) {
    const tpl = await JobTemplate.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!tpl) throw { status: 404, message: 'Không tìm thấy mẫu công việc' };
    return tpl;
  }
}

module.exports = new JobTemplateService();

/**
 * Skill Service
 * Business logic cho QL Kỹ năng
 */
const Skill = require('../models/Skill');

class SkillService {
  async getSkills({ page = 1, limit = 20, search, category, sort = 'name' }) {
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;

    const total = await Skill.countDocuments(filter);
    const skills = await Skill.find(filter)
      .select('-testQuestions')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return {
      data: skills,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    };
  }

  async getAllSkills() {
    return Skill.find({ isActive: true })
      .select('name category icon estimatedHours')
      .sort('category name');
  }

  async getSkillById(id) {
    const skill = await Skill.findById(id);
    if (!skill) throw { status: 404, message: 'Không tìm thấy kỹ năng' };
    return skill;
  }

  async createSkill(data) {
    try {
      return await Skill.create(data);
    } catch (error) {
      if (error.code === 11000) throw { status: 400, message: 'Tên kỹ năng đã tồn tại' };
      throw error;
    }
  }

  async updateSkill(id, data) {
    try {
      const skill = await Skill.findByIdAndUpdate(id, data, { new: true, runValidators: true });
      if (!skill) throw { status: 404, message: 'Không tìm thấy kỹ năng' };
      return skill;
    } catch (error) {
      if (error.code === 11000) throw { status: 400, message: 'Tên kỹ năng đã tồn tại' };
      throw error;
    }
  }

  async deleteSkill(id) {
    const skill = await Skill.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!skill) throw { status: 404, message: 'Không tìm thấy kỹ năng' };
    return skill;
  }
}

module.exports = new SkillService();

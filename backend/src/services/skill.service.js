/**
 * Skill Service
 * Business logic cho QL Kỹ năng — populate linkedResources từ Resource collection
 */
const Skill = require('../models/Skill');
const Resource = require('../models/Resource');

class SkillService {
  async getSkills({ page = 1, limit = 20, search, category }) {
    const filter = { isActive: { $ne: false } };
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;

    const total = await Skill.countDocuments(filter);
    const skills = await Skill.find(filter)
      .populate('linkedResources', 'type') // chỉ lấy type để đếm theo loại
      .sort('name')
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
    const skill = await Skill.findById(id)
      .populate({
        path: 'linkedResources',
        match: { isActive: { $ne: false } },
        select: 'title type category difficulty estimatedMinutes url isFeatured testQuestions description',
      });
    if (!skill) throw { status: 404, message: 'Không tìm thấy kỹ năng' };
    return skill;
  }

  async createSkill(data) {
    try {
      const skill = await Skill.create(data);
      // Đồng bộ sang Resource nếu có linkedResources
      if (data.linkedResources?.length) {
        await Resource.updateMany(
          { _id: { $in: data.linkedResources } },
          { $addToSet: { skills: skill._id } }
        );
      }
      return skill;
    } catch (error) {
      if (error.code === 11000) throw { status: 400, message: 'Tên kỹ năng đã tồn tại' };
      throw error;
    }
  }

  async updateSkill(id, data) {
    try {
      const old = await Skill.findById(id);
      if (!old) throw { status: 404, message: 'Không tìm thấy kỹ năng' };

      const skill = await Skill.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        .populate({
          path: 'linkedResources',
          match: { isActive: { $ne: false } },
          select: 'title type category difficulty estimatedMinutes url',
        });

      // Sync 2 chiều: Resource.skills
      if (data.linkedResources !== undefined) {
        const oldRes = (old.linkedResources || []).map(r => r.toString());
        const newRes = (data.linkedResources || []).map(r => r.toString());
        const removed = oldRes.filter(r => !newRes.includes(r));
        const added = newRes.filter(r => !oldRes.includes(r));

        if (removed.length) {
          await Resource.updateMany({ _id: { $in: removed } }, { $pull: { skills: skill._id } });
        }
        if (added.length) {
          await Resource.updateMany({ _id: { $in: added } }, { $addToSet: { skills: skill._id } });
        }
      }

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

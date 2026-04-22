/**
 * Resource Service
 * CRUD tài nguyên học tập, đồng bộ 2 chiều với Skill.linkedResources
 */
const Resource = require('../models/Resource');
const Skill = require('../models/Skill');

class ResourceService {
  // ─── Lấy danh sách (phân trang) ───
  async getResources({ page = 1, limit = 20, search, type, skillId, featured, sort }) {
    const filter = { isActive: { $ne: false } };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }
    if (type) filter.type = type;
    if (skillId) filter.skills = skillId;
    if (featured === 'true') filter.isFeatured = true;

    // Nếu có param sort từ client → dùng; ngược lại giữ default isFeatured + newest
    const sortOption = sort ? sort : { isFeatured: -1, createdAt: -1 };

    const total = await Resource.countDocuments(filter);
    const resources = await Resource.find(filter)
      .populate('skills', 'name icon category')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return {
      data: resources,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    };
  }

  // ─── Lấy tất cả (không phân trang, cho picker) ───
  async getAllResources({ type, skillId } = {}) {
    const filter = { isActive: { $ne: false } };
    if (type) filter.type = type;
    if (skillId) filter.skills = skillId;
    return Resource.find(filter)
      .select('title type category difficulty estimatedMinutes skills')
      .populate('skills', 'name')
      .sort('type title');
  }

  // ─── Chi tiết ───
  async getResourceById(id) {
    const resource = await Resource.findById(id).populate('skills', 'name icon category');
    if (!resource) throw { status: 404, message: 'Không tìm thấy tài nguyên' };
    return resource;
  }

  // ─── Tạo mới ───
  async createResource(data) {
    const resource = await Resource.create(data);

    // Đồng bộ sang Skill.linkedResources
    if (data.skills?.length) {
      await Skill.updateMany(
        { _id: { $in: data.skills } },
        { $addToSet: { linkedResources: resource._id } }
      );
    }
    return resource.populate('skills', 'name icon category');
  }

  // ─── Cập nhật ───
  async updateResource(id, data) {
    const old = await Resource.findById(id);
    if (!old) throw { status: 404, message: 'Không tìm thấy tài nguyên' };

    const resource = await Resource.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('skills', 'name icon category');

    // Đồng bộ 2 chiều: xóa khỏi skills cũ không còn liên kết
    const oldSkills = (old.skills || []).map(s => s.toString());
    const newSkills = (data.skills || []).map(s => s.toString());

    const removed = oldSkills.filter(s => !newSkills.includes(s));
    const added = newSkills.filter(s => !oldSkills.includes(s));

    if (removed.length) {
      await Skill.updateMany(
        { _id: { $in: removed } },
        { $pull: { linkedResources: resource._id } }
      );
    }
    if (added.length) {
      await Skill.updateMany(
        { _id: { $in: added } },
        { $addToSet: { linkedResources: resource._id } }
      );
    }

    return resource;
  }

  // ─── Xóa (soft delete + cleanup) ───
  async deleteResource(id) {
    const resource = await Resource.findById(id);
    if (!resource) throw { status: 404, message: 'Không tìm thấy tài nguyên' };

    // Xóa tham chiếu khỏi tất cả Skills
    await Skill.updateMany(
      { linkedResources: resource._id },
      { $pull: { linkedResources: resource._id } }
    );

    await Resource.findByIdAndUpdate(id, { isActive: false });
    return resource;
  }

  // ─── Tăng lượt xem ───
  async incrementView(id) {
    await Resource.findByIdAndUpdate(id, { $inc: { views: 1 } });
  }

  // ─── Stats ───
  async getStats() {
    const [total, byType] = await Promise.all([
      Resource.countDocuments({ isActive: { $ne: false } }),
      Resource.aggregate([
        { $match: { isActive: { $ne: false } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);
    return { total, byType };
  }
}

module.exports = new ResourceService();

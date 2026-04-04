/**
 * Roadmap Service
 * Business logic cho QL Lộ trình mẫu
 */
const Roadmap = require('../models/Roadmap');

class RoadmapService {
  async getRoadmaps({ page = 1, limit = 20, search, difficulty, sort = '-createdAt' }) {
    const filter = { isActive: true };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { careerPath: { $regex: search, $options: 'i' } },
      ];
    }
    if (difficulty) filter.difficulty = difficulty;

    const total = await Roadmap.countDocuments(filter);
    const roadmaps = await Roadmap.find(filter)
      .populate('skills.skill', 'name category icon estimatedHours')
      .populate('createdBy', 'fullName')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return {
      data: roadmaps,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    };
  }

  async getRoadmapById(id) {
    const roadmap = await Roadmap.findById(id)
      .populate('skills.skill', 'name category icon description estimatedHours')
      .populate({
        path: 'relatedJobs',
        select: 'title description careerPath requiredSkills salaryRange',
        populate: { path: 'requiredSkills.skill', select: 'name icon' },
      })
      .populate('createdBy', 'fullName');
    if (!roadmap) throw { status: 404, message: 'Không tìm thấy lộ trình' };
    return roadmap;
  }

  async createRoadmap(data, userId) {
    data.createdBy = userId;
    return Roadmap.create(data);
  }

  async updateRoadmap(id, data) {
    const roadmap = await Roadmap.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!roadmap) throw { status: 404, message: 'Không tìm thấy lộ trình' };
    return roadmap;
  }

  async deleteRoadmap(id) {
    const roadmap = await Roadmap.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!roadmap) throw { status: 404, message: 'Không tìm thấy lộ trình' };
    return roadmap;
  }
}

module.exports = new RoadmapService();

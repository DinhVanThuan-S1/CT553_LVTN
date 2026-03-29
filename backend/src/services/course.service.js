/**
 * Course Service
 * Business logic cho QL Học phần
 */
const Course = require('../models/Course');

class CourseService {
  async getCourses({ page = 1, limit = 20, search, courseType, courseCategory, sort = 'code' }) {
    const filter = {};
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }
    if (courseType) filter.courseType = courseType;
    if (courseCategory) filter.courseCategory = courseCategory;

    const total = await Course.countDocuments(filter);
    const courses = await Course.find(filter)
      .populate('relatedSkills', 'name category icon')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return {
      data: courses,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    };
  }

  async getAllCourses() {
    return Course.find({ isActive: true })
      .select('code name credits courseType')
      .sort('code');
  }

  async getCourseById(id) {
    const course = await Course.findById(id).populate('relatedSkills', 'name category icon');
    if (!course) throw { status: 404, message: 'Không tìm thấy học phần' };
    return course;
  }

  async createCourse(data) {
    try {
      return await Course.create(data);
    } catch (error) {
      if (error.code === 11000) throw { status: 400, message: 'Mã học phần đã tồn tại' };
      throw error;
    }
  }

  async updateCourse(id, data) {
    try {
      const course = await Course.findByIdAndUpdate(id, data, { new: true, runValidators: true });
      if (!course) throw { status: 404, message: 'Không tìm thấy học phần' };
      return course;
    } catch (error) {
      if (error.code === 11000) throw { status: 400, message: 'Mã học phần đã tồn tại' };
      throw error;
    }
  }

  async deleteCourse(id) {
    const course = await Course.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!course) throw { status: 404, message: 'Không tìm thấy học phần' };
    return course;
  }
}

module.exports = new CourseService();

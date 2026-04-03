/**
 * Course Service
 * Business logic cho QL Học phần
 */
const Course = require('../models/Course');
const Semester = require('../models/Semester');
const AcademicProfile = require('../models/AcademicProfile');

class CourseService {
  async getCourses({ page = 1, limit = 20, search, courseType, courseCategory, sort = 'code' }) {
    const filter = { isActive: { $ne: false } };
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
      const oldCourse = await Course.findById(id);
      if (!oldCourse) throw { status: 404, message: 'Không tìm thấy học phần' };

      const course = await Course.findByIdAndUpdate(id, data, { new: true, runValidators: true });

      const oldIsRequired = oldCourse.courseType === 'required';
      const newIsRequired = course.courseType === 'required';
      const typeChanged = oldIsRequired !== newIsRequired;
      const creditsChanged = oldCourse.credits !== course.credits;

      // 1. Sync Semester.courses[].isRequired khi courseType thay đổi
      if (typeChanged) {
        await Semester.updateMany(
          { 'courses.course': id },
          { $set: { 'courses.$[elem].isRequired': newIsRequired } },
          { arrayFilters: [{ 'elem.course': id }] }
        );

        // Sync AcademicProfile.courseGrades[].isRequired
        await AcademicProfile.updateMany(
          { 'courseGrades.course': id },
          { $set: { 'courseGrades.$[elem].isRequired': newIsRequired } },
          { arrayFilters: [{ 'elem.course': id }] }
        );
      }

      // 2. Recalculate Semester.requiredCredits / electiveCredits khi credits hoặc courseType thay đổi
      if (typeChanged || creditsChanged) {
        const affectedSemesters = await Semester.find({ 'courses.course': id })
          .populate('courses.course', 'credits courseType');

        for (const sem of affectedSemesters) {
          let reqCredits = 0;
          let electCredits = 0;
          for (const item of sem.courses) {
            const credits = item.course?.credits || 0;
            if (item.isRequired !== false) reqCredits += credits;
            else electCredits += credits;
          }
          await Semester.findByIdAndUpdate(sem._id, {
            requiredCredits: reqCredits,
            electiveCredits: electCredits,
          });
        }
      }

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

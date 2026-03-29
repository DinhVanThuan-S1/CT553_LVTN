/**
 * Course Controller
 * CRUD Học phần - delegate sang CourseService
 */
const courseService = require('../services/course.service');

exports.getCourses = async (req, res) => {
  try {
    const result = await courseService.getCourses(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const data = await courseService.getAllCourses();
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const data = await courseService.getCourseById(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const data = await courseService.createCourse(req.body);
    res.status(201).json({ success: true, data, message: 'Tạo học phần thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const data = await courseService.updateCourse(req.params.id, req.body);
    res.json({ success: true, data, message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    await courseService.deleteCourse(req.params.id);
    res.json({ success: true, message: 'Đã xóa học phần' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

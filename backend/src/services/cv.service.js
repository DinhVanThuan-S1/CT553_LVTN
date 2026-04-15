/**
 * CV Service
 * CRUD CV cho sinh viên
 */
const CV = require('../models/CV');

class CVService {
  /** Danh sách CV của SV */
  async getMyCVs(studentId) {
    return CV.find({ student: studentId })
      .populate('skills', 'name icon category')
      .sort('-isDefault -updatedAt');
  }

  /** Chi tiết CV */
  async getCVById(studentId, cvId) {
    const cv = await CV.findOne({ _id: cvId, student: studentId })
      .populate('skills', 'name icon category estimatedHours');
    if (!cv) throw { status: 404, message: 'Không tìm thấy CV' };
    return cv;
  }

  /** Employer xem CV ứng viên (không cần check studentId) */
  async getCVForEmployer(cvId) {
    const cv = await CV.findById(cvId)
      .populate('skills', 'name icon category estimatedHours')
      .populate('student', 'fullName email');
    if (!cv) throw { status: 404, message: 'Không tìm thấy CV' };
    return cv;
  }

  /** Tạo CV mới */
  async createCV(studentId, data) {
    // Nếu là CV đầu tiên, auto set default
    const count = await CV.countDocuments({ student: studentId });
    if (count === 0) data.isDefault = true;

    return CV.create({ student: studentId, ...data });
  }

  /** Cập nhật CV */
  async updateCV(studentId, cvId, data) {
    const cv = await CV.findOneAndUpdate(
      { _id: cvId, student: studentId },
      data,
      { new: true, runValidators: true }
    ).populate('skills', 'name icon category');
    if (!cv) throw { status: 404, message: 'Không tìm thấy CV' };
    return cv;
  }

  /** Xóa CV */
  async deleteCV(studentId, cvId) {
    const cv = await CV.findOneAndDelete({ _id: cvId, student: studentId });
    if (!cv) throw { status: 404, message: 'Không tìm thấy CV' };
    // Nếu xóa CV default → gán default cho CV còn lại
    if (cv.isDefault) {
      const remaining = await CV.findOne({ student: studentId }).sort('-updatedAt');
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }
    return cv;
  }

  /** Set CV mặc định */
  async setDefault(studentId, cvId) {
    await CV.updateMany({ student: studentId }, { isDefault: false });
    const cv = await CV.findOneAndUpdate(
      { _id: cvId, student: studentId },
      { isDefault: true },
      { new: true }
    );
    if (!cv) throw { status: 404, message: 'Không tìm thấy CV' };
    return cv;
  }
}

module.exports = new CVService();

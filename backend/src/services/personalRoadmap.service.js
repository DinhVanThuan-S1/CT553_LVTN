/**
 * PersonalRoadmap Service
 * Lộ trình cá nhân: chọn, set lịch, tiến độ
 */
const PersonalRoadmap = require('../models/PersonalRoadmap');
const Roadmap = require('../models/Roadmap');

class PersonalRoadmapService {
  /**
   * Danh sách lộ trình cá nhân
   */
  async getMyRoadmaps(studentId) {
    return PersonalRoadmap.find({ student: studentId })
      .populate('roadmap', 'title careerPath thumbnail difficulty estimatedMonths')
      .populate('sessions.skill', 'name icon category')
      .sort('-createdAt');
  }

  /**
   * Chi tiết lộ trình cá nhân
   */
  async getRoadmapDetail(studentId, id) {
    const pr = await PersonalRoadmap.findOne({ _id: id, student: studentId })
      .populate({
        path: 'roadmap',
        populate: { path: 'skills.skill', select: 'name category icon estimatedHours description' },
      })
      .populate('sessions.skill', 'name icon');

    if (!pr) throw { status: 404, message: 'Không tìm thấy lộ trình' };
    return pr;
  }

  /**
   * Chọn lộ trình + set thời gian + lịch rảnh → tạo sessions
   */
  async enrollRoadmap(studentId, data) {
    const { roadmapId, durationMonths, schoolSchedule, freeTimeSlots } = data;

    const roadmap = await Roadmap.findById(roadmapId).populate('skills.skill', 'name estimatedHours');
    if (!roadmap) throw { status: 404, message: 'Không tìm thấy lộ trình mẫu' };

    // Kiểm tra đã enroll chưa
    const existing = await PersonalRoadmap.findOne({
      student: studentId, roadmap: roadmapId, status: { $in: ['active', 'paused'] },
    });
    if (existing) throw { status: 400, message: 'Bạn đã đăng ký lộ trình này rồi' };

    const startDate = new Date();
    const expectedEndDate = new Date();
    expectedEndDate.setMonth(expectedEndDate.getMonth() + durationMonths);

    // Tạo sessions từ skills + freeTimeSlots
    const sessions = this._generateSessions(roadmap.skills, freeTimeSlots, startDate, expectedEndDate);

    const pr = await PersonalRoadmap.create({
      student: studentId,
      roadmap: roadmapId,
      durationMonths,
      schoolSchedule: schoolSchedule || [],
      freeTimeSlots: freeTimeSlots || [],
      startDate,
      expectedEndDate,
      sessions,
    });

    // Tăng enrollmentCount
    await Roadmap.findByIdAndUpdate(roadmapId, { $inc: { enrollmentCount: 1 } });

    return pr;
  }

  /**
   * Cập nhật trạng thái session (hoàn thành buổi học)
   */
  async completeSession(studentId, roadmapId, sessionId) {
    const pr = await PersonalRoadmap.findOne({ _id: roadmapId, student: studentId });
    if (!pr) throw { status: 404, message: 'Không tìm thấy lộ trình' };

    const session = pr.sessions.id(sessionId);
    if (!session) throw { status: 404, message: 'Không tìm thấy buổi học' };

    session.status = 'completed';
    session.completedAt = new Date();

    // Tính progress
    const total = pr.sessions.length;
    const completed = pr.sessions.filter((s) => s.status === 'completed').length;
    pr.progress = Math.round((completed / total) * 100);

    // Tính tổng giờ đã học
    pr.totalHoursLearned = completed * 2; // mỗi session ~2h

    if (pr.progress === 100) {
      pr.status = 'completed';
    }

    await pr.save();
    return pr;
  }

  /**
   * Generate sessions tự động dựa trên skills + free time
   */
  _generateSessions(skills, freeTimeSlots, startDate, endDate) {
    const sessions = [];
    if (!freeTimeSlots || freeTimeSlots.length === 0) return sessions;

    let currentDate = new Date(startDate);
    let skillIndex = 0;
    let hoursRemaining = skills[0]?.estimatedHours || 20;

    while (currentDate < endDate && skillIndex < skills.length) {
      const dayOfWeek = currentDate.getDay();
      const matchingSlots = freeTimeSlots.filter((s) => s.dayOfWeek === dayOfWeek);

      for (const slot of matchingSlots) {
        if (skillIndex >= skills.length) break;

        sessions.push({
          skill: skills[skillIndex].skill._id || skills[skillIndex].skill,
          date: new Date(currentDate),
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: 'upcoming',
        });

        hoursRemaining -= 2;
        if (hoursRemaining <= 0) {
          skillIndex++;
          hoursRemaining = skills[skillIndex]?.estimatedHours || 20;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return sessions;
  }
}

module.exports = new PersonalRoadmapService();

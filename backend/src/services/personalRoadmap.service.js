/**
 * PersonalRoadmap Service
 * Lộ trình cá nhân: chọn, set lịch, tiến độ
 */
const PersonalRoadmap = require('../models/PersonalRoadmap');
const Roadmap = require('../models/Roadmap');
const StudentSkill = require('../models/StudentSkill');
const AcademicProfile = require('../models/AcademicProfile');

class PersonalRoadmapService {
  /**
   * Danh sách lộ trình cá nhân
   */
  async getMyRoadmaps(studentId) {
    const prs = await PersonalRoadmap.find({ student: studentId, status: { $ne: 'cancelled' } })
      .populate('roadmap', 'title careerPath thumbnail difficulty estimatedMonths')
      .populate('sessions.skill', 'name icon category')
      .sort('-createdAt');

    // Backfill totalHoursPlanned cho PR cũ (chưa có field)
    for (const pr of prs) {
      if (!pr.totalHoursPlanned && pr.sessions?.length > 0) {
        // Ước tính từ sessions: mỗi session 2h
        pr.totalHoursPlanned = pr.sessions.length * 2;
        await pr.save();
      }
    }
    return prs;
  }

  /**
   * Chi tiết lộ trình cá nhân
   */
  async getRoadmapDetail(studentId, id) {
    const pr = await PersonalRoadmap.findOne({ _id: id, student: studentId })
      .populate({
        path: 'roadmap',
        populate: [
          { path: 'skills.skill', select: 'name category icon estimatedHours description' },
          {
            path: 'relatedJobs',
            select: 'title description careerPath requiredSkills salaryRange',
            populate: { path: 'requiredSkills.skill', select: 'name icon' },
          },
        ],
      })
      .populate('sessions.skill', 'name icon');

    if (!pr) throw { status: 404, message: 'Không tìm thấy lộ trình' };
    return pr;
  }

  /**
   * Chọn lộ trình + set thời gian + lịch rảnh → tạo sessions
   */
  /**
   * Lấy danh sách khung giờ đã bị chiếm bởi các lộ trình active
   */
  async getOccupiedSlots(studentId) {
    const activeRoadmaps = await PersonalRoadmap.find({
      student: studentId,
      status: 'active',
    }).select('freeTimeSlots roadmap');

    const slots = [];
    activeRoadmaps.forEach(pr => {
      (pr.freeTimeSlots || []).forEach(slot => {
        slots.push({
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          roadmapId: pr.roadmap,
        });
      });
    });
    return slots;
  }

  async enrollRoadmap(studentId, data) {
    const { roadmapId, schoolSchedule, freeTimeSlots, adjustments } = data;

    const roadmap = await Roadmap.findById(roadmapId).populate('skills.skill', 'name estimatedHours');
    if (!roadmap) throw { status: 404, message: 'Không tìm thấy lộ trình mẫu' };

    // Kiểm tra đã enroll chưa
    const existing = await PersonalRoadmap.findOne({
      student: studentId, roadmap: roadmapId, status: { $in: ['active', 'paused'] },
    });
    if (existing) throw { status: 400, message: 'Bạn đã đăng ký lộ trình này rồi' };

    // Kiểm tra trùng slot với lộ trình active khác
    const occupiedSlots = await this.getOccupiedSlots(studentId);
    for (const slot of (freeTimeSlots || [])) {
      const conflict = occupiedSlots.find(
        o => o.dayOfWeek === slot.dayOfWeek && o.startTime === slot.startTime
      );
      if (conflict) {
        throw { status: 400, message: `Khung giờ ${slot.startTime} ngày ${slot.dayOfWeek} đã được sử dụng bởi lộ trình khác` };
      }
    }

    // Nếu có adjustments (từ AI generate) → apply adjusted hours
    let skillsForSession = roadmap.skills;
    if (adjustments && adjustments.length > 0) {
      const adjMap = {};
      adjustments.forEach(a => { adjMap[a.skillName.toLowerCase()] = a.adjustedHours; });
      skillsForSession = roadmap.skills.map(s => {
        const key = (s.skill?.name || '').toLowerCase();
        if (adjMap[key]) {
          return { ...s.toObject ? s.toObject() : s, estimatedHours: adjMap[key] };
        }
        return s;
      });
    }

    // Tự tính thời gian học từ số slot
    const totalHours = skillsForSession.reduce((sum, s) => sum + (s.estimatedHours || 20), 0);
    const hoursPerWeek = (freeTimeSlots?.length || 1) * 2;
    const weeksNeeded = Math.ceil(totalHours / hoursPerWeek);
    const durationMonths = Math.max(1, Math.ceil(weeksNeeded / 4));

    const startDate = new Date();
    const expectedEndDate = new Date();
    expectedEndDate.setMonth(expectedEndDate.getMonth() + durationMonths);

    // Tạo sessions với adjusted hours (hoặc original)
    const sessions = this._generateSessions(skillsForSession, freeTimeSlots, startDate, expectedEndDate);

    const prData = {
      student: studentId,
      roadmap: roadmapId,
      durationMonths,
      totalHoursPlanned: totalHours,
      schoolSchedule: schoolSchedule || [],
      freeTimeSlots: freeTimeSlots || [],
      startDate,
      expectedEndDate,
      sessions,
    };

    // Nếu enroll từ personalized → lưu thêm metadata
    if (adjustments && adjustments.length > 0) {
      prData.source = 'ai-generated';
      prData.baseRoadmapTitle = roadmap.title;
      prData.adjustments = adjustments;
    }

    const pr = await PersonalRoadmap.create(prData);

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
   * Tạm dừng lộ trình
   */
  async pauseRoadmap(studentId, roadmapId) {
    const pr = await PersonalRoadmap.findOne({ _id: roadmapId, student: studentId });
    if (!pr) throw { status: 404, message: 'Không tìm thấy lộ trình' };
    if (pr.status !== 'active') throw { status: 400, message: 'Chỉ có thể tạm dừng lộ trình đang hoạt động' };
    pr.status = 'paused';
    await pr.save();
    return pr;
  }

  /**
   * Hủy đăng ký lộ trình — xóa thật sự khỏi DB
   */
  async cancelRoadmap(studentId, roadmapId) {
    const pr = await PersonalRoadmap.findOne({ _id: roadmapId, student: studentId });
    if (!pr) throw { status: 404, message: 'Không tìm thấy lộ trình' };
    if (pr.status === 'completed') throw { status: 400, message: 'Không thể hủy lộ trình đã hoàn thành' };

    const roadmapRef = pr.roadmap;
    await PersonalRoadmap.deleteOne({ _id: roadmapId, student: studentId });
    await Roadmap.findByIdAndUpdate(roadmapRef, { $inc: { enrollmentCount: -1 } });

    return { deleted: true };
  }

  /**
   * Tiếp tục lộ trình
   */
  async resumeRoadmap(studentId, roadmapId) {
    const pr = await PersonalRoadmap.findOne({ _id: roadmapId, student: studentId });
    if (!pr) throw { status: 404, message: 'Không tìm thấy lộ trình' };
    if (pr.status !== 'paused') throw { status: 400, message: 'Lộ trình không ở trạng thái tạm dừng' };

    // Kiểm tra trùng slot khi resume
    const activeRoadmaps = await PersonalRoadmap.find({
      student: studentId, status: 'active',
    }).populate('roadmap', 'title');

    const conflicts = [];
    for (const slot of (pr.freeTimeSlots || [])) {
      for (const other of activeRoadmaps) {
        const match = (other.freeTimeSlots || []).find(
          o => o.dayOfWeek === slot.dayOfWeek && o.startTime === slot.startTime
        );
        if (match && !conflicts.find(c => c.roadmapId === other._id.toString())) {
          conflicts.push({
            roadmapId: other._id.toString(),
            roadmapTitle: other.roadmap?.title || 'Lộ trình',
          });
        }
      }
    }

    if (conflicts.length > 0) {
      const err = {
        status: 409,
        message: `Xung đột lịch với: ${conflicts.map(c => c.roadmapTitle).join(', ')}`,
        conflicts,
      };
      throw err;
    }

    pr.status = 'active';
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

  /**
   * Lấy danh sách kỹ năng đã hoàn thành 100%
   * Một skill chỉ được tính khi TẤT CẢ sessions của skill đó đều completed
   */
  async getCompletedSkills(studentId) {
    const Skill = require('../models/Skill');

    const roadmaps = await PersonalRoadmap.find({
      student: studentId,
      status: { $in: ['active', 'completed'] },
    }).select('sessions');

    // Group sessions by skill: { skillId → { total, completed } }
    const skillStats = new Map();
    for (const pr of roadmaps) {
      for (const s of pr.sessions || []) {
        if (!s.skill) continue;
        const id = s.skill.toString();
        if (!skillStats.has(id)) skillStats.set(id, { total: 0, completed: 0 });
        const stat = skillStats.get(id);
        stat.total += 1;
        if (s.status === 'completed') stat.completed += 1;
      }
    }

    // Chỉ lấy skill mà 100% sessions đều completed (total > 0)
    const fullyCompletedIds = [...skillStats.entries()]
      .filter(([, stat]) => stat.total > 0 && stat.completed === stat.total)
      .map(([id]) => id);

    if (fullyCompletedIds.length === 0) return [];

    return Skill.find({ _id: { $in: fullyCompletedIds }, isActive: true })
      .select('name category icon estimatedHours')
      .sort('category name');
  }

  /**
   * Tính toán điều chỉnh giờ học cá nhân hóa (KHÔNG tạo PersonalRoadmap)
   * SV xem adjustments trên trang chi tiết rồi mới đăng ký qua enrollRoadmap
   */
  async calculatePersonalizedAdjustments(studentId, baseRoadmapId) {
    const roadmap = await Roadmap.findById(baseRoadmapId)
      .populate('skills.skill', 'name category estimatedHours');
    if (!roadmap) throw { status: 404, message: 'Không tìm thấy lộ trình mẫu' };

    // Lấy kỹ năng + hồ sơ học tập của SV
    const [studentSkills, academicProfile] = await Promise.all([
      StudentSkill.find({ student: studentId }).populate('skill', 'name'),
      AcademicProfile.findOne({ student: studentId })
        .populate('courseGrades.course', 'name'),
    ]);

    // Map skill → proficiency
    const skillProficiency = {};
    (studentSkills || []).forEach(ss => {
      if (ss.skill?.name) {
        skillProficiency[ss.skill.name.toLowerCase()] = ss.proficiencyLevel || 3;
      }
    });

    // Map course name → grade
    const courseGradeMap = {};
    (academicProfile?.courseGrades || []).forEach(cg => {
      const name = (cg.course?.name || '').toLowerCase();
      if (name) courseGradeMap[name] = parseFloat(cg.numericGrade) || 0;
    });

    // Điều chỉnh giờ học cho từng skill
    const adjustments = [];
    roadmap.skills.forEach(rs => {
      const skillName = (rs.skill?.name || '').toLowerCase();
      const originalHours = rs.estimatedHours || 20;
      let adjustedHours = originalHours;
      let reason = '';

      const proficiency = skillProficiency[skillName];
      if (proficiency !== undefined) {
        if (proficiency >= 4) {
          adjustedHours = Math.max(4, Math.round(originalHours * 0.4));
          reason = `Đã thành thạo (level ${proficiency}/5) → giảm còn ${adjustedHours}h`;
        } else if (proficiency >= 3) {
          adjustedHours = Math.max(8, Math.round(originalHours * 0.65));
          reason = `Đã có nền tảng → giảm còn ${adjustedHours}h`;
        } else if (proficiency <= 2) {
          adjustedHours = Math.round(originalHours * 1.3);
          reason = `Cần củng cố (level ${proficiency}/5) → tăng lên ${adjustedHours}h`;
        }
      }

      // Kiểm tra điểm HP liên quan
      for (const [courseName, grade] of Object.entries(courseGradeMap)) {
        if (this._courseRelatesTo(courseName, skillName)) {
          if (grade >= 8.0 && adjustedHours === originalHours) {
            adjustedHours = Math.max(6, Math.round(originalHours * 0.6));
            reason = `Điểm HP liên quan ${grade}/10 → giảm còn ${adjustedHours}h`;
          } else if (grade < 5.0) {
            adjustedHours = Math.round(Math.max(adjustedHours, originalHours) * 1.2);
            reason = `Điểm HP liên quan thấp (${grade}/10) → tăng lên ${adjustedHours}h`;
          }
          break;
        }
      }

      if (adjustedHours !== originalHours) {
        adjustments.push({
          skillName: rs.skill?.name || skillName,
          originalHours,
          adjustedHours: Math.round(adjustedHours),
          reason,
        });
      }
    });

    return { adjustments, roadmapTitle: roadmap.title };
  }


  /** Kiểm tra HP có liên quan đến skill */
  _courseRelatesTo(courseName, skillName) {
    const cn = courseName.toLowerCase();
    const sn = skillName.toLowerCase();
    if (cn.includes(sn.split(' ')[0]) || sn.includes(cn.split(' ')[0])) return true;
    const map = {
      'web': ['html', 'css', 'javascript', 'frontend', 'backend', 'react', 'node'],
      'database': ['sql', 'mongodb', 'database'],
      'cơ sở dữ liệu': ['sql', 'mongodb', 'database'],
      'trí tuệ nhân tạo': ['ai', 'machine learning', 'python'],
      'machine learning': ['ai', 'python', 'tensorflow'],
      'mobile': ['android', 'ios', 'react native', 'flutter'],
      'mạng': ['network', 'devops', 'docker'],
    };
    for (const [key, related] of Object.entries(map)) {
      if (cn.includes(key) && related.some(r => sn.includes(r))) return true;
    }
    return false;
  }
}

module.exports = new PersonalRoadmapService();

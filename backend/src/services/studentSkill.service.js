/**
 * StudentSkill Service
 * Quản lý kỹ năng sinh viên từ 3 nguồn:
 *   1. roadmap  — Hoàn thành kỹ năng trong lộ trình
 *   2. academic — Hệ thống phân tích HP điểm cao
 *   3. self     — SV tự khai báo
 */
const StudentSkill = require('../models/StudentSkill');
const AcademicProfile = require('../models/AcademicProfile');
const PersonalRoadmap = require('../models/PersonalRoadmap');

class StudentSkillService {
  /**
   * Lấy tất cả skills của sinh viên (gộp 3 nguồn)
   */
  async getStudentSkills(studentId) {
    const skills = await StudentSkill.find({ student: studentId })
      .populate('skill', 'name category icon description estimatedHours')
      .sort('skill.name');

    // Gộp theo skillId — nếu 1 skill có nhiều source thì merge
    const merged = new Map();
    for (const ss of skills) {
      if (!ss.skill) continue;
      const key = ss.skill._id.toString();
      if (merged.has(key)) {
        const existing = merged.get(key);
        existing.sources.push(ss.source);
        if (ss.isVerified) existing.isVerified = true;
        if (ss.proficiencyLevel > existing.proficiencyLevel) existing.proficiencyLevel = ss.proficiencyLevel;
      } else {
        merged.set(key, {
          _id: ss._id,
          skill: ss.skill,
          sources: [ss.source],
          isVerified: ss.isVerified,
          proficiencyLevel: ss.proficiencyLevel,
          metadata: ss.metadata,
          createdAt: ss.createdAt,
        });
      }
    }

    return Array.from(merged.values());
  }

  /**
   * SV tự khai báo skills (source = self)
   */
  async addSelfSkills(studentId, skillIds) {
    const ops = skillIds.map(skillId => ({
      updateOne: {
        filter: { student: studentId, skill: skillId, source: 'self' },
        update: {
          $setOnInsert: {
            student: studentId,
            skill: skillId,
            source: 'self',
            isVerified: false,
            proficiencyLevel: 3,
          },
        },
        upsert: true,
      },
    }));

    await StudentSkill.bulkWrite(ops);
    return this.getStudentSkills(studentId);
  }

  /**
   * SV xóa skill tự khai báo
   */
  async removeSelfSkill(studentId, skillId) {
    await StudentSkill.deleteOne({ student: studentId, skill: skillId, source: 'self' });
    return this.getStudentSkills(studentId);
  }

  /**
   * Cập nhật proficiency level cho skill tự khai báo
   */
  async updateProficiency(studentId, skillId, level) {
    await StudentSkill.updateOne(
      { student: studentId, skill: skillId, source: 'self' },
      { proficiencyLevel: level }
    );
    return this.getStudentSkills(studentId);
  }

  /**
   * [Auto] Cấp kỹ năng từ roadmap khi hoàn thành kỹ năng trong lộ trình
   * Gọi khi SV hoàn thành tất cả buổi học của 1 skill
   */
  async grantRoadmapSkill(studentId, skillId, personalRoadmapId) {
    await StudentSkill.findOneAndUpdate(
      { student: studentId, skill: skillId, source: 'roadmap' },
      {
        student: studentId,
        skill: skillId,
        source: 'roadmap',
        isVerified: true,
        proficiencyLevel: 4,
        'metadata.personalRoadmapId': personalRoadmapId,
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  /**
   * [Auto] Phân tích học phần điểm cao → cấp kỹ năng academic
   * Chạy khi SV cập nhật hồ sơ học tập
   * Logic: HP có grade >= B (numericGrade >= 7) + có relatedSkills → cấp verified skill
   */
  async syncAcademicSkills(studentId) {
    const profile = await AcademicProfile.findOne({ student: studentId })
      .populate({
        path: 'courseGrades.course',
        select: 'code name relatedSkills credits',
        populate: { path: 'relatedSkills', select: 'name' },
      });

    if (!profile) return;

    // Tìm tất cả HP điểm >= B (gradePoint >= 3.0 hoặc numericGrade >= 7)
    const highGradeCourses = profile.courseGrades.filter(cg => {
      return cg.grade && ['A', 'B+', 'B'].includes(cg.grade);
    });

    // Lấy tất cả skills liên quan
    const ops = [];
    for (const cg of highGradeCourses) {
      const course = cg.course;
      if (!course || !course.relatedSkills || course.relatedSkills.length === 0) continue;

      for (const skill of course.relatedSkills) {
        const skillId = skill._id || skill;
        ops.push({
          updateOne: {
            filter: { student: studentId, skill: skillId, source: 'academic' },
            update: {
              $set: {
                student: studentId,
                skill: skillId,
                source: 'academic',
                isVerified: true,
                proficiencyLevel: cg.grade === 'A' ? 5 : cg.grade === 'B+' ? 4 : 3,
                'metadata.courseCode': course.code,
                'metadata.courseName': course.name,
                'metadata.grade': cg.grade,
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (ops.length > 0) {
      await StudentSkill.bulkWrite(ops);
    }

    // Xóa academic skills mà HP đã không còn điểm cao
    const validSkillIds = ops.map(op => op.updateOne.filter.skill.toString());
    await StudentSkill.deleteMany({
      student: studentId,
      source: 'academic',
      skill: { $nin: validSkillIds },
    });
  }

  /**
   * [Auto] Sync kỹ năng roadmap từ PersonalRoadmap đã hoàn thành skill
   * Chạy khi complete session
   */
  async syncRoadmapSkills(studentId) {
    const roadmaps = await PersonalRoadmap.find({
      student: studentId,
      status: { $in: ['active', 'completed'] },
    }).populate({
      path: 'roadmap',
      select: 'skills',
      populate: { path: 'skills.skill', select: 'name' },
    });

    for (const pr of roadmaps) {
      if (!pr.roadmap?.skills) continue;

      for (const rSkill of pr.roadmap.skills) {
        const skillId = rSkill.skill?._id || rSkill.skill;
        if (!skillId) continue;

        // Kiểm tra tất cả session của skill này đã completed chưa
        const skillSessions = pr.sessions.filter(
          s => (s.skill?.toString() || s.skill) === skillId.toString()
        );
        const allCompleted = skillSessions.length > 0 &&
          skillSessions.every(s => s.status === 'completed');

        if (allCompleted) {
          await this.grantRoadmapSkill(studentId, skillId, pr._id);
        }
      }
    }
  }

  /**
   * Lấy skills cho CV (grouped by verified/unverified)
   */
  async getSkillsForCV(studentId) {
    const skills = await this.getStudentSkills(studentId);
    // Phân loại chi tiết hơn để CV phân biệt
    const roadmap = skills.filter(s => s.sources.includes('roadmap'));
    const academic = skills.filter(s => s.sources.includes('academic') && !s.sources.includes('roadmap'));
    const self = skills.filter(s => !s.isVerified);
    return {
      verified: skills.filter(s => s.isVerified),   // tất cả verified (highlight trên CV)
      unverified: self,                               // không highlight
      roadmap,                                        // cụ thể: từ lộ trình
      academic,                                       // cụ thể: từ học phần
    };
  }
}

module.exports = new StudentSkillService();

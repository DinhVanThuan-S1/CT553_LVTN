/**
 * Job Suggestion Service
 * Smart matching: Phân tích hồ sơ SV + career pref → gợi ý công việc phù hợp
 *
 * Scoring (100 điểm):
 * 1. Career Path Match (35%) — hướng nghề khớp với job
 * 2. Skill Match (30%) — kỹ năng yêu cầu vs. kỹ năng SV có qua lộ trình
 * 3. Job Type Match (15%) — loại hình (full-time, part-time, internship...)
 * 4. Salary Fit (10%) — lương kỳ vọng vs. lương job
 * 5. Location Match (10%) — địa điểm ưu tiên
 */
const AcademicProfile = require('../models/AcademicProfile');
const CareerPreference = require('../models/CareerPreference');
const PersonalRoadmap = require('../models/PersonalRoadmap');
const JobPosting = require('../models/JobPosting');

class JobSuggestionService {
  /**
   * Gợi ý công việc dành cho sinh viên
   */
  async suggestJobs(studentId) {
    const [academicProfile, careerPref, personalRoadmaps, activeJobs] = await Promise.all([
      AcademicProfile.findOne({ student: studentId })
        .populate('courseGrades.course', 'name keywords'),
      CareerPreference.findOne({ student: studentId }),
      PersonalRoadmap.find({ student: studentId, status: { $ne: 'cancelled' } })
        .populate('roadmap', 'careerPath')
        .populate('sessions.skill', 'name category'),
      JobPosting.find({ status: 'approved', deadline: { $gte: new Date() } })
        .populate('company', 'name logo')
        .populate('requiredSkills.skill', 'name category')
        .populate('location', 'city province')
        .sort('-createdAt')
        .limit(50)
        .lean(),
    ]);

    // Lấy set kỹ năng SV đã học qua lộ trình
    const studentSkills = this._extractStudentSkills(personalRoadmaps);

    const suggestions = activeJobs.map(job => {
      const analysis = this._analyzeJobMatch(job, academicProfile, careerPref, studentSkills);
      return {
        job,
        matchScore: analysis.totalScore,
        matchDetails: analysis.details,
        strengths: analysis.strengths,
        gaps: analysis.gaps,
      };
    });

    return suggestions
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8); // Top 8 jobs
  }

  /**
   * Trích xuất kỹ năng của SV từ lộ trình cá nhân
   */
  _extractStudentSkills(personalRoadmaps) {
    const skills = new Set();
    const careerPaths = new Set();

    personalRoadmaps.forEach(pr => {
      if (pr.roadmap?.careerPath) careerPaths.add(pr.roadmap.careerPath.toLowerCase());
      pr.sessions?.forEach(session => {
        if (session.skill?.name) skills.add(session.skill.name.toLowerCase());
      });
    });

    return { skills, careerPaths };
  }

  _analyzeJobMatch(job, academicProfile, careerPref, studentSkills) {
    const details = {};
    const strengths = [];
    const gaps = [];
    let totalScore = 0;

    // === 1. CAREER PATH MATCH (35 điểm) ===
    let careerScore = 0;
    const jobCareerPath = (job.careerPath || '').toLowerCase();
    const jobTitle = (job.title || '').toLowerCase();
    const studentCareerPaths = (careerPref?.careerPaths || []).map(p => p.toLowerCase());
    const roadmapCareerPaths = [...studentSkills.careerPaths];

    const allCareerPaths = [...new Set([...studentCareerPaths, ...roadmapCareerPaths])];

    if (allCareerPaths.length > 0) {
      if (allCareerPaths.some(cp => this._fuzzyMatch(cp, jobCareerPath) || this._fuzzyMatch(cp, jobTitle))) {
        careerScore = 35;
        strengths.push(`Phù hợp với hướng nghề nghiệp "${job.careerPath || job.title}" của bạn`);
      } else {
        const keywords = this._extractKeywords(jobCareerPath + ' ' + jobTitle);
        const matched = keywords.filter(kw =>
          allCareerPaths.some(cp => cp.includes(kw) || kw.includes(cp.split(' ')[0]))
        );
        careerScore = Math.min(35, matched.length * 8);
        if (careerScore === 0) {
          gaps.push('Không khớp với hướng nghề nghiệp ưu tiên của bạn');
        }
      }
    } else {
      careerScore = 17; // chưa cập nhật
      gaps.push('Cập nhật sở thích nghề nghiệp để nhận gợi ý chính xác hơn');
    }
    details.careerPath = careerScore;
    totalScore += careerScore;

    // === 2. SKILL MATCH (30 điểm) ===
    let skillScore = 0;
    const requiredSkills = job.requiredSkills || [];

    if (requiredSkills.length > 0 && studentSkills.skills.size > 0) {
      const matchedSkills = requiredSkills.filter(rs => {
        const skillName = (rs.skill?.name || '').toLowerCase();
        return [...studentSkills.skills].some(ss =>
          ss.includes(skillName.split(' ')[0]) || skillName.includes(ss.split(' ')[0])
        );
      });

      const ratio = matchedSkills.length / requiredSkills.length;
      skillScore = Math.round(ratio * 30);

      if (matchedSkills.length > 0) {
        const names = matchedSkills.slice(0, 2).map(s => s.skill?.name).filter(Boolean);
        if (names.length) strengths.push(`Bạn đã có kỹ năng: ${names.join(', ')}`);
      }

      const unmatched = requiredSkills
        .filter(rs => !matchedSkills.includes(rs))
        .slice(0, 2)
        .map(s => s.skill?.name)
        .filter(Boolean);
      if (unmatched.length) gaps.push(`Cần bổ sung: ${unmatched.join(', ')}`);
    } else if (requiredSkills.length === 0) {
      skillScore = 20; // Không yêu cầu kỹ năng cụ thể
      strengths.push('Không yêu cầu kỹ năng đặc biệt — phù hợp cho nhiều đối tượng');
    } else {
      skillScore = 10; // Chưa có lộ trình
      gaps.push('Hãy đăng ký lộ trình học tập để tích lũy kỹ năng cần thiết');
    }
    details.skillMatch = skillScore;
    totalScore += skillScore;

    // === 3. JOB TYPE MATCH (15 điểm) ===
    let typeScore = 0;
    const preferredTypes = careerPref?.jobTypes || [];
    if (preferredTypes.length === 0) {
      typeScore = 8; // Chưa chọn
    } else if (preferredTypes.includes(job.jobType)) {
      typeScore = 15;
      const typeLabels = {
        'full-time': 'Toàn thời gian', 'part-time': 'Bán thời gian',
        'internship': 'Thực tập', 'freelance': 'Freelance', 'remote': 'Từ xa',
      };
      strengths.push(`Loại hình ${typeLabels[job.jobType]} khớp với mong muốn của bạn`);
    } else {
      typeScore = 5;
    }
    details.jobType = typeScore;
    totalScore += typeScore;

    // === 4. SALARY FIT (10 điểm) ===
    let salaryScore = 0;
    const expectedMin = careerPref?.expectedSalary?.min || 0;
    const expectedMax = careerPref?.expectedSalary?.max || 0;
    const jobMin = job.salaryRange?.min || 0;
    const jobMax = job.salaryRange?.max || 0;

    if (job.salaryRange?.isNegotiable) {
      salaryScore = 7;
      strengths.push('Mức lương có thể thương lượng');
    } else if (expectedMin === 0 && expectedMax === 0) {
      salaryScore = 5; // Chưa cài
    } else {
      // Overlap check
      const hasOverlap = jobMax >= expectedMin && jobMin <= expectedMax;
      if (hasOverlap) {
        salaryScore = 10;
        if (jobMin >= expectedMin) {
          strengths.push(`Mức lương ${jobMin}–${jobMax}tr phù hợp kỳ vọng`);
        }
      } else if (jobMax < expectedMin) {
        salaryScore = 3;
        gaps.push(`Mức lương thấp hơn kỳ vọng (${expectedMin}–${expectedMax}tr)`);
      } else {
        salaryScore = 8;
      }
    }
    details.salary = salaryScore;
    totalScore += salaryScore;

    // === 5. LOCATION MATCH (10 điểm) ===
    let locationScore = 0;
    const preferredLocations = (careerPref?.preferredLocations || []).map(l => l.toLowerCase());
    const jobLocation = (job.locationText || '').toLowerCase();

    if (preferredLocations.length === 0) {
      locationScore = 5;
    } else if (
      preferredLocations.some(loc => jobLocation.includes(loc) || loc === 'remote') ||
      job.jobType === 'remote'
    ) {
      locationScore = 10;
      strengths.push('Địa điểm phù hợp khu vực ưu tiên của bạn');
    } else {
      locationScore = 3;
      gaps.push('Địa điểm không nằm trong khu vực ưu tiên');
    }
    details.location = locationScore;
    totalScore += locationScore;

    return { totalScore, details, strengths, gaps };
  }

  _fuzzyMatch(a, b) {
    if (!a || !b) return false;
    if (a === b || a.includes(b) || b.includes(a)) return true;
    const wordsA = a.split(/[\s\-_]+/).filter(w => w.length > 2);
    const wordsB = b.split(/[\s\-_]+/).filter(w => w.length > 2);
    const intersection = wordsA.filter(w => wordsB.includes(w));
    return intersection.length >= 1;
  }

  _extractKeywords(str) {
    return (str || '').toLowerCase().split(/[\s\-_,\/]+/).filter(w => w.length > 2);
  }
}

module.exports = new JobSuggestionService();

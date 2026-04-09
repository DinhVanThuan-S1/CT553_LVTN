/**
 * Job Suggestion Service — Thuật toán gợi ý (không AI)
 * Smart matching: Phân tích đa nguồn → gợi ý công việc
 *
 * Theo request_ai.md Section 2 — Tiêu chí:
 * 1. Career Path Match (30%) — hướng nghề
 * 2. Skill Match (25%) — kỹ năng từ Skill Map + Lộ trình
 * 3. Job Type Match (15%) — loại hình
 * 4. Salary Fit (10%) — lương kỳ vọng
 * 5. Location Match (10%) — khu vực
 * 6. Academic Fit (10%) — GPA + HP liên quan
 */
const AcademicProfile = require('../models/AcademicProfile');
const CareerPreference = require('../models/CareerPreference');
const PersonalRoadmap = require('../models/PersonalRoadmap');
const StudentSkill = require('../models/StudentSkill');
const JobPosting = require('../models/JobPosting');

class JobSuggestionService {
  /**
   * Gợi ý công việc dựa trên đa nguồn dữ liệu
   */
  async suggestJobs(studentId) {
    const [academicProfile, careerPref, personalRoadmaps, studentSkills, activeJobs] =
      await Promise.all([
        AcademicProfile.findOne({ student: studentId })
          .populate('courseGrades.course', 'name keywords'),
        CareerPreference.findOne({ student: studentId }),
        PersonalRoadmap.find({ student: studentId, status: { $ne: 'cancelled' } })
          .populate('roadmap', 'careerPath')
          .populate('sessions.skill', 'name category'),
        // [MỚI] Skill Map đầy đủ
        StudentSkill.find({ student: studentId })
          .populate('skill', 'name category'),
        JobPosting.find({ status: 'approved', deadline: { $gte: new Date() } })
          .populate('company', 'name logo')
          .populate('requiredSkills.skill', 'name category')
          .populate('location', 'city province')
          .sort('-createdAt')
          .limit(50)
          .lean(),
      ]);

    // Lấy kỹ năng từ cả 2 nguồn: Skill Map + Lộ trình
    const allSkills = this._mergeStudentSkills(personalRoadmaps, studentSkills);

    const suggestions = activeJobs.map(job => {
      const analysis = this._analyzeJobMatch(job, academicProfile, careerPref, allSkills);
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
      .slice(0, 10);
  }

  /**
   * Merge kỹ năng từ Skill Map + Lộ trình cá nhân
   */
  _mergeStudentSkills(personalRoadmaps, studentSkills) {
    const skills = new Set();
    const careerPaths = new Set();

    // Từ Skill Map (StudentSkill)
    (studentSkills || []).forEach(ss => {
      if (ss.skill?.name) skills.add(ss.skill.name.toLowerCase());
    });

    // Từ Lộ trình cá nhân
    (personalRoadmaps || []).forEach(pr => {
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

    // === 1. CAREER PATH MATCH (30 điểm) ===
    let careerScore = 0;
    const jobCareerPath = (job.careerPath || '').toLowerCase();
    const jobTitle = (job.title || '').toLowerCase();
    const studentCareerPaths = (careerPref?.careerPaths || []).map(p => p.toLowerCase());
    const roadmapCareerPaths = [...studentSkills.careerPaths];
    const allCareerPaths = [...new Set([...studentCareerPaths, ...roadmapCareerPaths])];

    if (allCareerPaths.length > 0) {
      if (allCareerPaths.some(cp => this._fuzzyMatch(cp, jobCareerPath) || this._fuzzyMatch(cp, jobTitle))) {
        careerScore = 30;
        strengths.push(`Phù hợp hướng nghề "${job.careerPath || job.title}"`);
      } else {
        const keywords = this._extractKeywords(jobCareerPath + ' ' + jobTitle);
        const matched = keywords.filter(kw =>
          allCareerPaths.some(cp => cp.includes(kw) || kw.includes(cp.split(' ')[0]))
        );
        careerScore = Math.min(30, matched.length * 8);
        if (careerScore === 0) {
          gaps.push('Không khớp hướng nghề nghiệp ưu tiên');
        }
      }
    } else {
      careerScore = 15;
      gaps.push('Cập nhật sở thích nghề nghiệp để gợi ý chính xác hơn');
    }
    details.careerPath = careerScore;
    totalScore += careerScore;

    // === 2. SKILL MATCH (25 điểm) — Từ Skill Map + Lộ trình ===
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
      skillScore = Math.round(ratio * 25);

      if (matchedSkills.length > 0) {
        const names = matchedSkills.slice(0, 3).map(s => s.skill?.name).filter(Boolean);
        if (names.length) strengths.push(`Có kỹ năng: ${names.join(', ')}`);
      }

      const unmatched = requiredSkills
        .filter(rs => !matchedSkills.includes(rs))
        .slice(0, 3)
        .map(s => s.skill?.name)
        .filter(Boolean);
      if (unmatched.length) gaps.push(`Cần bổ sung: ${unmatched.join(', ')}`);
    } else if (requiredSkills.length === 0) {
      skillScore = 17;
      strengths.push('Không yêu cầu kỹ năng đặc biệt');
    } else {
      skillScore = 8;
      gaps.push('Khai báo kỹ năng hoặc đăng ký lộ trình để tích lũy');
    }
    details.skillMatch = skillScore;
    totalScore += skillScore;

    // === 3. JOB TYPE MATCH (15 điểm) ===
    let typeScore = 0;
    const preferredTypes = careerPref?.jobTypes || [];
    if (preferredTypes.length === 0) {
      typeScore = 8;
    } else if (preferredTypes.includes(job.jobType)) {
      typeScore = 15;
      const labels = {
        'full-time': 'Toàn thời gian', 'part-time': 'Bán thời gian',
        'internship': 'Thực tập', 'freelance': 'Freelance', 'remote': 'Từ xa',
      };
      strengths.push(`Loại hình ${labels[job.jobType] || job.jobType} phù hợp`);
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
      strengths.push('Mức lương thương lượng');
    } else if (expectedMin === 0) {
      salaryScore = 5;
    } else {
      const hasOverlap = jobMax >= expectedMin && jobMin <= expectedMax;
      if (hasOverlap) {
        salaryScore = 10;
        if (jobMin >= expectedMin) strengths.push(`Lương ${jobMin}–${jobMax}tr phù hợp kỳ vọng`);
      } else if (jobMax < expectedMin) {
        salaryScore = 3;
        gaps.push(`Lương thấp hơn kỳ vọng (${expectedMin}–${expectedMax}tr)`);
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
      strengths.push('Địa điểm phù hợp khu vực ưu tiên');
    } else {
      locationScore = 3;
      gaps.push('Địa điểm không nằm trong khu vực ưu tiên');
    }
    details.location = locationScore;
    totalScore += locationScore;

    // === 6. ACADEMIC FIT (10 điểm bonus) ===
    // Xét GPA phù hợp với mức độ yêu cầu của job
    let academicScore = 0;
    const gpa = academicProfile?.gpa || 0;
    if (gpa >= 3.2) {
      academicScore = 10;
    } else if (gpa >= 2.5) {
      academicScore = 7;
    } else if (gpa > 0) {
      academicScore = 4;
    } else {
      academicScore = 5; // Chưa nhập
    }
    // Tổng max = 30+25+15+10+10 = 90 + 10 academic = 100
    details.academic = academicScore;
    totalScore += academicScore;

    return { totalScore, details, strengths, gaps };
  }

  _fuzzyMatch(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
    // Loại các từ chung chung không mang ý nghĩa phân biệt
    const stopWords = new Set([
      'developer', 'engineer', 'senior', 'junior', 'intern', 'lead',
      'manager', 'specialist', 'analyst', 'designer', 'consultant',
      'architect', 'technician', 'officer', 'admin', 'expert',
    ]);
    const wordsA = a.split(/[\s\-_]+/).filter(w => w.length > 2 && !stopWords.has(w));
    const wordsB = b.split(/[\s\-_]+/).filter(w => w.length > 2 && !stopWords.has(w));
    if (wordsA.length === 0 || wordsB.length === 0) return false;
    const intersection = wordsA.filter(w => wordsB.includes(w));
    return intersection.length >= 1;
  }

  _extractKeywords(str) {
    const stopWords = new Set([
      'developer', 'engineer', 'senior', 'junior', 'intern', 'lead',
      'manager', 'specialist', 'analyst', 'designer', 'consultant',
      'architect', 'technician', 'officer', 'admin', 'expert',
    ]);
    return (str || '').toLowerCase().split(/[\s\-_,\/()]+/).filter(w => w.length > 2 && !stopWords.has(w));
  }
}

module.exports = new JobSuggestionService();

/**
 * Roadmap Suggestion Service — Thuật toán gợi ý (không AI)
 * Smart matching: Phân tích đa nguồn dữ liệu → gợi ý lộ trình
 *
 * Theo request_ai.md Section 1.1 — 7 nguồn dữ liệu:
 * a. Hướng nghề nghiệp mong muốn
 * b. Khu vực làm việc mong muốn
 * c. Mức lương mong muốn
 * d. Công ty quan tâm
 * e. Hồ sơ học tập (ngành, HP đã học)
 * f. Kết quả học tập (điểm từng HP)
 * g. Skill Map / kỹ năng hiện có
 *
 * Scoring (100 điểm):
 * 1. Career Path Match (30%) — hướng nghề khớp lộ trình
 * 2. Skill Match (25%) — kỹ năng SV vs. kỹ năng lộ trình
 * 3. Academic Match (20%) — GPA + HP liên quan
 * 4. Market Fit (15%) — lương + khu vực + công ty
 * 5. Duration Fit (10%) — phù hợp giai đoạn học
 */
const AcademicProfile = require('../models/AcademicProfile');
const CareerPreference = require('../models/CareerPreference');
const PersonalRoadmap = require('../models/PersonalRoadmap');
const StudentSkill = require('../models/StudentSkill');
const Roadmap = require('../models/Roadmap');
const JobPosting = require('../models/JobPosting');

class RoadmapSuggestionService {
  /**
   * Gợi ý lộ trình dựa trên đa nguồn dữ liệu
   */
  async suggestRoadmaps(studentId) {
    // 1. Lấy tất cả nguồn dữ liệu song song
    const [academicProfile, careerPref, enrolledRoadmaps, studentSkills, allRoadmaps, marketData] =
      await Promise.all([
        AcademicProfile.findOne({ student: studentId })
          .populate('courseGrades.course', 'name keywords relatedSkills courseType'),
        CareerPreference.findOne({ student: studentId }),
        PersonalRoadmap.find({ student: studentId, status: { $ne: 'cancelled' } }).select('roadmap'),
        // [MỚI] Lấy Skill Map đầy đủ
        StudentSkill.find({ student: studentId })
          .populate('skill', 'name category keywords'),
        Roadmap.find({ isActive: true })
          .populate('skills.skill', 'name category keywords')
          .lean(),
        // [MỚI] Phân tích thị trường từ Job Postings
        this._getMarketData(),
      ]);

    const enrolledIds = new Set(enrolledRoadmaps.map(r => r.roadmap.toString()));

    // Chuẩn bị skill set từ StudentSkill
    const mySkillSet = new Set(
      studentSkills
        .filter(ss => ss.skill?.name)
        .map(ss => ss.skill.name.toLowerCase())
    );
    const mySkillCategories = new Set(
      studentSkills
        .filter(ss => ss.skill?.category)
        .map(ss => ss.skill.category.toLowerCase())
    );

    // 2. Tính score cho từng lộ trình
    const suggestions = allRoadmaps.map(roadmap => {
      const analysis = this._analyzeMatch(
        roadmap, academicProfile, careerPref, mySkillSet, mySkillCategories, marketData
      );
      return {
        roadmap,
        matchScore: analysis.totalScore,
        matchDetails: analysis.details,
        strengths: analysis.strengths,
        gaps: analysis.gaps,
        isEnrolled: enrolledIds.has(roadmap._id.toString()),
      };
    });

    // 3. Sắp xếp + top 5
    return suggestions
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }

  /**
   * Phân tích thị trường từ Job Postings (request_ai.md 1.1b,c,d)
   */
  async _getMarketData() {
    try {
      const jobs = await JobPosting.find({
        status: 'approved',
        deadline: { $gte: new Date() },
      })
        .populate('requiredSkills.skill', 'name category')
        .populate('company', 'name')
        .select('careerPath requiredSkills company salaryRange locationText jobType')
        .lean();

      // Thống kê career paths phổ biến theo khu vực
      const locationCareerMap = {};  // { "hồ chí minh": { "frontend": 3, "backend": 5 } }
      const salaryByCareer = {};     // { "devops": [min, max, ...] }
      const companyCareerMap = {};   // { "fpt": ["java backend", "frontend react"] }
      const skillDemand = {};        // { "react": 10, "docker": 8 }

      jobs.forEach(job => {
        const career = (job.careerPath || '').toLowerCase();
        const location = (job.locationText || '').toLowerCase();
        const company = (job.company?.name || '').toLowerCase();

        // Location → Career demand
        if (location && career) {
          const locKey = this._normalizeLocation(location);
          if (!locationCareerMap[locKey]) locationCareerMap[locKey] = {};
          locationCareerMap[locKey][career] = (locationCareerMap[locKey][career] || 0) + 1;
        }

        // Salary by career
        if (career && job.salaryRange?.max) {
          if (!salaryByCareer[career]) salaryByCareer[career] = [];
          salaryByCareer[career].push(job.salaryRange.max);
        }

        // Company → Career paths
        if (company && career) {
          if (!companyCareerMap[company]) companyCareerMap[company] = new Set();
          companyCareerMap[company].add(career);
        }

        // Skill demand
        (job.requiredSkills || []).forEach(rs => {
          const name = (rs.skill?.name || '').toLowerCase();
          if (name) skillDemand[name] = (skillDemand[name] || 0) + 1;
        });
      });

      // Convert Sets to Arrays
      for (const key of Object.keys(companyCareerMap)) {
        companyCareerMap[key] = [...companyCareerMap[key]];
      }

      return { locationCareerMap, salaryByCareer, companyCareerMap, skillDemand };
    } catch {
      return { locationCareerMap: {}, salaryByCareer: {}, companyCareerMap: {}, skillDemand: {} };
    }
  }

  /**
   * Phân tích chi tiết — 5 nhóm tiêu chí
   */
  _analyzeMatch(roadmap, academicProfile, careerPref, mySkillSet, mySkillCategories, marketData) {
    const details = {};
    const strengths = [];
    const gaps = [];
    let totalScore = 0;

    const roadmapCareerPath = (roadmap.careerPath || '').toLowerCase();
    const roadmapSkillNames = roadmap.skills
      .map(s => (s.skill?.name || '').toLowerCase())
      .filter(Boolean);

    // === 1. CAREER PATH MATCH (30 điểm) ===
    let careerScore = 0;
    const studentCareerPaths = (careerPref?.careerPaths || []).map(p => p.toLowerCase());

    if (studentCareerPaths.length > 0) {
      if (studentCareerPaths.some(cp => this._fuzzyMatch(cp, roadmapCareerPath))) {
        careerScore = 30;
        strengths.push(`Hướng "${roadmap.careerPath}" khớp với sở thích nghề nghiệp`);
      } else {
        const keywords = this._extractKeywords(roadmapCareerPath);
        const matched = keywords.filter(kw =>
          studentCareerPaths.some(cp => cp.includes(kw) || kw.includes(cp.split(' ')[0]))
        );
        careerScore = Math.min(30, matched.length * 8);
        if (careerScore > 0) {
          strengths.push('Lộ trình liên quan đến lĩnh vực bạn quan tâm');
        } else {
          gaps.push(`Hướng "${roadmap.careerPath}" không nằm trong danh sách ưu tiên`);
        }
      }
    } else {
      careerScore = 15;
      gaps.push('Cập nhật sở thích nghề nghiệp để nhận gợi ý chính xác hơn');
    }
    details.careerPath = careerScore;
    totalScore += careerScore;

    // === 2. SKILL MATCH (25 điểm) — Skill Map (request_ai.md 1.1g) ===
    let skillScore = 0;

    if (roadmapSkillNames.length > 0 && mySkillSet.size > 0) {
      const matchedSkills = roadmapSkillNames.filter(rSkill =>
        [...mySkillSet].some(ss => ss.includes(rSkill.split(' ')[0]) || rSkill.includes(ss.split(' ')[0]))
      );
      const coverageRatio = matchedSkills.length / roadmapSkillNames.length;
      skillScore = Math.round(coverageRatio * 25);

      if (matchedSkills.length > 0) {
        strengths.push(`Bạn đã có ${matchedSkills.length}/${roadmapSkillNames.length} kỹ năng: ${matchedSkills.slice(0, 3).join(', ')}`);
      }

      const uncovered = roadmapSkillNames.filter(s => !matchedSkills.includes(s));
      if (uncovered.length > 0 && uncovered.length <= 4) {
        gaps.push(`Cần bổ sung: ${uncovered.slice(0, 3).join(', ')}`);
      }
    } else if (mySkillSet.size === 0) {
      // Fallback: dùng course keywords nếu chưa có Skill Map
      const courseKeywords = this._extractCourseKeywords(academicProfile?.courseGrades || []);
      if (courseKeywords.size > 0) {
        const matched = roadmapSkillNames.filter(rSkill =>
          [...courseKeywords].some(kw => rSkill.includes(kw) || kw.includes(rSkill.split(' ')[0]))
        );
        skillScore = Math.round((matched.length / Math.max(roadmapSkillNames.length, 1)) * 20);
        if (matched.length > 0) strengths.push(`Nền tảng học tập liên quan: ${matched.slice(0, 2).join(', ')}`);
      } else {
        skillScore = 10;
      }
    } else {
      skillScore = 10;
    }
    details.skillMatch = skillScore;
    totalScore += skillScore;

    // === 3. ACADEMIC MATCH (20 điểm) — Hồ sơ + Điểm HP (request_ai.md 1.1e,f) ===
    let academicScore = 0;
    const gpa = academicProfile?.gpa || 0;
    const completedCredits = academicProfile?.completedCredits || 0;
    const difficulty = roadmap.difficulty;

    const difficultyGpaMap = {
      beginner: { minGpa: 0, idealGpa: 2.0 },
      intermediate: { minGpa: 2.0, idealGpa: 2.5 },
      advanced: { minGpa: 2.5, idealGpa: 3.2 },
    };
    const config = difficultyGpaMap[difficulty] || difficultyGpaMap.intermediate;

    if (gpa === 0 && completedCredits === 0) {
      academicScore = 10;
      gaps.push('Nhập điểm HP để nhận phân tích chính xác hơn');
    } else if (gpa >= config.idealGpa) {
      academicScore = 18;
      strengths.push(`GPA ${gpa.toFixed(2)} phù hợp lộ trình ${this._difficultyLabel(difficulty)}`);
    } else if (gpa >= config.minGpa) {
      academicScore = 14;
    } else {
      academicScore = 7;
      gaps.push(`GPA có thể thách thức với lộ trình ${this._difficultyLabel(difficulty)}`);
    }

    // Bonus: HP điểm cao liên quan (request_ai.md 1.1f)
    const highGradeCourses = this._getHighGradeCourses(academicProfile?.courseGrades || []);
    const relatedHighGrade = highGradeCourses.filter(courseName =>
      roadmapSkillNames.some(rSkill =>
        this._courseRelatesTo(courseName, rSkill)
      )
    );
    if (relatedHighGrade.length > 0) {
      academicScore = Math.min(20, academicScore + relatedHighGrade.length * 2);
      strengths.push(`Điểm cao ở HP liên quan: ${relatedHighGrade.slice(0, 2).join(', ')}`);
    }

    if (completedCredits >= 60) academicScore = Math.min(20, academicScore + 2);
    details.academic = academicScore;
    totalScore += academicScore;

    // === 4. MARKET FIT (15 điểm) — Lương + Khu vực + Công ty (request_ai.md 1.1b,c,d) ===
    let marketScore = 0;

    // 4a. Khu vực → career demand
    const preferredLocations = (careerPref?.preferredLocations || []).map(l => l.toLowerCase());
    if (preferredLocations.length > 0 && marketData.locationCareerMap) {
      for (const loc of preferredLocations) {
        const locKey = this._normalizeLocation(loc);
        const careerDemand = marketData.locationCareerMap[locKey] || {};
        if (careerDemand[roadmapCareerPath] > 0) {
          marketScore += 5;
          strengths.push(`Khu vực ${loc} đang tuyển nhiều "${roadmap.careerPath}"`);
          break;
        }
      }
    }

    // 4b. Mức lương → career phù hợp
    const expectedSalary = careerPref?.expectedSalary?.min || 0;
    if (expectedSalary > 0 && marketData.salaryByCareer) {
      const careerSalaries = marketData.salaryByCareer[roadmapCareerPath] || [];
      if (careerSalaries.length > 0) {
        const avgSalary = careerSalaries.reduce((a, b) => a + b, 0) / careerSalaries.length;
        if (avgSalary >= expectedSalary) {
          marketScore += 5;
          strengths.push(`Nghề "${roadmap.careerPath}" có mức lương trung bình ~${Math.round(avgSalary)}tr`);
        }
      }
    }

    // 4c. Công ty quan tâm
    const interestedCompanies = (careerPref?.interestedCompanies || []).map(c => c.toLowerCase());
    if (interestedCompanies.length > 0 && marketData.companyCareerMap) {
      for (const company of interestedCompanies) {
        const compCareers = marketData.companyCareerMap[company] || [];
        if (compCareers.some(cc => this._fuzzyMatch(cc, roadmapCareerPath))) {
          marketScore += 5;
          strengths.push(`${company} đang tuyển vị trí liên quan "${roadmap.careerPath}"`);
          break;
        }
      }
    }

    marketScore = Math.min(15, marketScore);
    if (marketScore === 0 && preferredLocations.length === 0 && expectedSalary === 0) {
      marketScore = 7; // Chưa đủ dữ liệu
    }
    details.marketFit = marketScore;
    totalScore += marketScore;

    // === 5. DURATION FIT (10 điểm) ===
    let durationScore = 0;
    const estimatedMonths = roadmap.estimatedMonths || 6;
    const currentSemester = academicProfile?.currentSemester || 1;
    const preferredDuration = currentSemester <= 4 ? 12 : currentSemester <= 6 ? 9 : 6;

    if (estimatedMonths <= preferredDuration) {
      durationScore = 10;
      strengths.push(`Thời lượng ${estimatedMonths} tháng phù hợp giai đoạn học`);
    } else {
      durationScore = 5;
    }
    details.duration = durationScore;
    totalScore += durationScore;

    return { totalScore, details, strengths, gaps };
  }

  /** HP điểm cao (>= 7.0) */
  _getHighGradeCourses(courseGrades) {
    const gradeToNum = { 'A+': 9.5, 'A': 9.0, 'B+': 8.0, 'B': 7.0, 'C+': 6.5, 'C': 5.5, 'D+': 5.0, 'D': 4.0, 'F': 0 };
    return (courseGrades || [])
      .filter(cg => {
        const num = gradeToNum[cg.grade] || parseFloat(cg.grade) || 0;
        return num >= 7.0;
      })
      .map(cg => (cg.course?.name || '').toLowerCase())
      .filter(Boolean);
  }

  /** Kiểm tra HP có liên quan đến skill hay không */
  _courseRelatesTo(courseName, skillName) {
    const cn = courseName.toLowerCase();
    const sn = skillName.toLowerCase();
    // Direct keyword match
    if (cn.includes(sn.split(' ')[0]) || sn.includes(cn.split(' ')[0])) return true;
    // Keyword mapping
    const map = {
      web: ['html', 'css', 'javascript', 'frontend', 'backend', 'react', 'node'],
      'phát triển ứng dụng web': ['html', 'css', 'javascript', 'frontend', 'react'],
      database: ['sql', 'mongodb', 'database'],
      'cơ sở dữ liệu': ['sql', 'mongodb', 'database'],
      network: ['network', 'devops', 'docker'],
      'mạng máy tính': ['network', 'devops'],
      'trí tuệ nhân tạo': ['ai', 'machine learning', 'deep learning', 'python'],
      'machine learning': ['ai', 'python', 'tensorflow', 'pytorch'],
      mobile: ['android', 'ios', 'react native', 'flutter'],
    };
    for (const [key, related] of Object.entries(map)) {
      if (cn.includes(key) && related.some(r => sn.includes(r))) return true;
    }
    return false;
  }

  /** Normalize location cho matching */
  _normalizeLocation(loc) {
    return loc
      .replace(/tp\.\s*/gi, '')
      .replace(/thành phố\s*/gi, '')
      .replace(/tỉnh\s*/gi, '')
      .trim()
      .toLowerCase();
  }

  _fuzzyMatch(a, b) {
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
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
    return str.toLowerCase().split(/[\s\-_,\/()]+/).filter(w => w.length > 2 && !stopWords.has(w));
  }

  _extractCourseKeywords(courseGrades) {
    const keywords = new Set();
    const courseKeywordMap = {
      python: ['python', 'machine learning', 'data science', 'ai'],
      javascript: ['javascript', 'frontend', 'web', 'node', 'react'],
      java: ['java', 'backend', 'spring', 'android'],
      'c++': ['c++', 'algorithm', 'embedded'],
      database: ['sql', 'database', 'mongodb', 'data'],
      web: ['frontend', 'backend', 'fullstack', 'html', 'css'],
      network: ['network', 'cybersecurity', 'devops'],
      ai: ['ai', 'machine learning', 'deep learning'],
      mobile: ['mobile', 'android', 'ios', 'flutter'],
    };
    (courseGrades || []).forEach(cg => {
      const courseName = (cg.course?.name || '').toLowerCase();
      for (const [keyword, related] of Object.entries(courseKeywordMap)) {
        if (courseName.includes(keyword)) related.forEach(r => keywords.add(r));
      }
      this._extractKeywords(courseName).forEach(kw => keywords.add(kw));
    });
    return keywords;
  }

  _difficultyLabel(d) {
    return { beginner: 'cơ bản', intermediate: 'trung bình', advanced: 'nâng cao' }[d] || d;
  }
}

module.exports = new RoadmapSuggestionService();

/**
 * Roadmap Suggestion Service — Hybrid CB + CF
 *
 * Content-Based (CB) — 100 điểm:
 *   1. Career Path Match  (30đ)
 *   2. Skill Match        (25đ)
 *   3. Academic Match     (20đ)
 *   4. Market Fit         (15đ)
 *   5. Duration Fit       (10đ)
 *
 * Collaborative Filtering (CF) — bonus tối đa 20đ:
 *   - Tìm SV có profile tương tự (career paths + skill overlap)
 *   - Xem lộ trình họ đã enroll và tiến độ thực tế
 *   - Cộng CF bonus → tổng max 120 → normalize về 100
 */
const AcademicProfile = require('../models/AcademicProfile');
const CareerPreference = require('../models/CareerPreference');
const PersonalRoadmap = require('../models/PersonalRoadmap');
const StudentSkill = require('../models/StudentSkill');
const Roadmap = require('../models/Roadmap');
const JobPosting = require('../models/JobPosting');

class RoadmapSuggestionService {
  /**
   * Gợi ý lộ trình — Hybrid CB + CF
   */
  async suggestRoadmaps(studentId) {
    const studentIdStr = studentId.toString();

    const [academicProfile, careerPref, enrolledRoadmaps, studentSkills, allRoadmaps, marketData] =
      await Promise.all([
        AcademicProfile.findOne({ student: studentId })
          .populate('courseGrades.course', 'name keywords relatedSkills courseType'),
        CareerPreference.findOne({ student: studentId }),
        PersonalRoadmap.find({ student: studentId, status: { $ne: 'cancelled' } }).select('roadmap'),
        StudentSkill.find({ student: studentId }).populate('skill', 'name category keywords'),
        Roadmap.find({ isActive: true })
          .populate('skills.skill', 'name category keywords')
          .lean(),
        this._getMarketData(),
      ]);

    const enrolledIds = new Set(enrolledRoadmaps.map(r => r.roadmap.toString()));

    const mySkillSet = new Set(
      studentSkills.filter(ss => ss.skill?.name).map(ss => ss.skill.name.toLowerCase())
    );
    const mySkillCategories = new Set(
      studentSkills.filter(ss => ss.skill?.category).map(ss => ss.skill.category.toLowerCase())
    );
    const studentCareerPaths = (careerPref?.careerPaths || []).map(p => p.toLowerCase());

    // Kiểm tra SV có dữ liệu hay chưa
    const hasCareer = studentCareerPaths.length > 0;
    const hasSkills = mySkillSet.size > 0;
    const hasAcademic = (academicProfile?.gpa || 0) > 0 || (academicProfile?.completedCredits || 0) > 0;
    const hasData = hasCareer || hasSkills || hasAcademic;

    // === Collaborative Filtering ===
    const cfScores = await this._getCollaborativeScores(
      studentIdStr, studentCareerPaths, mySkillSet, allRoadmaps
    );

    // Tính CB score + CF bonus → normalize về 100
    const suggestions = allRoadmaps.map(roadmap => {
      const analysis = this._analyzeMatch(
        roadmap, academicProfile, careerPref, mySkillSet, mySkillCategories, marketData
      );

      const cbScore = analysis.totalScore;           // max 100
      const cfBonus = cfScores[roadmap._id.toString()] || 0; // max 20
      const rawTotal = cbScore + cfBonus;
      const matchScore = Math.min(100, Math.round(rawTotal * (100 / 120)));

      return {
        roadmap,
        matchScore,
        cbScore,
        cfBonus,
        matchDetails: analysis.details,
        strengths: analysis.strengths,
        gaps: analysis.gaps,
        isEnrolled: enrolledIds.has(roadmap._id.toString()),
      };
    });

    return {
      hasData,
      dataSources: { hasCareer, hasSkills, hasAcademic },
      suggestions: suggestions
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5),
    };
  }

  /**
   * CF: Tìm SV tương tự → xem lộ trình họ enroll → tính bonus score
   * Graceful fallback: nếu DB ít SV → trả {} (CF = 0, chỉ dùng CB)
   */
  async _getCollaborativeScores(studentIdStr, myCareerPaths, mySkillSet, allRoadmaps) {
    try {
      const similarStudents = await this._findSimilarStudents(
        studentIdStr, myCareerPaths, mySkillSet
      );
      console.log(`[CF Roadmap] Found ${similarStudents.length} similar students`);
      if (similarStudents.length === 0) return {};

      const similarIds = similarStudents.map(s => s.studentId);

      // Lấy các lộ trình mà SV tương tự đã enroll
      const theirRoadmaps = await PersonalRoadmap.find({
        student: { $in: similarIds },
        status: { $in: ['active', 'completed'] },
      }).select('roadmap progress student').lean();

      console.log(`[CF Roadmap] Similar students enrolled in ${theirRoadmaps.length} roadmaps`);

      if (theirRoadmaps.length === 0) return {};

      // Tính CF score cho mỗi roadmap
      const cfMap = {};
      for (const pr of theirRoadmaps) {
        const rid = pr.roadmap.toString();
        const sid = pr.student.toString();
        const sim = similarStudents.find(s => s.studentId === sid);
        const simWeight = sim?.similarityScore || 0.5;

        if (!cfMap[rid]) cfMap[rid] = { totalWeight: 0, count: 0 };
        cfMap[rid].totalWeight += simWeight * Math.max(pr.progress || 10, 10) / 100;
        cfMap[rid].count += 1;
      }

      // Normalize CF bonus về 0-20
      const maxWeight = Math.max(...Object.values(cfMap).map(v => v.totalWeight), 0.001);
      const cfScores = {};
      for (const [rid, val] of Object.entries(cfMap)) {
        cfScores[rid] = Math.round((val.totalWeight / maxWeight) * 20);
      }

      console.log('[CF Roadmap] CF scores:', cfScores);
      return cfScores;
    } catch (err) {
      console.error('[CF Roadmap] fallback to CB only:', err.message);
      return {};
    }
  }

  /**
   * Tìm SV có career paths + skill set tương tự
   * Trả về: [{ studentId, similarityScore }]
   */
  async _findSimilarStudents(studentIdStr, myCareerPaths, mySkillSet) {
    if (myCareerPaths.length === 0 && mySkillSet.size === 0) return [];

    // Lấy tất cả SV khác có CareerPreference
    const otherPrefs = await require('../models/CareerPreference')
      .find({})
      .select('student careerPaths')
      .lean();

    const candidates = otherPrefs.filter(p => p.student.toString() !== studentIdStr);
    if (candidates.length === 0) return [];

    const similar = [];
    for (const pref of candidates) {
      const theirPaths = (pref.careerPaths || []).map(p => p.toLowerCase());

      // Career overlap
      const careerOverlap = myCareerPaths.filter(cp => theirPaths.includes(cp)).length;
      const careerSim = myCareerPaths.length > 0
        ? careerOverlap / Math.max(myCareerPaths.length, theirPaths.length)
        : 0;

      // Skill overlap (nếu có skills)
      let skillSim = 0;
      if (mySkillSet.size > 0) {
        const theirSkills = await StudentSkill.find({ student: pref.student })
          .select('skill').populate('skill', 'name').lean();
        const theirSkillNames = new Set(
          theirSkills.map(ss => (ss.skill?.name || '').toLowerCase()).filter(Boolean)
        );
        const intersection = [...mySkillSet].filter(s => theirSkillNames.has(s)).length;
        const union = new Set([...mySkillSet, ...theirSkillNames]).size;
        skillSim = union > 0 ? intersection / union : 0; // Jaccard similarity
      }

      const totalSim = (careerSim * 0.6) + (skillSim * 0.4);
      // Hạ ngưỡng xuống 0.15 để tìm được SV tương tự
      if (totalSim >= 0.15) {
        similar.push({ studentId: pref.student.toString(), similarityScore: totalSim });
      }
    }

    return similar
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 20); // Top 20 SV tương tự
  }

  /**
   * Phân tích thị trường từ Job Postings
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

      const locationCareerMap = {};
      const salaryByCareer = {};
      const companyCareerMap = {};
      const skillDemand = {};

      jobs.forEach(job => {
        const career = (job.careerPath || '').toLowerCase();
        const location = (job.locationText || '').toLowerCase();
        const company = (job.company?.name || '').toLowerCase();

        if (location && career) {
          const locKey = this._normalizeLocation(location);
          if (!locationCareerMap[locKey]) locationCareerMap[locKey] = {};
          locationCareerMap[locKey][career] = (locationCareerMap[locKey][career] || 0) + 1;
        }
        if (career && job.salaryRange?.max) {
          if (!salaryByCareer[career]) salaryByCareer[career] = [];
          salaryByCareer[career].push(job.salaryRange.max);
        }
        if (company && career) {
          if (!companyCareerMap[company]) companyCareerMap[company] = new Set();
          companyCareerMap[company].add(career);
        }
        (job.requiredSkills || []).forEach(rs => {
          const name = (rs.skill?.name || '').toLowerCase();
          if (name) skillDemand[name] = (skillDemand[name] || 0) + 1;
        });
      });

      for (const key of Object.keys(companyCareerMap)) {
        companyCareerMap[key] = [...companyCareerMap[key]];
      }

      return { locationCareerMap, salaryByCareer, companyCareerMap, skillDemand };
    } catch {
      return { locationCareerMap: {}, salaryByCareer: {}, companyCareerMap: {}, skillDemand: {} };
    }
  }

  /**
   * Phân tích CB — 5 nhóm tiêu chí (100 điểm)
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

    // === 1. CAREER PATH MATCH (30đ) ===
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
      careerScore = 0; // Không có career prefs → 0 thay vì 15
      gaps.push('Cập nhật sở thích nghề nghiệp để nhận gợi ý chính xác hơn');
    }
    details.careerPath = careerScore;
    totalScore += careerScore;

    // === 2. SKILL MATCH (25đ) ===
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
      const courseKeywords = this._extractCourseKeywords(academicProfile?.courseGrades || []);
      if (courseKeywords.size > 0) {
        const matched = roadmapSkillNames.filter(rSkill =>
          [...courseKeywords].some(kw => rSkill.includes(kw) || kw.includes(rSkill.split(' ')[0]))
        );
        skillScore = Math.round((matched.length / Math.max(roadmapSkillNames.length, 1)) * 20);
        if (matched.length > 0) strengths.push(`Nền tảng học tập liên quan: ${matched.slice(0, 2).join(', ')}`);
      } else {
        skillScore = 0; // Không có skills + không có courseKeywords → 0
        gaps.push('Khai báo kỹ năng để nhận phân tích chính xác');
      }
    } else {
      skillScore = 0; // roadmapSkillNames rỗng — hiếm gặp
    }
    details.skillMatch = skillScore;
    totalScore += skillScore;

    // === 3. ACADEMIC MATCH (20đ) ===
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
      academicScore = 3; // Tối thiểu thay vì 10
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

    const highGradeCourses = this._getHighGradeCourses(academicProfile?.courseGrades || []);
    const relatedHighGrade = highGradeCourses.filter(courseName =>
      roadmapSkillNames.some(rSkill => this._courseRelatesTo(courseName, rSkill))
    );
    if (relatedHighGrade.length > 0) {
      academicScore = Math.min(20, academicScore + relatedHighGrade.length * 2);
      strengths.push(`Điểm cao ở HP liên quan: ${relatedHighGrade.slice(0, 2).join(', ')}`);
    }
    if (completedCredits >= 60) academicScore = Math.min(20, academicScore + 2);
    details.academic = academicScore;
    totalScore += academicScore;

    // === 4. MARKET FIT (15đ) ===
    let marketScore = 0;
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

    const expectedSalary = careerPref?.expectedSalary?.min || 0;
    if (expectedSalary > 0 && marketData.salaryByCareer) {
      const careerSalaries = marketData.salaryByCareer[roadmapCareerPath] || [];
      if (careerSalaries.length > 0) {
        const avgSalary = careerSalaries.reduce((a, b) => a + b, 0) / careerSalaries.length;
        if (avgSalary >= expectedSalary) {
          marketScore += 5;
          strengths.push(`Nghề "${roadmap.careerPath}" lương trung bình ~${Math.round(avgSalary)}tr`);
        }
      }
    }

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
      marketScore = 2; // Không có data thị trường → 2 thay vì 7
    }
    details.marketFit = marketScore;
    totalScore += marketScore;

    // === 5. DURATION FIT (10đ) ===
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

  // ─── Helpers ────────────────────────────────────────────────────────────────

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

  _courseRelatesTo(courseName, skillName) {
    const cn = courseName.toLowerCase();
    const sn = skillName.toLowerCase();
    if (cn.includes(sn.split(' ')[0]) || sn.includes(cn.split(' ')[0])) return true;
    const map = {
      'web': ['html', 'css', 'javascript', 'frontend', 'backend', 'react', 'node'],
      'phát triển ứng dụng web': ['html', 'css', 'javascript', 'frontend', 'react'],
      'database': ['sql', 'mongodb', 'database'],
      'cơ sở dữ liệu': ['sql', 'mongodb', 'database'],
      'network': ['network', 'devops', 'docker'],
      'mạng máy tính': ['network', 'devops'],
      'trí tuệ nhân tạo': ['ai', 'machine learning', 'deep learning', 'python'],
      'machine learning': ['ai', 'python', 'tensorflow', 'pytorch'],
      'mobile': ['android', 'ios', 'react native', 'flutter'],
    };
    for (const [key, related] of Object.entries(map)) {
      if (cn.includes(key) && related.some(r => sn.includes(r))) return true;
    }
    return false;
  }

  _normalizeLocation(loc) {
    return loc
      .replace(/tp\.\s*/gi, '')
      .replace(/thành phố\s*/gi, '')
      .replace(/tỉnh\s*/gi, '')
      .trim()
      .toLowerCase();
  }

  _fuzzyMatch(a, b) {
    if (!a || !b) return false;
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
    return wordsA.filter(w => wordsB.includes(w)).length >= 1;
  }

  _extractKeywords(str) {
    const stopWords = new Set([
      'developer', 'engineer', 'senior', 'junior', 'intern', 'lead',
      'manager', 'specialist', 'analyst', 'designer', 'consultant',
      'architect', 'technician', 'officer', 'admin', 'expert',
    ]);
    return (str || '').toLowerCase().split(/[\s\-_,\/()]+/).filter(w => w.length > 2 && !stopWords.has(w));
  }

  _extractCourseKeywords(courseGrades) {
    const keywords = new Set();
    const map = {
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
      for (const [keyword, related] of Object.entries(map)) {
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

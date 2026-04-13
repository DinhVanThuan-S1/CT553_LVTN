/**
 * Job Suggestion Service — Hybrid CB + CF
 *
 * Content-Based (CB) — 100 điểm:
 *   1. Career Path Match  (30đ)
 *   2. Skill Match        (25đ)
 *   3. Job Type Match     (15đ)
 *   4. Salary Fit         (10đ)
 *   5. Location Match     (10đ)
 *   6. Academic Fit       (10đ)
 *
 * Collaborative Filtering (CF) — bonus tối đa 15đ:
 *   - Tìm SV có career paths + skills tương tự
 *   - Lấy jobs họ đã ứng tuyển
 *   - Cộng CF bonus → tổng max 115 → normalize về 100
 */
const AcademicProfile = require('../models/AcademicProfile');
const CareerPreference = require('../models/CareerPreference');
const PersonalRoadmap = require('../models/PersonalRoadmap');
const StudentSkill = require('../models/StudentSkill');
const JobPosting = require('../models/JobPosting');
const Application = require('../models/Application');

class JobSuggestionService {
  /**
   * Gợi ý công việc — Hybrid CB + CF
   */
  async suggestJobs(studentId) {
    const studentIdStr = studentId.toString();

    const [academicProfile, careerPref, personalRoadmaps, studentSkills, activeJobs] =
      await Promise.all([
        AcademicProfile.findOne({ student: studentId })
          .populate('courseGrades.course', 'name keywords'),
        CareerPreference.findOne({ student: studentId }),
        PersonalRoadmap.find({ student: studentId, status: { $ne: 'cancelled' } })
          .populate('roadmap', 'careerPath')
          .populate('sessions.skill', 'name category'),
        StudentSkill.find({ student: studentId }).populate('skill', 'name category'),
        JobPosting.find({ status: 'approved', deadline: { $gte: new Date() } })
          .populate('company', 'name logo')
          .populate('requiredSkills.skill', 'name category')
          .populate('location', 'city province')
          .sort('-createdAt')
          .limit(50)
          .lean(),
      ]);

    const allSkills = this._mergeStudentSkills(personalRoadmaps, studentSkills);
    const studentCareerPaths = (careerPref?.careerPaths || []).map(p => p.toLowerCase());

    // === Collaborative Filtering ===
    const cfScores = await this._getCollaborativeScores(
      studentIdStr, studentCareerPaths, allSkills.skills
    );

    // Kiểm tra data
    const hasCareer = studentCareerPaths.length > 0;
    const hasSkills = allSkills.skills.size > 0;
    const hasAcademic = (academicProfile?.gpa || 0) > 0;
    const hasData = hasCareer || hasSkills || hasAcademic;

    const suggestions = activeJobs.map(job => {
      const analysis = this._analyzeJobMatch(job, academicProfile, careerPref, allSkills);

      const cbScore = analysis.totalScore;
      const cfBonus = cfScores[job._id.toString()] || 0;
      const rawTotal = cbScore + cfBonus;
      const matchScore = Math.min(100, Math.round(rawTotal * (100 / 115)));

      return {
        job,
        matchScore,
        cbScore,
        cfBonus,
        matchDetails: analysis.details,
        strengths: analysis.strengths,
        gaps: analysis.gaps,
      };
    });

    return {
      hasData,
      suggestions: suggestions
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10),
    };
  }

  /**
   * CF: Tìm SV tương tự → xem jobs họ đã apply → bonus score
   */
  async _getCollaborativeScores(studentIdStr, myCareerPaths, mySkillSet) {
    try {
      const similarStudents = await this._findSimilarStudents(
        studentIdStr, myCareerPaths, mySkillSet
      );
      console.log(`[CF Jobs] Found ${similarStudents.length} similar students`);
      if (similarStudents.length === 0) return {};

      const similarIds = similarStudents.map(s => s.studentId);

      // Lấy applications của SV tương tự
      const theirApps = await Application.find({
        student: { $in: similarIds },
      }).select('student jobPosting').lean();

      // Tính CF score
      const cfMap = {};
      for (const app of theirApps) {
        const jid = app.jobPosting.toString();
        const sid = app.student.toString();
        const sim = similarStudents.find(s => s.studentId === sid);
        const simWeight = sim?.similarityScore || 0.5;

        if (!cfMap[jid]) cfMap[jid] = { totalWeight: 0, count: 0 };
        cfMap[jid].totalWeight += simWeight;
        cfMap[jid].count += 1;
      }

      // Normalize CF bonus về 0-15
      const maxWeight = Math.max(...Object.values(cfMap).map(v => v.totalWeight), 0.001);
      const cfScores = {};
      for (const [jid, val] of Object.entries(cfMap)) {
        cfScores[jid] = Math.round((val.totalWeight / maxWeight) * 15);
      }

      return cfScores;
    } catch (err) {
      console.error('[CF Jobs] fallback to CB only:', err.message);
      return {};
    }
  }

  /**
   * Tìm SV tương tự theo Jaccard (career + skill)
   */
  async _findSimilarStudents(studentIdStr, myCareerPaths, mySkillSet) {
    if (myCareerPaths.length === 0 && mySkillSet.size === 0) return [];

    const otherPrefs = await CareerPreference.find({}).select('student careerPaths').lean();
    const candidates = otherPrefs.filter(p => p.student.toString() !== studentIdStr);
    if (candidates.length === 0) return [];

    const similar = [];
    for (const pref of candidates) {
      const theirPaths = (pref.careerPaths || []).map(p => p.toLowerCase());
      const careerOverlap = myCareerPaths.filter(cp => theirPaths.includes(cp)).length;
      const careerSim = myCareerPaths.length > 0
        ? careerOverlap / Math.max(myCareerPaths.length, theirPaths.length)
        : 0;

      let skillSim = 0;
      if (mySkillSet.size > 0) {
        const theirSkills = await StudentSkill.find({ student: pref.student })
          .select('skill').populate('skill', 'name').lean();
        const theirSkillNames = new Set(
          theirSkills.map(ss => (ss.skill?.name || '').toLowerCase()).filter(Boolean)
        );
        const intersection = [...mySkillSet].filter(s => theirSkillNames.has(s)).length;
        const union = new Set([...mySkillSet, ...theirSkillNames]).size;
        skillSim = union > 0 ? intersection / union : 0;
      }

      const totalSim = (careerSim * 0.6) + (skillSim * 0.4);
      if (totalSim >= 0.15) {
        similar.push({ studentId: pref.student.toString(), similarityScore: totalSim });
      }
    }

    return similar
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 20);
  }

  /**
   * Merge kỹ năng từ Skill Map + Lộ trình cá nhân
   */
  _mergeStudentSkills(personalRoadmaps, studentSkills) {
    const skills = new Set();
    const careerPaths = new Set();

    (studentSkills || []).forEach(ss => {
      if (ss.skill?.name) skills.add(ss.skill.name.toLowerCase());
    });

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

    // === 1. CAREER PATH MATCH (30đ) ===
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
        // Fallback: group-based matching
        let matchCount = 0;
        const jobGroup = this._getCareerGroup(jobCareerPath);

        for (const cp of allCareerPaths) {
          const cpGroup = this._getCareerGroup(cp);
          if (cpGroup && jobGroup && cpGroup === jobGroup) {
            matchCount++;
          } else {
            const jobWords = this._extractKeywords(jobCareerPath + ' ' + jobTitle);
            const cpWords = this._extractKeywords(cp);
            if (jobWords.some(jw => cpWords.includes(jw))) matchCount++;
          }
        }

        careerScore = Math.min(30, matchCount * 10);
        if (careerScore === 0) gaps.push('Không khớp hướng nghề nghiệp ưu tiên');
      }
    } else {
      careerScore = 0;
      gaps.push('Cập nhật sở thích nghề nghiệp để gợi ý chính xác hơn');
    }
    details.careerPath = careerScore;
    totalScore += careerScore;

    // === 2. SKILL MATCH (25đ) ===
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
        .slice(0, 3).map(s => s.skill?.name).filter(Boolean);
      if (unmatched.length) gaps.push(`Cần bổ sung: ${unmatched.join(', ')}`);
    } else if (requiredSkills.length === 0) {
      skillScore = 17;
      strengths.push('Không yêu cầu kỹ năng đặc biệt');
    } else {
      skillScore = 0;
      gaps.push('Khai báo kỹ năng hoặc đăng ký lộ trình để tích lũy');
    }
    details.skillMatch = skillScore;
    totalScore += skillScore;

    // === 3. JOB TYPE MATCH (15đ) ===
    let typeScore = 0;
    const preferredTypes = careerPref?.jobTypes || [];
    if (preferredTypes.length === 0) {
      typeScore = 3;
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

    // === 4. SALARY FIT (10đ) ===
    let salaryScore = 0;
    const expectedMin = careerPref?.expectedSalary?.min || 0;
    const expectedMax = careerPref?.expectedSalary?.max || 0;
    const jobMin = job.salaryRange?.min || 0;
    const jobMax = job.salaryRange?.max || 0;

    if (job.salaryRange?.isNegotiable) {
      salaryScore = 7;
      strengths.push('Mức lương thương lượng');
    } else if (expectedMin === 0) {
      salaryScore = 2;
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

    // === 5. LOCATION MATCH (10đ) ===
    let locationScore = 0;
    const preferredLocations = (careerPref?.preferredLocations || []).map(l => l.toLowerCase());
    const jobLocation = (job.locationText || '').toLowerCase();

    if (preferredLocations.length === 0) {
      locationScore = 2;
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

    // === 6. ACADEMIC FIT (10đ) ===
    let academicScore = 0;
    const gpa = academicProfile?.gpa || 0;
    if (gpa >= 3.2) academicScore = 10;
    else if (gpa >= 2.5) academicScore = 7;
    else if (gpa > 0) academicScore = 4;
    else academicScore = 2;
    details.academic = academicScore;
    totalScore += academicScore;

    return { totalScore, details, strengths, gaps };
  }

  // Bảng nhóm nghề — mỗi career path map về 1 nhóm duy nhất
  static CAREER_GROUPS = {
    'qa/tester': ['qa', 'tester', 'testing', 'quality assurance', 'kiểm thử', 'qa engineer', 'qa tester'],
    'frontend developer': ['frontend', 'front-end', 'web frontend'],
    'backend developer': ['backend', 'back-end', 'web backend'],
    'full-stack developer': ['fullstack', 'full-stack', 'full stack'],
    'mobile developer': ['mobile', 'react native', 'flutter', 'android developer', 'ios developer'],
    'data engineer': ['data engineer', 'data engineering', 'etl', 'big data'],
    'data scientist': ['data scientist', 'data science', 'data analytics'],
    'ai/ml engineer': ['ai engineer', 'ml engineer', 'ai/ml', 'deep learning', 'artificial intelligence'],
    'devops engineer': ['devops', 'sre', 'infrastructure'],
    'ui/ux designer': ['ui/ux', 'ui designer', 'ux designer'],
    'project manager': ['project management', 'scrum master', 'quản lý dự án'],
    'business analyst': ['business analysis', 'phân tích nghiệp vụ'],
    'cybersecurity engineer': ['cybersecurity', 'security engineer', 'bảo mật', 'infosec'],
    'game developer': ['game development', 'game programmer', 'unity developer', 'unreal developer'],
    'embedded systems': ['embedded engineer', 'embedded', 'iot engineer', 'nhúng', 'firmware'],
    'java developer': ['java backend', 'spring boot developer'],
    'python developer': ['python backend', 'django developer', 'flask developer'],
    'ios developer': ['ios', 'swift developer'],
    'android developer': ['android', 'kotlin developer'],
  };

  static IMPORTANT_SHORT_WORDS = new Set([
    'qa', 'ai', 'ml', 'ui', 'ux', 'pm', 'ba', 'ci', 'cd', 'db', 'it', 'se',
    'api', 'web', 'app', 'ios', 'sre', 'etl', 'nlp', 'iot',
  ]);

  _getCareerGroup(careerPath) {
    const cp = careerPath.toLowerCase().trim();
    for (const [groupKey, synonyms] of Object.entries(JobSuggestionService.CAREER_GROUPS)) {
      if (cp === groupKey) return groupKey;
      if (cp.includes(groupKey) || groupKey.includes(cp)) return groupKey;
      if (synonyms.some(s => cp === s || cp.includes(s) || s.includes(cp))) return groupKey;
    }
    return null;
  }

  _fuzzyMatch(a, b) {
    if (!a || !b) return false;
    const la = a.toLowerCase().trim();
    const lb = b.toLowerCase().trim();

    if (la === lb) return true;
    if (la.includes(lb) || lb.includes(la)) return true;

    // Group-based match
    const groupA = this._getCareerGroup(la);
    const groupB = this._getCareerGroup(lb);
    if (groupA && groupB && groupA === groupB) return true;

    // Word overlap fallback
    const stopWords = new Set([
      'developer', 'engineer', 'senior', 'junior', 'intern', 'lead',
      'specialist', 'consultant', 'architect', 'technician', 'officer', 'expert',
      'manager', 'analyst', 'designer',
    ]);
    const wordsA = this._tokenize(la).filter(w => !stopWords.has(w));
    const wordsB = this._tokenize(lb).filter(w => !stopWords.has(w));
    if (wordsA.length === 0 || wordsB.length === 0) return false;
    return wordsA.some(w => wordsB.includes(w));
  }

  _getSynonyms(careerPath) {
    const cp = careerPath.toLowerCase();
    const group = this._getCareerGroup(cp);
    if (group) {
      return [group, ...(JobSuggestionService.CAREER_GROUPS[group] || [])];
    }
    return [cp];
  }

  _tokenize(str) {
    return (str || '').toLowerCase()
      .split(/[\s\-_,\/()]+/)
      .filter(w => w.length >= 2 && (w.length > 2 || JobSuggestionService.IMPORTANT_SHORT_WORDS.has(w)));
  }

  _extractKeywords(str) {
    const stopWords = new Set([
      'developer', 'engineer', 'senior', 'junior', 'intern', 'lead',
      'specialist', 'consultant', 'architect', 'technician', 'officer', 'expert',
    ]);
    return this._tokenize(str).filter(w => !stopWords.has(w));
  }
}

module.exports = new JobSuggestionService();

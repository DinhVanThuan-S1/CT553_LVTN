/**
 * Roadmap Suggestion Service
 * Smart matching: Phân tích hồ sơ học tập + sở thích nghề nghiệp → gợi ý lộ trình
 *
 * Thuật toán scoring:
 * 1. Career Path Match (40%) — hướng nghề nghiệp khớp với lộ trình
 * 2. Academic Level Match (30%) — GPA + tín chỉ tương ứng với độ khó lộ trình
 * 3. Skill Coverage (20%) — skills trong lộ trình liên quan đến học phần SV đã học
 * 4. Duration Match (10%) — độ dài lộ trình phù hợp với thời gian học còn lại
 */
const AcademicProfile = require('../models/AcademicProfile');
const CareerPreference = require('../models/CareerPreference');
const PersonalRoadmap = require('../models/PersonalRoadmap');
const Roadmap = require('../models/Roadmap');

class RoadmapSuggestionService {
  /**
   * Gợi ý lộ trình dựa trên hồ sơ SV
   * @param {string} studentId
   * @returns {Array} Danh sách lộ trình kèm matchScore và phân tích
   */
  async suggestRoadmaps(studentId) {
    // 1. Lấy dữ liệu đầu vào
    const [academicProfile, careerPref, enrolledRoadmaps, allRoadmaps] = await Promise.all([
      AcademicProfile.findOne({ student: studentId })
        .populate('courseGrades.course', 'name keywords relatedSkills courseType'),
      CareerPreference.findOne({ student: studentId }),
      PersonalRoadmap.find({ student: studentId, status: { $ne: 'cancelled' } }).select('roadmap'),
      Roadmap.find({ isActive: true })
        .populate('skills.skill', 'name category keywords')
        .lean(),
    ]);

    const enrolledIds = new Set(enrolledRoadmaps.map(r => r.roadmap.toString()));

    // 2. Tính score cho từng lộ trình
    const suggestions = allRoadmaps.map(roadmap => {
      const analysis = this._analyzeMatch(roadmap, academicProfile, careerPref);
      return {
        roadmap,
        matchScore: analysis.totalScore,
        matchDetails: analysis.details,
        strengths: analysis.strengths,
        gaps: analysis.gaps,
        isEnrolled: enrolledIds.has(roadmap._id.toString()),
      };
    });

    // 3. Sắp xếp theo điểm + loại trừ đã đăng ký
    return suggestions
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5); // Top 5
  }

  /**
   * Phân tích mức độ phù hợp chi tiết
   */
  _analyzeMatch(roadmap, academicProfile, careerPref) {
    const details = {};
    const strengths = [];
    const gaps = [];
    let totalScore = 0;

    // === 1. CAREER PATH MATCH (40 điểm) ===
    let careerScore = 0;
    const roadmapCareerPath = (roadmap.careerPath || '').toLowerCase();
    const studentCareerPaths = (careerPref?.careerPaths || []).map(p => p.toLowerCase());

    if (studentCareerPaths.length > 0) {
      // Exact match
      if (studentCareerPaths.some(cp => this._fuzzyMatch(cp, roadmapCareerPath))) {
        careerScore = 40;
        strengths.push(`Hướng "${roadmap.careerPath}" khớp với sở thích nghề nghiệp của bạn`);
      } else {
        // Partial keyword match
        const keywords = this._extractKeywords(roadmapCareerPath);
        const matchedKeywords = keywords.filter(kw =>
          studentCareerPaths.some(cp => cp.includes(kw) || kw.includes(cp.split(' ')[0]))
        );
        careerScore = Math.min(40, matchedKeywords.length * 10);
        if (careerScore > 0) {
          strengths.push(`Lộ trình liên quan đến lĩnh vực bạn quan tâm`);
        } else {
          gaps.push(`Hướng "${roadmap.careerPath}" không nằm trong danh sách nghề nghiệp ưu tiên`);
        }
      }
    } else {
      // Chưa cập nhật sở thích → cho điểm trung bình
      careerScore = 20;
      gaps.push('Hãy cập nhật sở thích nghề nghiệp để nhận gợi ý chính xác hơn');
    }
    details.careerPath = careerScore;
    totalScore += careerScore;

    // === 2. ACADEMIC LEVEL MATCH (30 điểm) ===
    let academicScore = 0;
    const gpa = academicProfile?.gpa || 0;
    const completedCredits = academicProfile?.completedCredits || 0;
    const difficulty = roadmap.difficulty;

    const difficultyGpaMap = {
      beginner: { minGpa: 0, idealGpa: 2.0 },
      intermediate: { minGpa: 2.0, idealGpa: 2.5 },
      advanced: { minGpa: 2.5, idealGpa: 3.2 },
    };
    const difficultyConfig = difficultyGpaMap[difficulty] || difficultyGpaMap.intermediate;

    // Scoring GPA
    if (gpa === 0 && completedCredits === 0) {
      // Chưa nhập điểm
      academicScore = 15;
      gaps.push('Nhập điểm học phần để nhận phân tích chính xác hơn');
    } else if (gpa >= difficultyConfig.idealGpa) {
      academicScore = 30;
      strengths.push(`GPA ${gpa.toFixed(2)} phù hợp với lộ trình ${this._difficultyLabel(difficulty)}`);
    } else if (gpa >= difficultyConfig.minGpa) {
      academicScore = 20;
      strengths.push(`GPA đủ điều kiện cho lộ trình này`);
    } else {
      academicScore = 10;
      gaps.push(`GPA hiện tại có thể thách thức với lộ trình ${this._difficultyLabel(difficulty)}`);
    }

    // Bonus: tín chỉ hoàn thành (chứng minh SV đã học nhiều)
    if (completedCredits >= 60) academicScore = Math.min(30, academicScore + 5);

    details.academic = academicScore;
    totalScore += academicScore;

    // === 3. SKILL COVERAGE (20 điểm) ===
    let skillScore = 0;
    const roadmapSkillNames = roadmap.skills
      .map(s => (s.skill?.name || '').toLowerCase())
      .filter(Boolean);

    const courseKeywords = this._extractCourseKeywords(academicProfile?.courseGrades || []);

    if (roadmapSkillNames.length > 0 && courseKeywords.size > 0) {
      const matchedSkills = roadmapSkillNames.filter(skillName =>
        [...courseKeywords].some(kw =>
          skillName.includes(kw) || kw.includes(skillName.split(' ')[0])
        )
      );

      const coverageRatio = matchedSkills.length / roadmapSkillNames.length;
      skillScore = Math.round(coverageRatio * 20);

      if (matchedSkills.length > 0) {
        strengths.push(`Bạn đã có nền tảng về ${matchedSkills.slice(0, 2).join(', ')}`);
      }

      const uncoveredSkills = roadmapSkillNames.filter(s => !matchedSkills.includes(s));
      if (uncoveredSkills.length > 0 && uncoveredSkills.length <= 3) {
        gaps.push(`Cần bổ sung: ${uncoveredSkills.slice(0, 2).join(', ')}`);
      }
    } else {
      skillScore = 10; // Không đủ dữ liệu → trung bình
    }

    details.skillCoverage = skillScore;
    totalScore += skillScore;

    // === 4. DURATION MATCH (10 điểm) ===
    let durationScore = 0;
    const estimatedMonths = roadmap.estimatedMonths || 6;
    const currentSemester = academicProfile?.currentSemester || 1;

    // SV càng về cuối khóa → nên có lộ trình ngắn hơn
    const preferredDuration = currentSemester <= 4 ? 12 : currentSemester <= 6 ? 9 : 6;
    if (estimatedMonths <= preferredDuration) {
      durationScore = 10;
      strengths.push(`Thời lượng ${estimatedMonths} tháng phù hợp với giai đoạn học của bạn`);
    } else {
      durationScore = 5;
    }

    details.duration = durationScore;
    totalScore += durationScore;

    return { totalScore, details, strengths, gaps };
  }

  /** Fuzzy match hai string (case insensitive, keyword overlap) */
  _fuzzyMatch(a, b) {
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
    // Keyword overlap
    const wordsA = a.split(/[\s\-_]+/);
    const wordsB = b.split(/[\s\-_]+/);
    const intersection = wordsA.filter(w => w.length > 2 && wordsB.includes(w));
    return intersection.length >= Math.min(2, Math.min(wordsA.length, wordsB.length));
  }

  /** Trích xuất keywords từ career path string */
  _extractKeywords(str) {
    return str
      .toLowerCase()
      .split(/[\s\-_,\/]+/)
      .filter(w => w.length > 2);
  }

  /** Trích xuất keywords từ các course grades đã học */
  _extractCourseKeywords(courseGrades) {
    const keywords = new Set();
    const courseKeywordMap = {
      // Lập trình
      'python': ['python', 'machine learning', 'data science', 'ai', 'deep learning'],
      'javascript': ['javascript', 'frontend', 'web', 'node', 'react', 'vue'],
      'java': ['java', 'backend', 'spring', 'android'],
      'c++': ['c++', 'c', 'algorithm', 'embedded'],
      'c#': ['c#', '.net', 'unity'],
      // Database
      'database': ['sql', 'database', 'mysql', 'mongodb', 'data'],
      'sql': ['sql', 'database', 'data engineer'],
      // Web
      'web': ['frontend', 'backend', 'fullstack', 'html', 'css'],
      'network': ['network', 'cybersecurity', 'devops'],
      'security': ['cybersecurity', 'security', 'network'],
      'ai': ['ai', 'machine learning', 'deep learning', 'data science'],
      'mobile': ['mobile', 'android', 'ios', 'react native', 'flutter'],
      'design': ['ui', 'ux', 'frontend', 'design'],
      'algorithm': ['algorithm', 'data structure', 'backend'],
      'software engineering': ['backend', 'fullstack', 'devops'],
    };

    (courseGrades || []).forEach(cg => {
      const courseName = (cg.course?.name || '').toLowerCase();
      for (const [keyword, related] of Object.entries(courseKeywordMap)) {
        if (courseName.includes(keyword)) {
          related.forEach(r => keywords.add(r));
        }
      }
      // Thêm trực tiếp từ course name
      this._extractKeywords(courseName).forEach(kw => keywords.add(kw));
    });

    return keywords;
  }

  /** Label tiếng Việt cho độ khó */
  _difficultyLabel(d) {
    return { beginner: 'cơ bản', intermediate: 'trung bình', advanced: 'nâng cao' }[d] || d;
  }
}

module.exports = new RoadmapSuggestionService();

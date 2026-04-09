/**
 * StudentAIProfile Service
 * Build & refresh pre-computed AI profile cho sinh viên.
 * Gọi khi: cập nhật hồ sơ học tập, sở thích nghề nghiệp, kỹ năng.
 */
const crypto = require('crypto');
const StudentAIProfile = require('../models/StudentAIProfile');
const AcademicProfile = require('../models/AcademicProfile');
const CareerPreference = require('../models/CareerPreference');
const StudentSkill = require('../models/StudentSkill');
const AIPersonalizedRoadmap = require('../models/AIPersonalizedRoadmap');

/**
 * Build hoặc refresh toàn bộ AI profile cho 1 sinh viên.
 * @param {string} studentId
 * @param {string} fullName - tên sinh viên (từ User)
 */
async function refreshFullProfile(studentId, fullName = '') {
  const [academic, career, skills] = await Promise.all([
    AcademicProfile.findOne({ student: studentId })
      .populate('courseGrades.course', 'name code courseType relatedSkills')
      .lean(),
    CareerPreference.findOne({ student: studentId }).lean(),
    StudentSkill.find({ student: studentId })
      .populate('skill', 'name category')
      .lean(),
  ]);

  // Build structured data
  const profileData = buildProfileData(academic, fullName);
  const careerData = buildCareerData(career);
  const skillsData = buildSkillsData(skills);

  // Build text summaries (dùng trực tiếp trong prompt)
  const profileSummary = buildProfileSummary(profileData);
  const careerSummary = buildCareerSummary(careerData);
  const skillsSummary = buildSkillsSummary(skillsData);
  const academicSummary = buildAcademicSummary(academic);

  // Hash để detect thay đổi
  const dataHash = computeHash({ profileData, careerData, skillsData });

  const result = await StudentAIProfile.findOneAndUpdate(
    { student: studentId },
    {
      profileData,
      careerData,
      skillsData,
      profileSummary,
      careerSummary,
      skillsSummary,
      academicSummary,
      dataHash,
      lastUpdatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  // Invalidate cached AI roadmaps (profile đã thay đổi)
  await AIPersonalizedRoadmap.updateMany(
    { student: studentId, isValid: true },
    { $set: { isValid: false } }
  );

  return result;
}

/**
 * Refresh chỉ 1 phần (nhanh hơn full refresh)
 */
async function refreshAcademic(studentId, fullName = '') {
  const academic = await AcademicProfile.findOne({ student: studentId })
    .populate('courseGrades.course', 'name code courseType relatedSkills')
    .lean();

  const profileData = buildProfileData(academic, fullName);
  const profileSummary = buildProfileSummary(profileData);
  const academicSummary = buildAcademicSummary(academic);

  await updateAndInvalidate(studentId, {
    profileData, profileSummary, academicSummary,
  });
}

async function refreshCareer(studentId) {
  const career = await CareerPreference.findOne({ student: studentId }).lean();
  const careerData = buildCareerData(career);
  const careerSummary = buildCareerSummary(careerData);

  await updateAndInvalidate(studentId, { careerData, careerSummary });
}

async function refreshSkills(studentId) {
  const skills = await StudentSkill.find({ student: studentId })
    .populate('skill', 'name category')
    .lean();
  const skillsData = buildSkillsData(skills);
  const skillsSummary = buildSkillsSummary(skillsData);

  await updateAndInvalidate(studentId, { skillsData, skillsSummary });
}

/**
 * Lấy AI profile (tạo mới nếu chưa có)
 */
async function getOrCreate(studentId, fullName = '') {
  let profile = await StudentAIProfile.findOne({ student: studentId }).lean();
  if (!profile) {
    profile = await refreshFullProfile(studentId, fullName);
  }
  return profile;
}

// ──── Internal helpers ────

async function updateAndInvalidate(studentId, updateData) {
  // Lấy existing data để compute hash đầy đủ
  const existing = await StudentAIProfile.findOne({ student: studentId }).lean();
  const merged = {
    profileData: updateData.profileData || existing?.profileData || {},
    careerData: updateData.careerData || existing?.careerData || {},
    skillsData: updateData.skillsData || existing?.skillsData || [],
  };
  const dataHash = computeHash(merged);

  await StudentAIProfile.findOneAndUpdate(
    { student: studentId },
    { ...updateData, dataHash, lastUpdatedAt: new Date() },
    { upsert: true }
  );

  // Invalidate cached roadmaps
  await AIPersonalizedRoadmap.updateMany(
    { student: studentId, isValid: true },
    { $set: { isValid: false } }
  );
}

function buildProfileData(academic, fullName) {
  if (!academic) return { fullName, gpa: 0, completedCredits: 0, currentSemester: 1, strongCourses: [], weakCourses: [] };

  const grades = academic.courseGrades || [];
  const strongCourses = grades
    .filter(cg => (cg.numericGrade || 0) >= 7)
    .sort((a, b) => (b.numericGrade || 0) - (a.numericGrade || 0))
    .slice(0, 10)
    .map(cg => ({
      name: cg.course?.name || 'N/A',
      code: cg.course?.code || '',
      grade: cg.numericGrade || 0,
    }));

  const weakCourses = grades
    .filter(cg => (cg.numericGrade || 0) > 0 && (cg.numericGrade || 0) < 6)
    .sort((a, b) => (a.numericGrade || 0) - (b.numericGrade || 0))
    .slice(0, 5)
    .map(cg => ({
      name: cg.course?.name || 'N/A',
      code: cg.course?.code || '',
      grade: cg.numericGrade || 0,
    }));

  return {
    fullName,
    gpa: academic.gpa || 0,
    completedCredits: academic.completedCredits || 0,
    currentSemester: academic.currentSemester || 1,
    strongCourses,
    weakCourses,
  };
}

function buildCareerData(career) {
  if (!career) return { careerPaths: [], locations: [], salary: { min: 0, max: 0 }, companies: [], jobTypes: [] };
  return {
    careerPaths: career.careerPaths || [],
    locations: career.preferredLocations || [],
    salary: career.expectedSalary || { min: 0, max: 0 },
    companies: career.interestedCompanies || [],
    jobTypes: career.jobTypes || [],
  };
}

function buildSkillsData(skills) {
  return (skills || []).map(ss => ({
    name: ss.skill?.name || 'N/A',
    level: ss.proficiencyLevel || 1,
    source: ss.source || 'manual',
  }));
}

function buildProfileSummary(pd) {
  const parts = [];
  if (pd.fullName) parts.push(`Sinh viên: ${pd.fullName}`);
  parts.push(`GPA: ${pd.gpa}`);
  parts.push(`${pd.completedCredits} tín chỉ tích lũy`);
  parts.push(`Học kỳ ${pd.currentSemester}`);
  return parts.join(', ');
}

function buildCareerSummary(cd) {
  const parts = [];
  if (cd.careerPaths.length) parts.push(`Hướng: ${cd.careerPaths.join(', ')}`);
  if (cd.locations.length) parts.push(`Khu vực: ${cd.locations.join(', ')}`);
  if (cd.salary.min || cd.salary.max) parts.push(`Lương: ${cd.salary.min}-${cd.salary.max} triệu`);
  if (cd.companies.length) parts.push(`Công ty: ${cd.companies.join(', ')}`);
  if (cd.jobTypes.length) parts.push(`Loại: ${cd.jobTypes.join(', ')}`);
  return parts.join('. ') || 'Chưa thiết lập sở thích nghề nghiệp';
}

function buildSkillsSummary(skills) {
  if (!skills.length) return 'Chưa có kỹ năng nào';
  const sourceLabel = { roadmap: 'lộ trình', academic: 'HP', manual: 'tự khai báo' };
  return skills.map(s => `${s.name} (L${s.level}, ${sourceLabel[s.source] || s.source})`).join(', ');
}

function buildAcademicSummary(academic) {
  if (!academic) return 'Chưa có hồ sơ học tập';
  const grades = academic.courseGrades || [];
  const parts = [];

  const good = grades.filter(cg => (cg.numericGrade || 0) >= 7)
    .sort((a, b) => (b.numericGrade || 0) - (a.numericGrade || 0))
    .slice(0, 5);
  if (good.length) {
    parts.push('Điểm cao: ' + good.map(cg => `${cg.course?.name || 'N/A'} (${cg.numericGrade}/10)`).join(', '));
  }

  const weak = grades.filter(cg => (cg.numericGrade || 0) > 0 && (cg.numericGrade || 0) < 6)
    .sort((a, b) => (a.numericGrade || 0) - (b.numericGrade || 0))
    .slice(0, 3);
  if (weak.length) {
    parts.push('Cần cải thiện: ' + weak.map(cg => `${cg.course?.name || 'N/A'} (${cg.numericGrade}/10)`).join(', '));
  }

  return parts.join('. ') || 'Chưa có điểm';
}

function computeHash(data) {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

module.exports = {
  refreshFullProfile,
  refreshAcademic,
  refreshCareer,
  refreshSkills,
  getOrCreate,
};

/**
 * Seed CTDT K50 - Import toàn bộ dữ liệu chương trình đào tạo K50
 *
 * Logic:
 * - HP đại cương + cơ sở ngành: lưu 1 lần, major = 'chung'
 * - HP chuyên ngành: lưu RIÊNG cho từng ngành (cùng mã CT207 ở KTPM và ATTT = 2 documents)
 *   vì có thể bắt buộc ở ngành này nhưng tự chọn ở ngành khác
 * - Tổng: 253 = 36 đại cương + 15 cơ sở ngành + 202 chuyên ngành
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Course = require('../models/Course');
const CurriculumProgram = require('../models/CurriculumProgram');
const Semester = require('../models/Semester');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edupath2';

const MAJOR_MAP = {
  KyThuatPhanMem: {
    code: 'KTPM_K50',
    name: 'Kỹ thuật Phần mềm K50',
    shortName: 'KTPM',
  },
  AnToanThongTin: {
    code: 'ATTT_K50',
    name: 'An toàn Thông tin K50',
    shortName: 'ATTT',
  },
  CongNgheThongTin: {
    code: 'CNTT_K50',
    name: 'Công nghệ Thông tin K50',
    shortName: 'CNTT',
  },
  HeThongThongTin: {
    code: 'HTTT_K50',
    name: 'Hệ thống Thông tin K50',
    shortName: 'HTTT',
  },
  KhoaHocMayTinh: {
    code: 'KHMT_K50',
    name: 'Khoa học Máy tính K50',
    shortName: 'KHMT',
  },
  MangMayTinhVaTruyenThongDuLieu: {
    code: 'MMT_TTDL_K50',
    name: 'Mạng máy tính và Truyền thông dữ liệu K50',
    shortName: 'MMT&TTDL',
  },
};

// Danh sách 158 mã HP tự chọn (từ user)
const ELECTIVE_CODES = new Set([
  'TC100', 'XH023', 'XH024', 'XH025', 'XH031', 'XH032', 'XH033',
  'FL001', 'FL002', 'FL003', 'FL007', 'FL008', 'FL009',
  'ML007', 'XH028', 'XH011', 'XH012', 'XH014', 'KN001E', 'KN002E',
  'CT189', 'CT295', 'CT460', 'CT276', 'CT246', 'CT449', 'CT483',
  'CT446', 'CT553E', 'CT505E', 'CT457', 'CT288', 'CT202', 'CT254',
  'CT207', 'CT233', 'CT258', 'CT205', 'CT255', 'CT297', 'CT486',
  'CT228', 'CT212', 'CT127', 'CT344', 'CT225', 'CT221', 'CT274',
  'CT279', 'CT098', 'CT488', 'CT556E', 'CT520E', 'CT338', 'CT232',
  'CT223', 'CT235', 'CT467', 'CT251', 'CT206', 'CT230', 'CT238',
  'CT482', 'CT332', 'CT273', 'CT211', 'CT449', 'CT484', 'CT522',
  'CT550', 'CT501', 'CT478', 'CT283', 'CT210', 'CT219', 'CT312',
  'CT262E', 'CT298E', 'CT286', 'CT285', 'CT551E', 'CT503E', 'CT280',
  'CT512', 'CT513', 'CT514', 'CT515', 'CT265', 'CT199', 'CT479',
  'CT292', 'CT234', 'CT428', 'CT203', 'CT209', 'CT220', 'CT282',
  'CT217', 'CT552E', 'CT504E', 'CT198', 'CT216', 'CT222', 'CT275',
  'CT290', 'CT284', 'CT126', 'CT121', 'CT224', 'CT227', 'CT490',
  'CT231', 'CT555E', 'CT507E', 'CT294', 'CT466',
]);

// Xác định tự chọn hay bắt buộc dựa trên cột "Bắt buộc" và "Tự chọn" trong Excel
function determineCourseType(row, code) {
  const name = (row[2] || '').toLowerCase();
  const requiredCol = row[4]; // Cột BB
  const electiveCol = row[5]; // Cột TC

  if (name.includes('luận văn') || name.includes('tiểu luận')) return 'thesis';
  if (name.includes('thực tập doanh nghiệp')) return 'internship';

  // Ưu tiên dữ liệu từ cột Excel
  if (electiveCol && !requiredCol) return 'elective';
  if (requiredCol && !electiveCol) return 'required';

  // Fallback: check against known elective list
  if (ELECTIVE_CODES.has(code)) return 'elective';

  return 'required';
}

function determineKnowledgeBlock(courseType, courseCategory) {
  if (courseType === 'thesis') return 'thesis';
  if (courseType === 'internship') return 'internship';
  if (courseCategory === 'general') return 'general_education';
  if (courseCategory === 'foundation') return 'foundation';
  if (courseType === 'elective') return 'specialized_elective';
  return 'specialized_required';
}

function parsePrerequisites(prereqStr) {
  if (!prereqStr || prereqStr.trim() === '') return { prerequisites: [], condition: '' };

  const parts = prereqStr.split(',').map(p => p.trim()).filter(Boolean);
  const prerequisites = [];
  let condition = '';

  for (const part of parts) {
    if (part.includes('>=') || part.includes('TC') || part.includes('tc')) {
      condition = condition ? `${condition}, ${part}` : part;
    } else if (/^[A-Z]{2}\d+/.test(part)) {
      prerequisites.push(part.replace(/E$/, ''));
    } else {
      condition = condition ? `${condition}, ${part}` : part;
    }
  }

  return { prerequisites, condition };
}

/**
 * Parse toàn bộ sheet "Danh sách HP"
 * - Section headers xác định ngành
 * - HP đại cương + cơ sở ngành: 1 entry, major='chung'
 * - HP chuyên ngành: riêng cho từng ngành
 */
function parseCourseList(rows) {
  const allCourses = []; // Array of course objects (NOT deduplicated cho chuyên ngành)
  const generalAndFoundation = new Map(); // Deduplicate cho đại cương + cơ sở

  let currentSection = '';
  let currentMajor = null; // null = chung, string = major key
  let courseCategory = 'general';

  for (const row of rows) {
    if (!row) continue;

    const firstCol = (row[0] || '').toString().trim();

    // Detect section headers
    if (firstCol.includes('Khối kiến thức') || firstCol.includes('Giáo dục')) {
      currentSection = firstCol;

      if (firstCol.toLowerCase().includes('đại cương') || firstCol.toLowerCase().includes('giáo dục chung')) {
        courseCategory = 'general';
        currentMajor = null;
      } else if (firstCol.toLowerCase().includes('cơ sở ngành') || firstCol.toLowerCase().includes('cơ sở')) {
        courseCategory = 'foundation';
        currentMajor = null;
      } else if (firstCol.toLowerCase().includes('chuyên ngành')) {
        courseCategory = 'specialized';
        // Detect which major
        if (firstCol.includes('Kỹ thuật phần mềm') || firstCol.includes('KTPM')) {
          currentMajor = 'KyThuatPhanMem';
        } else if (firstCol.includes('An toàn thông tin') || firstCol.includes('ATTT')) {
          currentMajor = 'AnToanThongTin';
        } else if (firstCol.includes('Công nghệ thông tin') || firstCol.includes('CNTT')) {
          currentMajor = 'CongNgheThongTin';
        } else if (firstCol.includes('Hệ thống thông tin') || firstCol.includes('HTTT')) {
          currentMajor = 'HeThongThongTin';
        } else if (firstCol.includes('Khoa học máy tính') || firstCol.includes('KHMT')) {
          currentMajor = 'KhoaHocMayTinh';
        } else if (firstCol.includes('Mạng') || firstCol.includes('Truyền thông') || firstCol.includes('MMT')) {
          currentMajor = 'MangMayTinhVaTruyenThongDuLieu';
        }
      }
      continue;
    }

    // Skip non-data rows
    if (firstCol === 'STT' || firstCol.includes('Cộng:') || firstCol.includes('Tổng cộng:')) continue;
    if (!row[1] || !row[2]) continue;

    // Parse course row
    const code = (row[1] || '').toString().trim().toUpperCase();
    const name = (row[2] || '').toString().trim();
    const credits = parseInt(row[3]);

    if (!code || !name || isNaN(credits) || credits < 1) continue;

    const courseType = determineCourseType(row, code);
    const knowledgeBlock = determineKnowledgeBlock(courseType, courseCategory);
    const { prerequisites, condition } = parsePrerequisites(row[6] || '');
    const description = (row[8] || '').toString().trim();

    const courseData = {
      code,
      name,
      credits,
      courseType,
      courseCategory,
      major: currentMajor || 'chung',
      knowledgeBlock,
      prerequisites,
      corequisites: [],
      condition,
      description,
      isActive: true,
    };

    if (courseCategory === 'general' || courseCategory === 'foundation') {
      // Deduplicate: chỉ lưu 1 lần cho đại cương + cơ sở ngành
      if (!generalAndFoundation.has(code)) {
        generalAndFoundation.set(code, courseData);
      } else {
        // Update description nếu cái mới có
        const existing = generalAndFoundation.get(code);
        if (!existing.description && description) {
          existing.description = description;
        }
      }
    } else {
      // Chuyên ngành: lưu riêng cho từng ngành (KHÔNG deduplicate)
      allCourses.push(courseData);
    }
  }

  // Merge general/foundation vào đầu danh sách
  const result = [...generalAndFoundation.values(), ...allCourses];
  return result;
}

/**
 * Parse study plan sheet (KyThuatPhanMem, AnToanThongTin, ...)
 * Format: [semester_number, course_code] rows
 */
function parseStudyPlan(sheetData) {
  const semesters = [];
  let currentSemester = null;

  for (const row of sheetData.rows) {
    if (!row) continue;

    const semesterNum = row[0];
    const courseCode = row[1];

    // Skip header rows
    if (typeof semesterNum === 'string' && (semesterNum.includes('Học kỳ') || semesterNum.includes('KHHT'))) {
      continue;
    }

    // New semester detected
    if (semesterNum !== null && semesterNum !== undefined) {
      const num = parseInt(semesterNum);
      if (!isNaN(num) && num >= 1 && num <= 13) {
        if (currentSemester) semesters.push(currentSemester);
        currentSemester = { order: num, name: `Học kỳ ${num}`, courses: [] };
      }
    }

    // Add course to current semester
    if (currentSemester && courseCode && courseCode.toString().trim()) {
      currentSemester.courses.push(courseCode.toString().trim().toUpperCase());
    }
  }

  if (currentSemester && currentSemester.courses.length > 0) {
    semesters.push(currentSemester);
  }

  return semesters;
}

async function seedData() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');

  const jsonPath = path.join(__dirname, '../../../docs/excel_parsed.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`📋 Sheets: ${data.sheets.join(', ')}\n`);

  // ════════════════════════════════════════════
  // Step 1: Parse courses
  // ════════════════════════════════════════════
  console.log('📝 Step 1: Parsing courses from "Danh sách HP"...');
  const courses = parseCourseList(data.data['Danh sách HP'].rows);

  const generalCount = courses.filter(c => c.courseCategory === 'general').length;
  const foundationCount = courses.filter(c => c.courseCategory === 'foundation').length;
  const specializedCount = courses.filter(c => c.courseCategory === 'specialized').length;
  const electiveCount = courses.filter(c => c.courseType === 'elective').length;

  console.log(`   Total: ${courses.length} (expected 253)`);
  console.log(`   - Đại cương: ${generalCount} (expected 36)`);
  console.log(`   - Cơ sở ngành: ${foundationCount} (expected 15)`);
  console.log(`   - Chuyên ngành: ${specializedCount} (expected 202)`);
  console.log(`   - Tự chọn: ${electiveCount}`);

  // ════════════════════════════════════════════
  // Step 2: Parse study plans
  // ════════════════════════════════════════════
  console.log('\n📝 Step 2: Parsing study plans...');
  const studyPlans = {};

  for (const majorKey of Object.keys(MAJOR_MAP)) {
    const sheetData = data.data[majorKey];
    if (!sheetData) {
      console.log(`   ⚠️ "${majorKey}" not found`);
      continue;
    }
    const semesters = parseStudyPlan(sheetData);
    studyPlans[majorKey] = semesters;
    const total = semesters.reduce((s, sem) => s + sem.courses.length, 0);
    console.log(`   ✅ ${MAJOR_MAP[majorKey].shortName}: ${semesters.length} semesters, ${total} courses`);
  }

  // ════════════════════════════════════════════
  // Step 3: Clear & drop old indexes
  // ════════════════════════════════════════════
  console.log('\n🗑️ Step 3: Clearing existing data...');
  await Course.deleteMany({});
  await Semester.deleteMany({});
  await CurriculumProgram.deleteMany({});

  // Drop old unique index on "code" if it exists
  try {
    await Course.collection.dropIndex('code_1');
    console.log('   Dropped old unique index on "code"');
  } catch (e) {
    // Index might not exist, that's fine
  }

  // Ensure new compound index
  await Course.syncIndexes();
  console.log('   ✅ Cleared & synced indexes');

  // ════════════════════════════════════════════
  // Step 4: Insert courses
  // ════════════════════════════════════════════
  console.log('\n💾 Step 4: Inserting courses...');
  let inserted = 0;
  let errors = 0;

  // Map: `${code}__${major}` -> MongoDB _id (for semester linking)
  const courseIdMap = new Map();

  for (const courseData of courses) {
    try {
      const doc = await Course.create(courseData);
      courseIdMap.set(`${courseData.code}__${courseData.major}`, doc._id);
      inserted++;
    } catch (err) {
      if (err.code === 11000) {
        // Get existing doc id for map
        const existing = await Course.findOne({ code: courseData.code, major: courseData.major });
        if (existing) courseIdMap.set(`${courseData.code}__${courseData.major}`, existing._id);
      } else {
        console.error(`   ❌ ${courseData.code} (${courseData.major}): ${err.message}`);
        errors++;
      }
    }
  }

  console.log(`   ✅ Inserted: ${inserted}, Errors: ${errors}`);

  // ════════════════════════════════════════════
  // Step 5: Create CurriculumPrograms + Semesters
  // ════════════════════════════════════════════
  console.log('\n📚 Step 5: Creating CurriculumPrograms & Semesters...');

  for (const [majorKey, majorInfo] of Object.entries(MAJOR_MAP)) {
    const semesterPlan = studyPlans[majorKey];
    if (!semesterPlan) continue;

    const curriculum = await CurriculumProgram.create({
      code: majorInfo.code,
      name: majorInfo.name,
      department: 'Khoa Công nghệ Thông tin và Truyền thông',
      university: 'Trường Đại học Cần Thơ',
      description: `Chương trình đào tạo ${majorInfo.name}`,
      totalCredits: 161,
      semesters: [],
      isActive: true,
    });

    const semesterIds = [];

    for (const semData of semesterPlan) {
      const coursesInSem = [];
      let reqCredits = 0;
      let electCredits = 0;

      for (const code of semData.courses) {
        // Try to find course: first look by major-specific, then 'chung'
        let courseId = courseIdMap.get(`${code}__${majorKey}`);
        if (!courseId) courseId = courseIdMap.get(`${code}__chung`);

        if (courseId) {
          // Determine isRequired from stored course data
          const courseData = courses.find(c => c.code === code && (c.major === majorKey || c.major === 'chung'));
          const isReq = courseData ? (courseData.courseType === 'required') : true;
          const credits = courseData ? courseData.credits : 0;

          coursesInSem.push({
            course: courseId,
            isRequired: isReq,
            electiveGroup: isReq ? null : 'TC',
          });

          if (isReq) reqCredits += credits;
          else electCredits += credits;
        }
      }

      const semester = await Semester.create({
        name: semData.name,
        order: semData.order,
        curriculumProgram: curriculum._id,
        courses: coursesInSem,
        requiredCredits: reqCredits,
        electiveCredits: electCredits,
      });

      semesterIds.push(semester._id);
    }

    await CurriculumProgram.findByIdAndUpdate(curriculum._id, { semesters: semesterIds });
    console.log(`   ✅ ${majorInfo.shortName}: ${semesterIds.length} semesters`);
  }

  // ════════════════════════════════════════════
  // Step 6: Summary
  // ════════════════════════════════════════════
  console.log('\n' + '═'.repeat(50));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(50));

  const dbCourses = await Course.countDocuments();
  const dbSemesters = await Semester.countDocuments();
  const dbPrograms = await CurriculumProgram.countDocuments();

  console.log(`   📘 Courses: ${dbCourses}`);
  console.log(`   📅 Semesters: ${dbSemesters}`);
  console.log(`   🎓 Programs: ${dbPrograms}`);

  // By category
  const catBreakdown = await Course.aggregate([
    { $group: { _id: '$courseCategory', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  console.log('\n   By category:');
  for (const c of catBreakdown) console.log(`     ${c._id}: ${c.count}`);

  // By major
  const majorBreakdown = await Course.aggregate([
    { $group: { _id: '$major', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  console.log('\n   By major:');
  for (const m of majorBreakdown) {
    const label = MAJOR_MAP[m._id]?.shortName || m._id;
    console.log(`     ${label}: ${m.count}`);
  }

  // By courseType
  const typeBreakdown = await Course.aggregate([
    { $group: { _id: '$courseType', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  console.log('\n   By type:');
  for (const t of typeBreakdown) console.log(`     ${t._id}: ${t.count}`);

  console.log('\n✅ Seed completed!');
  await mongoose.disconnect();
  process.exit(0);
}

seedData().catch(err => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});

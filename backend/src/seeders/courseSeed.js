/**
 * Course Seed Script
 * Import 82 học phần từ file JSON (đã export từ Excel CTĐT K50)
 * Tạo CTĐT "Kỹ thuật Phần mềm K50" với 13 học kỳ
 */
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const Course = require('../models/Course');
const CurriculumProgram = require('../models/CurriculumProgram');
const Semester = require('../models/Semester');

// Đọc dữ liệu từ JSON
const coursesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../docs/all_courses_full.json'), 'utf-8')
);
const curriculumPlan = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../docs/curriculum_plan.json'), 'utf-8')
);

/**
 * Phân tích chuỗi tiên quyết/song hành thành mảng mã HP
 * VD: "CT101" -> ["CT101"]
 * VD: "CT113, CT176, CT182" -> ["CT113", "CT176", "CT182"]
 * VD: ">=90TC, CT174" -> ["CT174"] (bỏ điều kiện tín chỉ)
 */
function parsePrerequisites(str) {
  if (!str) return [];
  return str.split(',')
    .map(s => s.trim())
    .filter(s => /^[A-Z]{2}\d{3}/.test(s)); // Chỉ lấy mã HP hợp lệ
}

/**
 * Xác định loại học phần (bắt buộc/tự chọn)
 */
function determineCourseType(code, required, elective) {
  if (code.includes('553') || code.includes('505')) return 'thesis';
  if (code.includes('458')) return 'internship';
  if (elective && !required) return 'elective';
  return 'required';
}

/**
 * Xác định phân loại (đại cương/cơ sở ngành/chuyên ngành)
 */
function determineCourseCategory(code) {
  if (!code.startsWith('CT')) return 'general'; // Đại cương
  // Cơ sở ngành: các HP nền tảng
  const foundationCodes = ['CT101', 'CT112', 'CT172', 'CT173', 'CT174', 'CT175', 'CT176', 'CT177', 'CT178', 'CT182', 'CT188', 'CT113', 'CT100'];
  if (foundationCodes.includes(code.replace(/E$/, ''))) return 'foundation';
  return 'specialized'; // Chuyên ngành
}

async function seedCourses() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Xóa dữ liệu cũ
    await Course.deleteMany({});
    await CurriculumProgram.deleteMany({});
    await Semester.deleteMany({});
    console.log('🗑️ Cleared old data');

    // === 1. Tạo học phần ===
    console.log('\n📚 Importing courses...');
    const courseMap = new Map(); // code -> ObjectId

    for (const courseData of coursesData) {
      const credits = typeof courseData.credits === 'number' ? courseData.credits : parseInt(courseData.credits) || 2;
      const cleanCode = courseData.code.replace(/E$/, '');

      // Phát hiện điều kiện tín chỉ trong prerequisite
      let condition = '';
      if (courseData.prerequisite) {
        const tcMatch = courseData.prerequisite.match(/>?=?\s*(\d+)\s*TC/i);
        if (tcMatch) {
          condition = `Tích lũy >= ${tcMatch[1]} TC`;
        }
      }

      const course = await Course.create({
        code: cleanCode,
        name: courseData.name.replace(/\s*\(\*\)\s*$/, ''),
        credits: credits,
        courseType: determineCourseType(courseData.code, courseData.required, courseData.elective),
        courseCategory: determineCourseCategory(courseData.code),
        condition: condition,
        prerequisites: parsePrerequisites(courseData.prerequisite),
        corequisites: parsePrerequisites(courseData.corequisite),
        description: courseData.description,
        theoryKnowledge: courseData.theory,
        practiceKnowledge: courseData.practice,
      });

      courseMap.set(courseData.code, course._id);
      // Cũng map phiên bản không có 'E'
      courseMap.set(courseData.code.replace(/E$/, ''), course._id);
    }
    console.log(`✅ Imported ${courseMap.size / 2} courses`);

    // === 2. Tạo CTĐT ===
    console.log('\n🎓 Creating curriculum program...');
    const ctdt = await CurriculumProgram.create({
      code: 'KTPM-K50',
      name: 'Kỹ thuật Phần mềm',
      department: 'Khoa Công nghệ Thông tin & Truyền thông',
      university: 'Trường Đại học Cần Thơ',
      description: 'Chương trình đào tạo Kỹ sư Kỹ thuật Phần mềm, Khóa 50',
      totalCredits: 150,
    });
    console.log(`✅ Created: ${ctdt.name} (${ctdt.code})`);

    // === 3. Tạo các học kỳ ===
    console.log('\n📅 Creating semesters...');
    const semesterIds = [];

    for (let i = 0; i < curriculumPlan.length; i++) {
      const semData = curriculumPlan[i];
      
      // Map mã HP sang ObjectId
      const semesterCourses = [];
      for (const courseCode of semData.courses) {
        const courseId = courseMap.get(courseCode) || courseMap.get(courseCode.replace(/E$/, ''));
        if (courseId) {
          // Xác định bắt buộc hay tự chọn dựa trên data gốc
          const originalCourse = coursesData.find(c => c.code === courseCode);
          const isRequired = originalCourse ? !!originalCourse.required : true;
          
          semesterCourses.push({
            course: courseId,
            isRequired: isRequired,
          });
        }
      }

      const semester = await Semester.create({
        name: semData.name,
        order: i + 1,
        curriculumProgram: ctdt._id,
        courses: semesterCourses,
      });

      semesterIds.push(semester._id);
      console.log(`  ✅ ${semData.name}: ${semesterCourses.length} courses`);
    }

    // Cập nhật CTĐT với danh sách học kỳ
    await CurriculumProgram.findByIdAndUpdate(ctdt._id, {
      semesters: semesterIds,
    });

    console.log('\n🎉 Seed completed successfully!');
    console.log(`  📚 Courses: ${coursesData.length}`);
    console.log(`  📅 Semesters: ${semesterIds.length}`);
    console.log(`  🎓 Curriculum: ${ctdt.name}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedCourses();

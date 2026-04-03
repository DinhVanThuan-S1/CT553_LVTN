/**
 * Migration: Convert courseType thesis/internship → required
 * Chạy 1 lần: node backend/src/seeders/migrateThesisInternship.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edupath2';

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB:', MONGODB_URI);

  const db = mongoose.connection.db;

  // 1. Cập nhật Course collection
  const courseResult = await db.collection('courses').updateMany(
    { courseType: { $in: ['thesis', 'internship'] } },
    { $set: { courseType: 'required' } }
  );
  console.log(`✅ Courses updated: ${courseResult.modifiedCount}`);

  // 2. Cập nhật Semester.courses[].isRequired (thesis/internship nên là true)
  // Lấy tất cả course IDs vừa được update
  const updatedCourseIds = await db.collection('courses')
    .find({ courseType: 'required' })
    .project({ _id: 1 })
    .toArray()
    .then(docs => docs.map(d => d._id));

  // Đảm bảo Semester.courses có isRequired: true cho các HP này
  const semResult = await db.collection('semesters').updateMany(
    { 'courses.course': { $in: updatedCourseIds } },
    { $set: { 'courses.$[elem].isRequired': true } },
    { arrayFilters: [{ 'elem.course': { $in: updatedCourseIds }, 'elem.isRequired': { $ne: true } }] }
  );
  console.log(`✅ Semester entries fixed: ${semResult.modifiedCount}`);

  // 3. Cập nhật AcademicProfile.courseGrades[].isRequired
  const profileResult = await db.collection('academicprofiles').updateMany(
    { 'courseGrades.course': { $in: updatedCourseIds } },
    { $set: { 'courseGrades.$[elem].isRequired': true } },
    { arrayFilters: [{ 'elem.course': { $in: updatedCourseIds }, 'elem.isRequired': { $ne: true } }] }
  );
  console.log(`✅ AcademicProfile entries fixed: ${profileResult.modifiedCount}`);

  await mongoose.disconnect();
  console.log('\n✅ Migration hoàn tất!');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

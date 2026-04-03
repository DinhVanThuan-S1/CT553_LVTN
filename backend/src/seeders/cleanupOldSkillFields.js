/**
 * cleanupOldSkillFields.js
 * Xóa các trường cũ resources, exercises, testQuestions khỏi tất cả Skill documents
 * CHỈ chạy sau khi đã verify linkedResources có dữ liệu đầy đủ
 *
 * Usage: node src/seeders/cleanupOldSkillFields.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edupath2';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB:', MONGO_URI);

  const Skill = mongoose.connection.collection('skills');

  // ─── 1. Thống kê trước khi xóa ───────────────────────────
  const total = await Skill.countDocuments({});
  const hasLinked = await Skill.countDocuments({ linkedResources: { $exists: true, $not: { $size: 0 } } });
  const hasOldResources = await Skill.countDocuments({ resources: { $exists: true } });
  const hasOldExercises = await Skill.countDocuments({ exercises: { $exists: true } });
  const hasOldTestQ = await Skill.countDocuments({ testQuestions: { $exists: true } });

  console.log('\n📊 Thống kê trước khi cleanup:');
  console.log(`  Tổng Skills: ${total}`);
  console.log(`  Có linkedResources (non-empty): ${hasLinked}`);
  console.log(`  Còn trường resources cũ: ${hasOldResources}`);
  console.log(`  Còn trường exercises cũ: ${hasOldExercises}`);
  console.log(`  Còn trường testQuestions cũ: ${hasOldTestQ}`);

  // ─── 2. Kiểm tra an toàn ─────────────────────────────────
  // Tìm các skills có old fields nhưng KHÔNG có linkedResources
  const missingLinked = await Skill.countDocuments({
    $and: [
      {
        $or: [
          { resources: { $exists: true, $not: { $size: 0 } } },
          { exercises: { $exists: true, $not: { $size: 0 } } },
          { testQuestions: { $exists: true, $not: { $size: 0 } } },
        ]
      },
      {
        $or: [
          { linkedResources: { $exists: false } },
          { linkedResources: { $size: 0 } },
        ]
      }
    ]
  });

  if (missingLinked > 0) {
    console.log(`\n⚠️  CẢNH BÁO: ${missingLinked} skill(s) có dữ liệu cũ nhưng KHÔNG có linkedResources!`);
    console.log('   Hãy chạy migration trước: node src/seeders/migrateSkillResources.js');
    console.log('   Script sẽ KHÔNG xóa các skill bị thiếu này để bảo toàn dữ liệu.\n');

    // Chỉ xóa các skills ĐÃ có linkedResources
    const result = await Skill.updateMany(
      { linkedResources: { $exists: true, $not: { $size: 0 } } },
      { $unset: { resources: '', exercises: '', testQuestions: '' } }
    );
    console.log(`✅ Đã xóa old fields từ ${result.modifiedCount} skills (có linkedResources)`);
    console.log(`⚠️  Bỏ qua ${missingLinked} skills chưa migrate`);
  } else {
    // Tất cả đều an toàn → xóa hết
    const result = await Skill.updateMany(
      {},
      { $unset: { resources: '', exercises: '', testQuestions: '' } }
    );
    console.log(`\n✅ Đã xóa old fields (resources, exercises, testQuestions) từ ${result.modifiedCount} skills`);
  }

  // ─── 3. Verify sau khi xóa ───────────────────────────────
  const afterOldResources = await Skill.countDocuments({ resources: { $exists: true } });
  const afterOldExercises = await Skill.countDocuments({ exercises: { $exists: true } });
  const afterOldTestQ = await Skill.countDocuments({ testQuestions: { $exists: true } });

  console.log('\n📊 Kiểm tra sau cleanup:');
  console.log(`  resources cũ còn lại: ${afterOldResources}`);
  console.log(`  exercises cũ còn lại: ${afterOldExercises}`);
  console.log(`  testQuestions cũ còn lại: ${afterOldTestQ}`);

  if (afterOldResources === 0 && afterOldExercises === 0 && afterOldTestQ === 0) {
    console.log('\n🎉 Cleanup hoàn tất! Tất cả old fields đã được xóa.');
  } else {
    console.log('\n⚠️  Một số records vẫn còn old fields. Kiểm tra lại.');
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected.');
}

run().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});

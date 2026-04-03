/**
 * Migration: Embedded Skill Resources → Resource Collection
 *
 * Chạy script này SAU KHI deploy Skill model mới để chuyển
 * dữ liệu resources/exercises/testQuestions embedded sang Resource collection.
 *
 * Usage: node backend/src/seeders/migrateSkillResources.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Load models (Resource sau khi Skill đã update)
  const Resource = require('../models/Resource');

  // Dùng raw collection để đọc dữ liệu cũ trước khi schema change
  const rawSkills = await mongoose.connection.db.collection('skills').find({
    $or: [
      { 'resources.0': { $exists: true } },
      { 'exercises.0': { $exists: true } },
      { 'testQuestions.0': { $exists: true } },
    ],
  }).toArray();

  console.log(`📊 Tìm thấy ${rawSkills.length} kỹ năng có embedded resources`);

  let totalMigrated = 0;
  const bulkResources = [];

  for (const skill of rawSkills) {
    const skillId = skill._id;

    // Migrate resources (content)
    for (const r of (skill.resources || [])) {
      bulkResources.push({
        title: r.title || 'Untitled Resource',
        description: r.description || '',
        type: 'content',
        category: r.type || 'article',
        url: r.url || '',
        difficulty: 'beginner',
        estimatedMinutes: parseDuration(r.duration) || 30,
        skills: [skillId],
        isActive: true,
      });
    }

    // Migrate exercises (exercise)
    for (const ex of (skill.exercises || [])) {
      bulkResources.push({
        title: ex.title || 'Untitled Exercise',
        description: ex.description || '',
        type: 'exercise',
        category: 'article',
        content: ex.instructions || '',
        difficulty: ex.difficulty || 'beginner',
        estimatedMinutes: parseDuration(ex.estimatedTime) || 30,
        skills: [skillId],
        isActive: true,
      });
    }

    // Migrate testQuestions (test)
    if ((skill.testQuestions || []).length > 0) {
      bulkResources.push({
        title: `Bài test — ${skill.name}`,
        description: `Bộ câu hỏi test cho kỹ năng ${skill.name}`,
        type: 'test',
        category: 'article',
        difficulty: 'intermediate',
        estimatedMinutes: skill.testQuestions.length * 2,
        testQuestions: skill.testQuestions.map(q => ({
          question: q.question,
          options: q.options || [],
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'medium',
        })),
        skills: [skillId],
        isActive: true,
      });
    }

    totalMigrated++;
    process.stdout.write(`  Processed: ${skill.name}\n`);
  }

  if (bulkResources.length > 0) {
    const inserted = await Resource.insertMany(bulkResources, { ordered: false });
    console.log(`\n✅ Đã tạo ${inserted.length} Resource documents`);

    // Cập nhật linkedResources trên mỗi Skill
    for (const resource of inserted) {
      await mongoose.connection.db.collection('skills').updateMany(
        { _id: { $in: resource.skills } },
        { $addToSet: { linkedResources: resource._id } }
      );
    }
    console.log(`✅ Đã cập nhật linkedResources cho ${totalMigrated} kỹ năng`);
  }

  console.log('\n🎉 Migration hoàn tất!');
  process.exit(0);
}

function parseDuration(str) {
  if (!str) return 30;
  if (typeof str === 'number') return str;
  const match = str.match(/(\d+)\s*(h|min|ph)/i);
  if (!match) return 30;
  const val = parseInt(match[1]);
  return match[2].toLowerCase() === 'h' ? val * 60 : val;
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

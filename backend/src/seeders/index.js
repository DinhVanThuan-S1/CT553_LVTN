/**
 * Main Seed Script
 * Chạy tất cả seeder: Admin account, Courses, Skills
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const User = require('../models/User');
const Skill = require('../models/Skill');

// ===== ADMIN ACCOUNT =====
async function seedAdmin() {
  console.log('\n👤 Creating admin account...');
  
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    console.log('  ⏭️ Admin already exists, skipping');
    return;
  }

  await User.create({
    email: 'admin@edupath.local',
    password: 'Admin@123456',
    fullName: 'Admin EduPath',
    role: 'admin',
    isActive: true,
    isVerified: true,
    authProvider: 'local',
  });
  console.log('  ✅ Admin created: admin@edupath.local / Admin@123456');
}

// ===== SKILLS DATA =====
const skillsData = [
  // === Ngôn ngữ lập trình ===
  { name: 'C/C++', category: 'programming', icon: '⚙️', estimatedHours: 40, description: 'Ngôn ngữ lập trình C và C++ - nền tảng của khoa học máy tính' },
  { name: 'Python', category: 'programming', icon: '🐍', estimatedHours: 30, description: 'Ngôn ngữ lập trình Python - đa năng, dễ học, phổ biến trong AI/ML và Web' },
  { name: 'Java', category: 'programming', icon: '☕', estimatedHours: 40, description: 'Ngôn ngữ lập trình Java - OOP, platform-independent, enterprise-ready' },
  { name: 'JavaScript', category: 'programming', icon: '🟨', estimatedHours: 35, description: 'Ngôn ngữ lập trình JavaScript - ngôn ngữ của web, chạy trên browser và server' },
  { name: 'TypeScript', category: 'programming', icon: '🔷', estimatedHours: 25, description: 'TypeScript - JavaScript với hệ thống kiểu tĩnh, nâng cao chất lượng code' },
  { name: 'Kotlin', category: 'programming', icon: '🟣', estimatedHours: 30, description: 'Kotlin - ngôn ngữ hiện đại cho Android và JVM' },
  { name: 'C#/.NET', category: 'programming', icon: '🟢', estimatedHours: 35, description: 'C# và .NET Framework - phát triển ứng dụng desktop, web và game' },

  // === Frontend ===
  { name: 'HTML/CSS', category: 'frontend', icon: '🌐', estimatedHours: 25, description: 'HTML5 và CSS3 - nền tảng xây dựng giao diện web' },
  { name: 'React', category: 'frontend', icon: '⚛️', estimatedHours: 40, description: 'React.js - thư viện UI phổ biến nhất, component-based, virtual DOM' },
  { name: 'Vue.js', category: 'frontend', icon: '💚', estimatedHours: 35, description: 'Vue.js - framework JavaScript tiến bộ, dễ tiếp cận' },
  { name: 'Angular', category: 'frontend', icon: '🔴', estimatedHours: 40, description: 'Angular - framework toàn diện của Google cho ứng dụng web enterprise' },
  { name: 'Tailwind CSS', category: 'frontend', icon: '💨', estimatedHours: 15, description: 'Tailwind CSS - utility-first CSS framework, thiết kế nhanh và nhất quán' },

  // === Backend ===
  { name: 'Node.js/Express', category: 'backend', icon: '🟩', estimatedHours: 35, description: 'Node.js runtime và Express.js framework - xây dựng REST API và web server' },
  { name: 'Spring Boot', category: 'backend', icon: '🍃', estimatedHours: 40, description: 'Spring Boot - framework Java cho microservices và enterprise applications' },
  { name: 'Django/FastAPI', category: 'backend', icon: '🐍', estimatedHours: 30, description: 'Django và FastAPI - Python web frameworks cho REST API và full-stack' },
  { name: 'RESTful API Design', category: 'backend', icon: '🔌', estimatedHours: 20, description: 'Thiết kế RESTful API - quy ước, best practices, versioning, authentication' },

  // === Cơ sở dữ liệu ===
  { name: 'SQL', category: 'database', icon: '📊', estimatedHours: 30, description: 'SQL - ngôn ngữ truy vấn dữ liệu quan hệ (MySQL, PostgreSQL)' },
  { name: 'MongoDB', category: 'database', icon: '🍃', estimatedHours: 25, description: 'MongoDB - NoSQL document database, flexible schema, high performance' },
  { name: 'PostgreSQL', category: 'database', icon: '🐘', estimatedHours: 25, description: 'PostgreSQL - hệ quản trị CSDL quan hệ mạnh mẽ, mã nguồn mở' },
  { name: 'Redis', category: 'database', icon: '🔴', estimatedHours: 15, description: 'Redis - in-memory data store cho caching, session, real-time applications' },

  // === DevOps & Tools ===
  { name: 'Git & GitHub', category: 'devops', icon: '📦', estimatedHours: 15, description: 'Git - version control system và GitHub - hosting platform cho source code' },
  { name: 'Docker', category: 'devops', icon: '🐳', estimatedHours: 20, description: 'Docker - containerization platform cho development và deployment' },
  { name: 'Linux', category: 'devops', icon: '🐧', estimatedHours: 25, description: 'Linux - hệ điều hành cho server, command line, scripting' },
  { name: 'CI/CD', category: 'devops', icon: '🔄', estimatedHours: 20, description: 'CI/CD pipelines - tự động hóa build, test và deploy (GitHub Actions, Jenkins)' },
  { name: 'Cloud Computing', category: 'devops', icon: '☁️', estimatedHours: 30, description: 'Điện toán đám mây - AWS, GCP, Azure - triển khai và vận hành hệ thống' },

  // === Mobile ===
  { name: 'React Native', category: 'mobile', icon: '📱', estimatedHours: 35, description: 'React Native - cross-platform mobile development với JavaScript/React' },
  { name: 'Flutter', category: 'mobile', icon: '💙', estimatedHours: 35, description: 'Flutter - UI toolkit của Google cho mobile, web và desktop từ một codebase' },
  { name: 'Android Development', category: 'mobile', icon: '🤖', estimatedHours: 40, description: 'Phát triển ứng dụng Android native với Kotlin/Java' },

  // === AI/ML ===
  { name: 'Machine Learning', category: 'ai_ml', icon: '🤖', estimatedHours: 40, description: 'Học máy - supervised, unsupervised learning, model training và evaluation' },
  { name: 'Deep Learning', category: 'ai_ml', icon: '🧠', estimatedHours: 45, description: 'Học sâu - neural networks, CNN, RNN, Transformer, NLP, Computer Vision' },
  { name: 'Data Analysis', category: 'ai_ml', icon: '📈', estimatedHours: 25, description: 'Phân tích dữ liệu - pandas, numpy, visualization, statistical analysis' },

  // === Kỹ thuật phần mềm ===
  { name: 'Software Architecture', category: 'software_engineering', icon: '🏗️', estimatedHours: 30, description: 'Kiến trúc phần mềm - design patterns, SOLID, clean architecture, microservices' },
  { name: 'Software Testing', category: 'software_engineering', icon: '🧪', estimatedHours: 25, description: 'Kiểm thử phần mềm - unit test, integration test, E2E test, TDD, QA' },
  { name: 'UML Modeling', category: 'software_engineering', icon: '📐', estimatedHours: 20, description: 'Ngôn ngữ mô hình hóa UML - use case, class, sequence, activity diagrams' },
  { name: 'Agile/Scrum', category: 'software_engineering', icon: '🏃', estimatedHours: 15, description: 'Agile methodology và Scrum framework - quản lý dự án linh hoạt' },

  // === Mạng & Bảo mật ===
  { name: 'Computer Networking', category: 'networking', icon: '🌍', estimatedHours: 30, description: 'Mạng máy tính - TCP/IP, HTTP, DNS, routing, switching, security' },
  { name: 'Information Security', category: 'networking', icon: '🔒', estimatedHours: 25, description: 'Bảo mật thông tin - mã hóa, authentication, authorization, OWASP' },

  // === Kỹ năng mềm ===
  { name: 'Teamwork', category: 'soft_skills', icon: '🤝', estimatedHours: 10, description: 'Làm việc nhóm - giao tiếp, phối hợp, giải quyết xung đột' },
  { name: 'Problem Solving', category: 'soft_skills', icon: '💡', estimatedHours: 15, description: 'Giải quyết vấn đề - tư duy logic, phân tích, sáng tạo' },
  { name: 'Communication', category: 'soft_skills', icon: '💬', estimatedHours: 10, description: 'Giao tiếp - trình bày, thuyết trình, viết tài liệu kỹ thuật' },
  { name: 'Time Management', category: 'soft_skills', icon: '⏰', estimatedHours: 10, description: 'Quản lý thời gian - lập kế hoạch, ưu tiên, deadline management' },
];

async function seedSkills() {
  console.log('\n🎯 Creating skills...');
  
  const existingCount = await Skill.countDocuments();
  if (existingCount > 0) {
    console.log(`  ⏭️ Skills already exist (${existingCount}), clearing...`);
    await Skill.deleteMany({});
  }

  for (const skillData of skillsData) {
    await Skill.create(skillData);
  }
  console.log(`  ✅ Created ${skillsData.length} skills`);
}

// ===== MAIN =====
async function main() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await seedAdmin();
    await seedSkills();

    console.log('\n🎉 Main seed completed!');
    console.log('💡 Run `npm run seed:courses` separately to seed courses & semesters');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Chỉ chạy nếu gọi trực tiếp
if (require.main === module) {
  main();
}

module.exports = { seedAdmin, seedSkills };

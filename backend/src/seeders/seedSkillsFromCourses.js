/**
 * Seed Skills từ dữ liệu Học phần CTĐT K50
 * Map Học phần → IT Skills phổ biến
 *
 * Usage: node backend/src/seeders/seedSkillsFromCourses.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const SKILLS_FROM_COURSES = [
  // === Programming Languages ===
  { name: 'C/C++', category: 'programming', icon: '⚙️', estimatedHours: 60, description: 'Lập trình hệ thống với C và C++. Nền tảng cho lập trình viên chuyên sâu.' },
  { name: 'Java', category: 'programming', icon: '☕', estimatedHours: 80, description: 'Ngôn ngữ lập trình hướng đối tượng mạnh mẽ, phổ biến trong doanh nghiệp.' },
  { name: 'Python', category: 'programming', icon: '🐍', estimatedHours: 50, description: 'Ngôn ngữ đa năng cho scripting, web, AI/ML và phân tích dữ liệu.' },
  { name: 'JavaScript', category: 'programming', icon: '🟨', estimatedHours: 70, description: 'Ngôn ngữ lập trình cho web — cả frontend lẫn backend (Node.js).' },
  { name: 'TypeScript', category: 'programming', icon: '🔷', estimatedHours: 40, description: 'Superset của JavaScript với hệ thống kiểu tĩnh giúp code an toàn hơn.' },

  // === Object-Oriented Programming ===
  { name: 'OOP (Lập trình hướng đối tượng)', category: 'software_engineering', icon: '🧩', estimatedHours: 40, description: 'Các nguyên lý OOP: Encapsulation, Inheritance, Polymorphism, Abstraction.' },
  { name: 'Design Patterns', category: 'software_engineering', icon: '🏗️', estimatedHours: 35, description: 'Các mẫu thiết kế phần mềm: Singleton, Factory, Observer, Strategy...' },

  // === Data Structures & Algorithms ===
  { name: 'Cấu trúc dữ liệu & Giải thuật', category: 'software_engineering', icon: '🌳', estimatedHours: 60, description: 'Array, LinkedList, Stack, Queue, Tree, Graph, Sorting và Searching algorithms.' },
  { name: 'Lập trình hàm (Functional)', category: 'programming', icon: '𝜆', estimatedHours: 25, description: 'Tư duy lập trình hàm: immutability, pure functions, higher-order functions.' },

  // === Web Frontend ===
  { name: 'HTML & CSS', category: 'frontend', icon: '🌐', estimatedHours: 30, description: 'Nền tảng xây dựng giao diện web: cấu trúc HTML và trình bày CSS.' },
  { name: 'React.js', category: 'frontend', icon: '⚛️', estimatedHours: 60, description: 'Thư viện UI của Facebook. Component-based, hooks, state management.' },
  { name: 'Tailwind CSS', category: 'frontend', icon: '🎨', estimatedHours: 20, description: 'Utility-first CSS framework để xây dựng UI nhanh và nhất quán.' },
  { name: 'Next.js', category: 'frontend', icon: '▲', estimatedHours: 40, description: 'React framework với SSR, SSG, routing và API routes tích hợp.' },

  // === Web Backend ===
  { name: 'Node.js', category: 'backend', icon: '🟩', estimatedHours: 50, description: 'JavaScript runtime để xây dựng server-side applications và REST APIs.' },
  { name: 'Express.js', category: 'backend', icon: '🚂', estimatedHours: 30, description: 'Framework web minimalist cho Node.js — routing, middleware, REST API.' },
  { name: 'RESTful API', category: 'backend', icon: '🔌', estimatedHours: 25, description: 'Thiết kế và xây dựng API theo chuẩn REST: endpoints, status codes, authentication.' },

  // === Database ===
  { name: 'SQL & Cơ sở dữ liệu quan hệ', category: 'database', icon: '🗄️', estimatedHours: 50, description: 'SQL, MySQL/PostgreSQL, thiết kế schema, joins, indexing, transactions.' },
  { name: 'MongoDB', category: 'database', icon: '🍃', estimatedHours: 35, description: 'NoSQL document database: schema-less design, aggregation pipeline, indexing.' },
  { name: 'Redis', category: 'database', icon: '🔴', estimatedHours: 20, description: 'In-memory data store cho caching, session, pub/sub.' },

  // === DevOps & Tools ===
  { name: 'Git & Version Control', category: 'devops', icon: '🌿', estimatedHours: 20, description: 'Git workflow: branching, merging, rebase, pull requests, collaboration.' },
  { name: 'Docker & Containerization', category: 'devops', icon: '🐳', estimatedHours: 30, description: 'Container hóa ứng dụng với Docker, Docker Compose, images và volumes.' },
  { name: 'Linux & CLI', category: 'devops', icon: '🐧', estimatedHours: 25, description: 'Kỹ năng Linux cơ bản: command line, shell scripting, file permissions, networking.' },
  { name: 'CI/CD', category: 'devops', icon: '🔄', estimatedHours: 20, description: 'Tích hợp và triển khai liên tục với GitHub Actions, Jenkins, hoặc GitLab CI.' },

  // === Networking & Security ===
  { name: 'Mạng máy tính', category: 'networking', icon: '🕸️', estimatedHours: 40, description: 'TCP/IP, HTTP/HTTPS, DNS, các giao thức mạng và kiến trúc client-server.' },
  { name: 'Bảo mật ứng dụng Web', category: 'networking', icon: '🔒', estimatedHours: 30, description: 'OWASP Top 10, XSS, SQL Injection, CSRF, authentication và authorization.' },

  // === AI/ML ===
  { name: 'Machine Learning cơ bản', category: 'ai_ml', icon: '🤖', estimatedHours: 60, description: 'Supervised/Unsupervised learning, regression, classification, scikit-learn.' },
  { name: 'Xử lý ngôn ngữ tự nhiên (NLP)', category: 'ai_ml', icon: '💬', estimatedHours: 45, description: 'Text preprocessing, tokenization, embeddings, transformer models.' },

  // === Mobile ===
  { name: 'React Native', category: 'mobile', icon: '📱', estimatedHours: 50, description: 'Phát triển ứng dụng iOS và Android bằng React Native và JavaScript.' },

  // === Soft Skills ===
  { name: 'Kỹ năng trình bày & thuyết trình', category: 'soft_skills', icon: '🎤', estimatedHours: 15, description: 'Thuyết trình kỹ thuật, giải thích vấn đề phức tạp và kỹ năng viết tài liệu.' },
  { name: 'Làm việc nhóm & Agile', category: 'soft_skills', icon: '👥', estimatedHours: 15, description: 'Scrum, Kanban, kỹ năng làm việc nhóm và quy trình phát triển Agile.' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const Skill = require('../models/Skill');
  let created = 0, skipped = 0;

  for (const skillData of SKILLS_FROM_COURSES) {
    const exists = await Skill.findOne({ name: skillData.name });
    if (exists) {
      console.log(`  ⏭️  Đã tồn tại: ${skillData.name}`);
      skipped++;
      continue;
    }
    await Skill.create({ ...skillData, isActive: true });
    console.log(`  ✅ Đã tạo: ${skillData.name}`);
    created++;
  }

  console.log(`\n📊 Kết quả: tạo mới ${created}, bỏ qua ${skipped} kỹ năng`);
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

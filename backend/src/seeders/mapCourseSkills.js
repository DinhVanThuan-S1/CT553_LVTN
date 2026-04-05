/**
 * Seed: Map Course → relatedSkills
 * Dựa trên tên HP + mô tả → gán skills liên quan
 * Chạy: node src/seeders/mapCourseSkills.js
 */
const mongoose = require('mongoose');
const env = require('../config/env');

// Mapping HP code → skill names (dựa trên nội dung CTĐT K50 CNTT)
const courseSkillMap = {
  // === CƠ SỞ NGÀNH ===
  'CT101': ['C / C++', 'Problem Solving'],                          // Lập trình căn bản A
  'CT177': ['Cấu trúc dữ liệu & Giải thuật', 'Data Structures & Algorithms', 'Problem Solving'], // Cấu trúc dữ liệu
  'CT174': ['Data Structures & Algorithms', 'Problem Solving'],       // PTTKTT
  'CT175': ['Data Structures & Algorithms'],                          // Lý thuyết đồ thị
  'CT176': ['OOP (Lập trình hướng đối tượng)', 'Java'],              // LTHDT
  'CT180': ['SQL', 'SQL & Cơ sở dữ liệu quan hệ', 'SQL Fundamentals'], // CSDL
  'CT178': ['Linux', 'Linux & CLI'],                                  // Nguyên lý HĐH
  'CT112': ['Computer Networking', 'Mạng máy tính', 'Networking Fundamentals'], // Mạng máy tính
  'CT173': [],                                                         // Kiến trúc MT
  'CT172': [],                                                         // Toán rời rạc

  // === CHUYÊN NGÀNH KTPM ===
  'CT300': ['Software Architecture', 'System Design'],               // PTTKPM
  'CT239': ['UML Modeling', 'UML/Software Modeling'],                 // PTTKHTTT với UML
  'CT240': ['Software Testing', 'Testing (Unit/E2E)', 'Manual Testing'], // ĐB chất lượng PM
  'CT242': ['Agile/Scrum', 'Teamwork'],                               // Quản lý DAPM Agile
  'CT275': ['Java', 'OOP (Lập trình hướng đối tượng)'],              // Công nghệ Java
  'CT271': ['RESTful API Design', 'RESTful API', 'Node.js/Express', 'Node.js'], // Công nghệ Web
  'CT274': ['JavaScript', 'React', 'React.js', 'HTML & CSS', 'HTML / CSS'], // Lập trình web
  'CT449': ['React', 'React.js', 'HTML & CSS', 'JavaScript', 'Responsive Design'], // Phát triển ƯD Web
  'CT467': ['Node.js/Express', 'Node.js', 'Express.js', 'MongoDB', 'RESTful API'], // Quản trị hệ thống web
  'CT293': ['Design Patterns', 'Clean Code', 'Software Architecture'], // Kiến trúc phần mềm
  'CT282': ['C# / .NET', 'C#/.NET'],                                  // Lập trình trực quan
  'CT283': ['C# / .NET', 'C#/.NET', 'ASP.NET Core'],                  // Công nghệ .NET
  'CT284': ['Python', 'Django/FastAPI', 'Django'],                     // Lập trình Python
  
  // === AI / ML ===
  'CT294': ['Machine Learning', 'Machine Learning cơ bản', 'Python', 'Data Analysis'], // ML
  'CT295': ['Deep Learning', 'Machine Learning', 'Python'],           // Deep Learning
  'CT296': ['NLP', 'Xử lý ngôn ngữ tự nhiên (NLP)', 'Machine Learning'], // NLP
  'CT332': ['Computer Vision', 'Deep Learning'],                       // Thị giác máy tính
  'CT191': ['Data Analysis', 'Data Science', 'Python'],                // Phân tích dữ liệu
  
  // === MOBILE ===
  'CT484': ['Android Development', 'Kotlin', 'Java'],                 // Lập trình Android
  'CT485': ['Flutter', 'Mobile Testing'],                              // Lập trình đa nền tảng
  'CT395': ['React Native', 'JavaScript'],                             // Lập trình di động
  
  // === MẠNG & BẢO MẬT ===
  'CT222': ['Information Security', 'Bảo mật ứng dụng Web', 'Web Security'], // ATTT
  'CT113': ['Computer Networking', 'Mạng máy tính'],                   // Mạng nâng cao
  'CT114': ['Information Security', 'Authentication & Authorization'],  // An ninh mạng
  'CT226': ['Linux', 'Linux/Shell', 'Linux & CLI'],                    // Quản trị hệ thống
  
  // === DATABASE ===
  'CT188': ['SQL', 'MySQL', 'PostgreSQL', 'SQL Fundamentals'],         // CSDL nâng cao
  'CT186': ['MongoDB', 'Firebase', 'SQL'],                             // Hệ quản trị CSDL
  
  // === DEVOPS ===
  'CT445': ['Docker', 'Docker & Containerization', 'CI/CD'],           // DevOps
  'CT446': ['Git & GitHub', 'Git/GitHub', 'Git & Version Control'],    // Quản lý cấu hình PM
  'CT447': ['Cloud Computing', 'AWS', 'Docker'],                       // Điện toán đám mây
  'CT448': ['Kubernetes', 'Docker', 'Cloud Computing'],                // Hệ thống phân tán
  
  // === GAME ===
  'CT261': ['Unity', 'Game Design', '2D/3D Graphics'],                 // Phát triển game
  'CT262': ['Unreal Engine', 'Game AI'],                                // Game nâng cao
  
  // === EMBEDDED ===
  'CT293': ['Embedded C', 'Microcontroller', 'IoT'],                   // note: conflict with 293 above
  'CT256': ['Arduino', 'Embedded C', 'IoT'],                           // Hệ thống nhúng
  'CT257': ['Raspberry Pi', 'IoT', 'RTOS'],                            // IoT

  // === SOFT SKILLS (chung) ===
  'NN001': ['English for IT', 'Communication'],                        // Tiếng Anh
  'CT100': ['Problem Solving'],                                         // NNCNTT
};

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to DB');

  const Course = require('../models/Course');
  const Skill = require('../models/Skill');

  // Load all skills — build name → _id map
  const skills = await Skill.find({}).select('_id name').lean();
  const skillNameToId = {};
  for (const s of skills) {
    skillNameToId[s.name] = s._id;
    // Also lowercase version
    skillNameToId[s.name.toLowerCase()] = s._id;
  }

  let updated = 0;
  let skipped = 0;

  for (const [code, skillNames] of Object.entries(courseSkillMap)) {
    if (skillNames.length === 0) continue;

    // Resolve skill IDs
    const skillIds = [];
    for (const name of skillNames) {
      const id = skillNameToId[name] || skillNameToId[name.toLowerCase()];
      if (id) {
        // Avoid duplicates
        if (!skillIds.find(sid => sid.toString() === id.toString())) {
          skillIds.push(id);
        }
      }
    }

    if (skillIds.length === 0) {
      console.log(`  SKIP ${code}: no valid skills found`);
      skipped++;
      continue;
    }

    // Update all courses with this code (can have multiple majors)
    const result = await Course.updateMany(
      { code },
      { $set: { relatedSkills: skillIds } }
    );

    if (result.modifiedCount > 0) {
      console.log(`  ✅ ${code}: mapped ${skillIds.length} skills (${result.modifiedCount} docs)`);
      updated += result.modifiedCount;
    } else {
      console.log(`  ⚠️  ${code}: no courses found or already mapped`);
    }
  }

  console.log(`\nDone: ${updated} courses updated, ${skipped} skipped`);

  // Verify
  const withSkills = await Course.countDocuments({ relatedSkills: { $ne: [] } });
  console.log(`Courses with relatedSkills: ${withSkills} / ${await Course.countDocuments()}`);

  process.exit();
}

run().catch(e => { console.error(e); process.exit(1); });

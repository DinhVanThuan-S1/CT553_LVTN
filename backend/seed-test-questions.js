/**
 * Seed test questions cho skills
 * Thêm câu hỏi test vào skills hiện có
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edupath2';

async function seedTestQuestions() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const Skill = require('./src/models/Skill');
  const skills = await Skill.find({});
  console.log(`Found ${skills.length} skills`);

  for (const skill of skills) {
    if (skill.testQuestions && skill.testQuestions.length > 0) {
      console.log(`  ✓ ${skill.name} — already has ${skill.testQuestions.length} questions`);
      continue;
    }

    const questions = generateQuestionsForSkill(skill);
    skill.testQuestions = questions;

    // Also add some resources/exercises if empty
    if (!skill.resources || skill.resources.length === 0) {
      skill.resources = generateResourcesForSkill(skill);
    }
    if (!skill.exercises || skill.exercises.length === 0) {
      skill.exercises = generateExercisesForSkill(skill);
    }

    await skill.save({ validateModifiedOnly: true }).catch((err) => {
      console.log(`  ✗ ${skill.name} — skip (${err.message?.substring(0, 60)})`);
    });
    console.log(`  + ${skill.name} — added ${questions.length} questions, ${skill.resources.length} resources, ${skill.exercises.length} exercises`);
  }

  console.log('\nDone!');
  await mongoose.disconnect();
}

function generateQuestionsForSkill(skill) {
  const categoryQuestions = {
    programming: [
      { question: `${skill.name} thuộc loại ngôn ngữ lập trình nào?`, options: [{ text: 'Biên dịch (Compiled)', isCorrect: false }, { text: 'Thông dịch (Interpreted)', isCorrect: false }, { text: 'Tùy thuộc vào triển khai', isCorrect: true }, { text: 'Mã máy (Machine code)', isCorrect: false }], explanation: 'Hầu hết ngôn ngữ hiện đại có nhiều cách triển khai.', difficulty: 'easy' },
      { question: `Khái niệm "biến" trong lập trình là gì?`, options: [{ text: 'Một vùng nhớ lưu trữ dữ liệu', isCorrect: true }, { text: 'Một hàm thực thi code', isCorrect: false }, { text: 'Một thuật toán', isCorrect: false }, { text: 'Một kiểu dữ liệu', isCorrect: false }], explanation: 'Biến dùng để lưu trữ và truy xuất dữ liệu trong chương trình.', difficulty: 'easy' },
      { question: 'Cấu trúc dữ liệu Array có ưu điểm gì?', options: [{ text: 'Truy cập ngẫu nhiên O(1)', isCorrect: true }, { text: 'Chèn phần tử nhanh', isCorrect: false }, { text: 'Bộ nhớ động', isCorrect: false }, { text: 'Tìm kiếm O(1)', isCorrect: false }], explanation: 'Array cho phép truy cập phần tử theo chỉ mục với thời gian O(1).', difficulty: 'medium' },
      { question: 'OOP (Object-Oriented Programming) có mấy tính chất chính?', options: [{ text: '2', isCorrect: false }, { text: '3', isCorrect: false }, { text: '4', isCorrect: true }, { text: '5', isCorrect: false }], explanation: '4 tính chất: Đóng gói, Kế thừa, Đa hình, Trừu tượng.', difficulty: 'medium' },
      { question: `Độ phức tạp thời gian của Binary Search là gì?`, options: [{ text: 'O(n)', isCorrect: false }, { text: 'O(log n)', isCorrect: true }, { text: 'O(n²)', isCorrect: false }, { text: 'O(1)', isCorrect: false }], explanation: 'Binary Search chia đôi mảng ở mỗi bước → O(log n).', difficulty: 'hard' },
    ],
    frontend: [
      { question: 'HTML là viết tắt của?', options: [{ text: 'HyperText Markup Language', isCorrect: true }, { text: 'High Tech Modern Language', isCorrect: false }, { text: 'HyperText Machine Learning', isCorrect: false }, { text: 'Home Tool Markup Language', isCorrect: false }], explanation: 'HyperText Markup Language — ngôn ngữ đánh dấu siêu văn bản.', difficulty: 'easy' },
      { question: 'CSS Flexbox dùng để?', options: [{ text: 'Bố cục 1 chiều', isCorrect: true }, { text: 'Bố cục 2 chiều', isCorrect: false }, { text: 'Tạo animation', isCorrect: false }, { text: 'Kết nối API', isCorrect: false }], explanation: 'Flexbox cho bố cục 1 chiều (row/column). Grid cho 2 chiều.', difficulty: 'easy' },
      { question: 'Virtual DOM là gì?', options: [{ text: 'Bản sao nhẹ của DOM thật', isCorrect: true }, { text: 'DOM ảo trên server', isCorrect: false }, { text: 'DOM trong iframe', isCorrect: false }, { text: 'DOM không hiển thị', isCorrect: false }], explanation: 'Virtual DOM là representation JS nhẹ giúp tối ưu việc cập nhật DOM thật.', difficulty: 'medium' },
      { question: 'Hook nào dùng để quản lý side effects trong React?', options: [{ text: 'useState', isCorrect: false }, { text: 'useEffect', isCorrect: true }, { text: 'useRef', isCorrect: false }, { text: 'useMemo', isCorrect: false }], explanation: 'useEffect xử lý side effects như fetch data, subscriptions.', difficulty: 'medium' },
      { question: 'Lazy Loading giúp cải thiện gì?', options: [{ text: 'Performance — tải tài nguyên khi cần', isCorrect: true }, { text: 'Security — bảo mật dữ liệu', isCorrect: false }, { text: 'SEO — tối ưu tìm kiếm', isCorrect: false }, { text: 'Testing — dễ test hơn', isCorrect: false }], explanation: 'Lazy loading tải resources chỉ khi cần → giảm initial load time.', difficulty: 'hard' },
    ],
    backend: [
      { question: 'REST API sử dụng giao thức nào?', options: [{ text: 'HTTP/HTTPS', isCorrect: true }, { text: 'FTP', isCorrect: false }, { text: 'SSH', isCorrect: false }, { text: 'SMTP', isCorrect: false }], explanation: 'REST API giao tiếp qua HTTP/HTTPS.', difficulty: 'easy' },
      { question: 'HTTP Status Code 404 nghĩa là?', options: [{ text: 'Not Found', isCorrect: true }, { text: 'Server Error', isCorrect: false }, { text: 'Unauthorized', isCorrect: false }, { text: 'Bad Request', isCorrect: false }], explanation: '404 = Không tìm thấy tài nguyên.', difficulty: 'easy' },
      { question: 'Middleware trong Express.js là gì?', options: [{ text: 'Hàm xử lý giữa request và response', isCorrect: true }, { text: 'Database driver', isCorrect: false }, { text: 'Template engine', isCorrect: false }, { text: 'Router', isCorrect: false }], explanation: 'Middleware là function(req, res, next) xử lý trung gian.', difficulty: 'medium' },
      { question: 'JWT gồm bao nhiêu phần?', options: [{ text: '2', isCorrect: false }, { text: '3', isCorrect: true }, { text: '4', isCorrect: false }, { text: '5', isCorrect: false }], explanation: 'JWT gồm Header, Payload, Signature.', difficulty: 'medium' },
      { question: 'N+1 Query Problem là gì?', options: [{ text: 'Truy vấn DB dư thừa trong vòng lặp', isCorrect: true }, { text: 'Query chậm', isCorrect: false }, { text: 'DB bị lock', isCorrect: false }, { text: 'SQL injection', isCorrect: false }], explanation: 'N+1 xảy ra khi query 1 lần cho list + N lần cho mỗi item.', difficulty: 'hard' },
    ],
    database: [
      { question: 'SQL là viết tắt của?', options: [{ text: 'Structured Query Language', isCorrect: true }, { text: 'Simple Query Language', isCorrect: false }, { text: 'System Query Language', isCorrect: false }, { text: 'Standard Query Logic', isCorrect: false }], explanation: 'SQL = Structured Query Language.', difficulty: 'easy' },
      { question: 'Index trong Database dùng để?', options: [{ text: 'Tăng tốc truy vấn', isCorrect: true }, { text: 'Bảo mật dữ liệu', isCorrect: false }, { text: 'Sao lưu dữ liệu', isCorrect: false }, { text: 'Nén dữ liệu', isCorrect: false }], explanation: 'Index giúp tìm kiếm nhanh hơn nhưng tốn thêm bộ nhớ.', difficulty: 'easy' },
      { question: 'ACID trong database gồm?', options: [{ text: 'Atomicity, Consistency, Isolation, Durability', isCorrect: true }, { text: 'Atomicity, Concurrency, Isolation, Durability', isCorrect: false }, { text: 'Authentication, Consistency, Isolation, Durability', isCorrect: false }, { text: 'Atomicity, Consistency, Integration, Durability', isCorrect: false }], explanation: 'ACID đảm bảo tính toàn vẹn giao dịch.', difficulty: 'medium' },
      { question: 'NoSQL phù hợp cho?', options: [{ text: 'Dữ liệu linh hoạt, schema thay đổi', isCorrect: true }, { text: 'Chỉ dữ liệu quan hệ', isCorrect: false }, { text: 'Dữ liệu nhỏ', isCorrect: false }, { text: 'Chỉ file storage', isCorrect: false }], explanation: 'NoSQL linh hoạt schema, phù hợp dữ liệu bán cấu trúc.', difficulty: 'medium' },
      { question: 'Normalization giúp gì?', options: [{ text: 'Giảm dư thừa dữ liệu', isCorrect: true }, { text: 'Tăng tốc query', isCorrect: false }, { text: 'Mã hóa dữ liệu', isCorrect: false }, { text: 'Backup tự động', isCorrect: false }], explanation: 'Normalization chuẩn hóa giúp giảm data redundancy.', difficulty: 'hard' },
    ],
  };

  const defaultQuestions = [
    { question: `Mục tiêu chính khi học ${skill.name} là gì?`, options: [{ text: 'Hiểu và áp dụng được trong thực tế', isCorrect: true }, { text: 'Chỉ cần nhớ lý thuyết', isCorrect: false }, { text: 'Chỉ cần copy code', isCorrect: false }, { text: 'Chỉ cần xem video', isCorrect: false }], explanation: 'Mục tiêu là hiểu bản chất và áp dụng được.', difficulty: 'easy' },
    { question: `Kỹ năng ${skill.name} thuộc nhóm nào?`, options: [{ text: skill.category, isCorrect: true }, { text: 'networking', isCorrect: false }, { text: 'soft_skills', isCorrect: false }, { text: 'other', isCorrect: false }], explanation: `${skill.name} thuộc nhóm ${skill.category}.`, difficulty: 'easy' },
    { question: 'Phương pháp học hiệu quả nhất?', options: [{ text: 'Thực hành + lý thuyết kết hợp', isCorrect: true }, { text: 'Chỉ đọc sách', isCorrect: false }, { text: 'Chỉ xem video', isCorrect: false }, { text: 'Học thuộc lòng', isCorrect: false }], explanation: 'Kết hợp thực hành và lý thuyết mang lại hiệu quả.', difficulty: 'easy' },
    { question: `Để thành thạo ${skill.name} cần bao lâu?`, options: [{ text: `Khoảng ${skill.estimatedHours} giờ tập trung`, isCorrect: true }, { text: '1 ngày', isCorrect: false }, { text: '1 giờ', isCorrect: false }, { text: 'Không cần thời gian', isCorrect: false }], explanation: `Ước tính khoảng ${skill.estimatedHours} giờ để nắm vững.`, difficulty: 'medium' },
    { question: 'Best practice khi học kỹ năng mới?', options: [{ text: 'Làm project thực tế', isCorrect: true }, { text: 'Chỉ đọc docs', isCorrect: false }, { text: 'Copy paste code', isCorrect: false }, { text: 'Bỏ qua phần khó', isCorrect: false }], explanation: 'Làm project thực tế giúp hiểu sâu và nhớ lâu.', difficulty: 'medium' },
  ];

  return categoryQuestions[skill.category] || defaultQuestions;
}

function generateResourcesForSkill(skill) {
  return [
    { title: `${skill.name} Documentation`, type: 'documentation', url: `https://devdocs.io/${skill.name.toLowerCase().replace(/\s+/g, '-')}`, description: `Tài liệu chính thức ${skill.name}`, duration: '' },
    { title: `${skill.name} Tutorial — freeCodeCamp`, type: 'video', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill.name + ' tutorial')}`, description: `Video hướng dẫn ${skill.name} cho người mới`, duration: '2h' },
    { title: `Roadmap.sh — ${skill.name}`, type: 'article', url: `https://roadmap.sh`, description: 'Lộ trình học tổng quan', duration: '30 min' },
  ];
}

function generateExercisesForSkill(skill) {
  return [
    { title: `Hello World — ${skill.name}`, description: `Viết chương trình đầu tiên với ${skill.name}. Tìm hiểu cú pháp cơ bản.`, difficulty: 'beginner', estimatedTime: '30 min', instructions: 'Cài đặt môi trường, viết và chạy chương trình đầu tiên.' },
    { title: `Mini Project — ${skill.name}`, description: `Xây dựng một ứng dụng nhỏ sử dụng ${skill.name}. Áp dụng kiến thức đã học.`, difficulty: 'intermediate', estimatedTime: '2h', instructions: 'Chọn 1 bài toán đơn giản và triển khai đầy đủ.' },
  ];
}

seedTestQuestions().catch(console.error);

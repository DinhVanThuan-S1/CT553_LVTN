/**
 * masterSeed.js — Seed toàn bộ hệ thống EduPath
 *
 * 1. Skills (80+)
 * 2. Resources (content, exercise, test) cho từng skill
 * 3. Roadmaps mẫu (10+) gồm các skill
 * 4. JobTemplates (10+) ứng với roadmaps
 *
 * Logic: upsert by name → chạy lại an toàn, không duplicate
 * Usage: node src/seeders/masterSeed.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const Skill = require('../models/Skill');
const Resource = require('../models/Resource');
const Roadmap = require('../models/Roadmap');
const JobTemplate = require('../models/JobTemplate');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edupath2';

// ═══════════════════════════════════════════════════════════
// DATA DEFINITIONS
// ═══════════════════════════════════════════════════════════

const SKILLS = [
  // ─── Programming ────────────────────────────────────
  { name: 'JavaScript', category: 'programming', icon: '🟨', estimatedHours: 40, description: 'Ngôn ngữ lập trình phổ biến nhất cho web — ES6+, async/await, closures' },
  { name: 'TypeScript', category: 'programming', icon: '🔷', estimatedHours: 30, description: 'Superset của JavaScript với hệ thống type mạnh mẽ' },
  { name: 'Python', category: 'programming', icon: '🐍', estimatedHours: 35, description: 'Ngôn ngữ đa năng — web, data science, AI, automation' },
  { name: 'Java', category: 'programming', icon: '☕', estimatedHours: 40, description: 'Ngôn ngữ lập trình hướng đối tượng cho enterprise' },
  { name: 'C#/.NET', category: 'programming', icon: '🟢', estimatedHours: 35, description: 'Ngôn ngữ lập trình .NET Framework cho enterprise và game' },
  { name: 'C/C++', category: 'programming', icon: '⚙️', estimatedHours: 40, description: 'Ngôn ngữ lập trình hệ thống, hiệu năng cao' },
  { name: 'Go (Golang)', category: 'programming', icon: '🐹', estimatedHours: 25, description: 'Ngôn ngữ của Google — concurrency, microservices' },
  { name: 'Rust', category: 'programming', icon: '🦀', estimatedHours: 35, description: 'Ngôn ngữ systems programming an toàn bộ nhớ' },
  { name: 'PHP', category: 'programming', icon: '🐘', estimatedHours: 30, description: 'Ngôn ngữ server-side phổ biến cho web' },
  { name: 'Kotlin', category: 'programming', icon: '🟣', estimatedHours: 25, description: 'Ngôn ngữ hiện đại cho Android và JVM' },
  { name: 'Swift', category: 'programming', icon: '🍎', estimatedHours: 30, description: 'Ngôn ngữ lập trình iOS/macOS của Apple' },
  { name: 'Ruby', category: 'programming', icon: '💎', estimatedHours: 25, description: 'Ngôn ngữ lập trình linh hoạt, Ruby on Rails' },

  // ─── Frontend ───────────────────────────────────────
  { name: 'HTML/CSS', category: 'frontend', icon: '🌐', estimatedHours: 25, description: 'Nền tảng web — semantic HTML5, CSS3, Flexbox, Grid' },
  { name: 'React', category: 'frontend', icon: '⚛️', estimatedHours: 40, description: 'UI library phổ biến nhất — hooks, state management, component patterns' },
  { name: 'Vue.js', category: 'frontend', icon: '💚', estimatedHours: 30, description: 'Progressive framework — Composition API, Pinia, Vuetify' },
  { name: 'Angular', category: 'frontend', icon: '🔴', estimatedHours: 40, description: 'Enterprise framework — TypeScript, RxJS, modules' },
  { name: 'Next.js', category: 'frontend', icon: '▲', estimatedHours: 30, description: 'React framework — SSR, SSG, App Router, API routes' },
  { name: 'Tailwind CSS', category: 'frontend', icon: '🎨', estimatedHours: 15, description: 'Utility-first CSS framework — responsive design nhanh' },
  { name: 'Sass/SCSS', category: 'frontend', icon: '🎀', estimatedHours: 10, description: 'CSS preprocessor — variables, mixins, nesting' },
  { name: 'Webpack/Vite', category: 'frontend', icon: '📦', estimatedHours: 15, description: 'Module bundlers — build tools, HMR, code splitting' },
  { name: 'Redux/Zustand', category: 'frontend', icon: '🗃️', estimatedHours: 15, description: 'State management cho React — actions, reducers, middleware' },
  { name: 'Responsive Design', category: 'frontend', icon: '📱', estimatedHours: 15, description: 'Thiết kế responsive — mobile-first, media queries, breakpoints' },

  // ─── Backend ────────────────────────────────────────
  { name: 'Node.js', category: 'backend', icon: '🟩', estimatedHours: 35, description: 'JavaScript runtime — Express, middleware, REST API' },
  { name: 'Express.js', category: 'backend', icon: '🚂', estimatedHours: 20, description: 'Web framework cho Node.js — routing, middleware, error handling' },
  { name: 'NestJS', category: 'backend', icon: '🐱', estimatedHours: 30, description: 'Enterprise framework cho Node.js — decorators, DI, modules' },
  { name: 'Spring Boot', category: 'backend', icon: '🍃', estimatedHours: 40, description: 'Framework Java cho microservices và enterprise applications' },
  { name: 'Django', category: 'backend', icon: '🎸', estimatedHours: 30, description: 'Python web framework — ORM, admin, authentication' },
  { name: 'Flask', category: 'backend', icon: '🧪', estimatedHours: 20, description: 'Python micro-framework — đơn giản, linh hoạt' },
  { name: 'Laravel', category: 'backend', icon: '🔺', estimatedHours: 30, description: 'PHP framework — Eloquent ORM, Blade, Artisan' },
  { name: 'ASP.NET Core', category: 'backend', icon: '🔵', estimatedHours: 35, description: 'Cross-platform web framework — C#, Entity Framework' },
  { name: 'GraphQL', category: 'backend', icon: '🔮', estimatedHours: 20, description: 'Query language cho API — schema, resolvers, mutations' },
  { name: 'RESTful API Design', category: 'backend', icon: '🔗', estimatedHours: 15, description: 'Thiết kế API RESTful — endpoints, status codes, versioning' },

  // ─── Database ───────────────────────────────────────
  { name: 'MongoDB', category: 'database', icon: '🍃', estimatedHours: 25, description: 'NoSQL document database — Mongoose, aggregation pipeline' },
  { name: 'PostgreSQL', category: 'database', icon: '🐘', estimatedHours: 30, description: 'Relational database mạnh mẽ — JSONB, extensions, performance' },
  { name: 'MySQL', category: 'database', icon: '🐬', estimatedHours: 25, description: 'Relational database phổ biến — SQL, indexing, optimization' },
  { name: 'Redis', category: 'database', icon: '🔴', estimatedHours: 15, description: 'In-memory data store — caching, pub/sub, sessions' },
  { name: 'Firebase', category: 'database', icon: '🔥', estimatedHours: 20, description: 'Google BaaS — Firestore, Authentication, Cloud Functions' },
  { name: 'Prisma/Sequelize', category: 'database', icon: '🔷', estimatedHours: 15, description: 'ORM cho Node.js — type-safe queries, migrations' },
  { name: 'SQL Fundamentals', category: 'database', icon: '📊', estimatedHours: 20, description: 'Kiến thức SQL cơ bản — joins, subqueries, normalization' },

  // ─── DevOps ─────────────────────────────────────────
  { name: 'Git/GitHub', category: 'devops', icon: '🔀', estimatedHours: 15, description: 'Version control — branching, merging, pull requests, CI/CD' },
  { name: 'Docker', category: 'devops', icon: '🐳', estimatedHours: 20, description: 'Container platform — Dockerfile, docker-compose, images' },
  { name: 'Kubernetes', category: 'devops', icon: '☸️', estimatedHours: 30, description: 'Container orchestration — pods, services, deployments' },
  { name: 'CI/CD', category: 'devops', icon: '🔄', estimatedHours: 20, description: 'Continuous Integration/Deployment — GitHub Actions, Jenkins' },
  { name: 'AWS', category: 'devops', icon: '☁️', estimatedHours: 40, description: 'Amazon Web Services — EC2, S3, Lambda, RDS' },
  { name: 'Linux/Shell', category: 'devops', icon: '🐧', estimatedHours: 20, description: 'Hệ điều hành Linux — terminal, bash scripting, permissions' },
  { name: 'Nginx/Apache', category: 'devops', icon: '🌐', estimatedHours: 15, description: 'Web server & reverse proxy — configuration, load balancing' },

  // ─── Mobile ─────────────────────────────────────────
  { name: 'React Native', category: 'mobile', icon: '📱', estimatedHours: 35, description: 'Cross-platform mobile với React — Expo, native modules' },
  { name: 'Flutter', category: 'mobile', icon: '🦋', estimatedHours: 35, description: 'UI toolkit của Google — Dart, widgets, state management' },
  { name: 'Android Development', category: 'mobile', icon: '🤖', estimatedHours: 40, description: 'Native Android — Kotlin/Java, Jetpack Compose, Material Design' },
  { name: 'iOS Development', category: 'mobile', icon: '🍏', estimatedHours: 40, description: 'Native iOS — Swift, SwiftUI, UIKit, App Store' },

  // ─── AI/ML ──────────────────────────────────────────
  { name: 'Machine Learning', category: 'ai_ml', icon: '🤖', estimatedHours: 40, description: 'Học máy — supervised, unsupervised, sklearn, model evaluation' },
  { name: 'Deep Learning', category: 'ai_ml', icon: '🧠', estimatedHours: 40, description: 'Mạng neural sâu — TensorFlow, PyTorch, CNN, RNN' },
  { name: 'Data Science', category: 'ai_ml', icon: '📈', estimatedHours: 35, description: 'Khoa học dữ liệu — pandas, numpy, visualization, statistics' },
  { name: 'NLP', category: 'ai_ml', icon: '💬', estimatedHours: 30, description: 'Xử lý ngôn ngữ tự nhiên — transformers, BERT, chatbots' },
  { name: 'Computer Vision', category: 'ai_ml', icon: '👁️', estimatedHours: 30, description: 'Thị giác máy tính — OpenCV, image classification, object detection' },

  // ─── Software Engineering ───────────────────────────
  { name: 'Design Patterns', category: 'software_engineering', icon: '🏗️', estimatedHours: 25, description: 'Mẫu thiết kế — Singleton, Factory, Observer, Strategy' },
  { name: 'Data Structures & Algorithms', category: 'software_engineering', icon: '🧮', estimatedHours: 40, description: 'Cấu trúc dữ liệu và thuật toán — arrays, trees, graphs, complexity' },
  { name: 'Agile/Scrum', category: 'software_engineering', icon: '🏃', estimatedHours: 15, description: 'Agile methodology và Scrum framework — quản lý dự án linh hoạt' },
  { name: 'Testing (Unit/E2E)', category: 'software_engineering', icon: '✅', estimatedHours: 20, description: 'Kiểm thử phần mềm — Jest, Playwright, TDD, test coverage' },
  { name: 'Clean Code', category: 'software_engineering', icon: '✨', estimatedHours: 15, description: 'Viết code sạch — SOLID, DRY, KISS, naming conventions' },
  { name: 'System Design', category: 'software_engineering', icon: '📐', estimatedHours: 30, description: 'Thiết kế hệ thống — scalability, load balancing, caching, CDN' },
  { name: 'Microservices', category: 'software_engineering', icon: '🧩', estimatedHours: 25, description: 'Kiến trúc microservices — API gateway, service discovery, saga' },
  { name: 'UML/Software Modeling', category: 'software_engineering', icon: '📋', estimatedHours: 15, description: 'Mô hình hóa phần mềm — use case, class diagram, sequence diagram' },

  // ─── Soft Skills ────────────────────────────────────
  { name: 'Problem Solving', category: 'soft_skills', icon: '🧩', estimatedHours: 15, description: 'Giải quyết vấn đề — tư duy logic, phân tích, sáng tạo' },
  { name: 'Communication', category: 'soft_skills', icon: '🗣️', estimatedHours: 10, description: 'Kỹ năng giao tiếp — trình bày ý tưởng, viết tài liệu' },
  { name: 'Teamwork', category: 'soft_skills', icon: '🤝', estimatedHours: 10, description: 'Làm việc nhóm — collaboration, code review, pair programming' },
  { name: 'Time Management', category: 'soft_skills', icon: '⏰', estimatedHours: 10, description: 'Quản lý thời gian — prioritization, estimation, productivity' },
  { name: 'English for IT', category: 'soft_skills', icon: '🌍', estimatedHours: 20, description: 'Tiếng Anh chuyên ngành CNTT — documentation, communication' },

  // ─── Networking & Security ──────────────────────────
  { name: 'Networking Fundamentals', category: 'networking', icon: '🌐', estimatedHours: 25, description: 'Mạng máy tính — TCP/IP, DNS, HTTP/HTTPS, OSI model' },
  { name: 'Web Security', category: 'networking', icon: '🔒', estimatedHours: 20, description: 'Bảo mật web — OWASP Top 10, XSS, CSRF, SQL Injection' },
  { name: 'Authentication & Authorization', category: 'networking', icon: '🔑', estimatedHours: 15, description: 'Xác thực — JWT, OAuth2, RBAC, session management' },
  { name: 'Bảo mật ứng dụng Web', category: 'networking', icon: '🛡️', estimatedHours: 30, description: 'Mạng & Bảo mật — penetration testing, vulnerability assessment' },

  // ─── Game Development ──────────────────────────────
  { name: 'Unity', category: 'game_development', icon: '🎮', estimatedHours: 40, description: 'Game engine phổ biến nhất — C#, physics, UI, 2D/3D' },
  { name: 'Unreal Engine', category: 'game_development', icon: '🎯', estimatedHours: 45, description: 'AAA game engine — Blueprints, C++, Nanite, Lumen' },
  { name: 'Game Design', category: 'game_development', icon: '🎲', estimatedHours: 25, description: 'Thiết kế game — mechanics, level design, balancing, GDD' },
  { name: '2D/3D Graphics', category: 'game_development', icon: '🖼️', estimatedHours: 30, description: 'Đồ họa game — sprite, modeling, animation, shaders' },
  { name: 'Game AI', category: 'game_development', icon: '🤖', estimatedHours: 20, description: 'AI trong game — pathfinding, FSM, behavior trees, NPC' },
  { name: 'Godot Engine', category: 'game_development', icon: '🔵', estimatedHours: 25, description: 'Open-source game engine — GDScript, scene system, signals' },

  // ─── Embedded Systems ──────────────────────────────
  { name: 'Embedded C', category: 'embedded', icon: '🔧', estimatedHours: 35, description: 'Lập trình C cho hệ nhúng — register, interrupt, DMA' },
  { name: 'Arduino', category: 'embedded', icon: '🟢', estimatedHours: 20, description: 'Nền tảng phần cứng mở — sensors, actuators, serial' },
  { name: 'Raspberry Pi', category: 'embedded', icon: '🍓', estimatedHours: 20, description: 'Single-board computer — Linux, GPIO, IoT projects' },
  { name: 'RTOS', category: 'embedded', icon: '⏱️', estimatedHours: 30, description: 'Real-Time OS — FreeRTOS, tasks, semaphores, scheduling' },
  { name: 'IoT', category: 'embedded', icon: '📡', estimatedHours: 25, description: 'Internet of Things — MQTT, sensors, cloud connectivity' },
  { name: 'Microcontroller', category: 'embedded', icon: '🔌', estimatedHours: 30, description: 'Vi điều khiển — STM32, ESP32, ARM Cortex, firmware' },
  { name: 'PCB Design', category: 'embedded', icon: '📐', estimatedHours: 20, description: 'Thiết kế mạch in — KiCad, Eagle, schematic, layout' },

  // ─── Testing & QA ──────────────────────────────────
  { name: 'Manual Testing', category: 'testing', icon: '🔍', estimatedHours: 20, description: 'Kiểm thử thủ công — test case, test plan, bug report' },
  { name: 'Selenium/Cypress', category: 'testing', icon: '🤖', estimatedHours: 25, description: 'Test automation web — locators, assertions, page objects' },
  { name: 'API Testing', category: 'testing', icon: '🔗', estimatedHours: 20, description: 'Kiểm thử API — Postman, REST Assured, contract testing' },
  { name: 'Performance Testing', category: 'testing', icon: '📊', estimatedHours: 20, description: 'Kiểm thử hiệu năng — JMeter, k6, load testing, stress testing' },
  { name: 'Test Automation', category: 'testing', icon: '⚡', estimatedHours: 30, description: 'Tự động hóa kiểm thử — CI/CD integration, test framework' },
  { name: 'Mobile Testing', category: 'testing', icon: '📱', estimatedHours: 20, description: 'Kiểm thử mobile — Appium, XCTest, Espresso, device farms' },
];

// ─── RESOURCES cho mỗi skill ──────────────────────────────
// Helper: tạo resources mẫu cho 1 skill
function createResourcesForSkill(skillName) {
  const resources = [];

  // 1. Content resources (2-3 per skill)
  resources.push({
    title: `Tài liệu ${skillName}`,
    description: `Tài liệu học tập toàn diện về ${skillName} cho người mới bắt đầu`,
    type: 'content', category: 'documentation',
    difficulty: 'beginner', estimatedMinutes: 60,
    url: `https://docs.example.com/${skillName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    tags: [skillName, 'documentation', 'beginner'],
  });

  resources.push({
    title: `Video hướng dẫn ${skillName}`,
    description: `Series video học ${skillName} từ cơ bản đến nâng cao`,
    type: 'content', category: 'video',
    difficulty: 'beginner', estimatedMinutes: 120,
    url: `https://youtube.com/playlist?list=${skillName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    tags: [skillName, 'video', 'tutorial'],
  });

  resources.push({
    title: `Khóa học ${skillName} nâng cao`,
    description: `Khóa học chuyên sâu về ${skillName} — best practices và real-world projects`,
    type: 'content', category: 'course',
    difficulty: 'intermediate', estimatedMinutes: 180,
    url: `https://courses.example.com/${skillName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    tags: [skillName, 'course', 'advanced'],
  });

  // 2. Exercise resources (2 per skill)
  resources.push({
    title: `Bài tập cơ bản ${skillName}`,
    description: `Các bài tập thực hành cơ bản để làm quen với ${skillName}`,
    type: 'exercise', difficulty: 'beginner', estimatedMinutes: 45,
    content: `## Bài tập ${skillName}\n\n1. Cài đặt môi trường\n2. Viết chương trình Hello World\n3. Thực hành với các khái niệm cơ bản\n4. Hoàn thành project mini`,
    tags: [skillName, 'exercise', 'practice'],
  });

  resources.push({
    title: `Project thực hành ${skillName}`,
    description: `Dự án thực tế để nâng cao kỹ năng ${skillName}`,
    type: 'exercise', difficulty: 'intermediate', estimatedMinutes: 120,
    content: `## Project ${skillName}\n\n### Yêu cầu\n- Xây dựng ứng dụng hoàn chỉnh\n- Áp dụng best practices\n- Viết documentation\n- Deploy lên server\n\n### Bước thực hiện\n1. Khởi tạo project\n2. Implement core features\n3. Testing\n4. Deploy`,
    tags: [skillName, 'project', 'hands-on'],
  });

  // 3. Test resource (1 per skill — 5 câu)
  resources.push({
    title: `Bài test ${skillName}`,
    description: `Kiểm tra kiến thức ${skillName} — 5 câu hỏi trắc nghiệm`,
    type: 'test', difficulty: 'intermediate', estimatedMinutes: 10,
    testQuestions: createTestQuestions(skillName),
    tags: [skillName, 'test', 'quiz'],
  });

  return resources;
}

// Tạo 5 câu hỏi test cho mỗi skill (customized)
function createTestQuestions(name) {
  return [
    {
      question: `${name} thuộc loại công nghệ nào?`,
      difficulty: 'easy',
      explanation: `${name} là công nghệ phổ biến trong phát triển phần mềm`,
      options: [
        { text: 'Frontend', isCorrect: false },
        { text: 'Backend', isCorrect: false },
        { text: 'Phần mềm / CNTT', isCorrect: true },
        { text: 'Mạng', isCorrect: false },
      ],
    },
    {
      question: `Ưu điểm chính của ${name} là gì?`,
      difficulty: 'easy',
      explanation: `Mỗi công nghệ có ưu điểm riêng phù hợp với từng use case`,
      options: [
        { text: 'Hiệu năng cao', isCorrect: false },
        { text: 'Cộng đồng lớn và ecosystem phong phú', isCorrect: true },
        { text: 'Chỉ chạy trên Windows', isCorrect: false },
        { text: 'Không cần học', isCorrect: false },
      ],
    },
    {
      question: `Khi nào nên sử dụng ${name}?`,
      difficulty: 'medium',
      explanation: `Chọn công nghệ phù hợp với yêu cầu dự án rất quan trọng`,
      options: [
        { text: 'Khi dự án yêu cầu công nghệ phù hợp', isCorrect: true },
        { text: 'Khi không có lựa chọn khác', isCorrect: false },
        { text: 'Luôn luôn dùng cho mọi dự án', isCorrect: false },
        { text: 'Chỉ dùng cho prototype', isCorrect: false },
      ],
    },
    {
      question: `Best practice nào quan trọng nhất khi làm việc với ${name}?`,
      difficulty: 'medium',
      explanation: `Tuân thủ best practices giúp code dễ maintain và mở rộng`,
      options: [
        { text: 'Viết code càng ngắn càng tốt', isCorrect: false },
        { text: 'Không cần documentation', isCorrect: false },
        { text: 'Viết code sạch, có test và documentation', isCorrect: true },
        { text: 'Copy-paste từ StackOverflow', isCorrect: false },
      ],
    },
    {
      question: `Công cụ nào thường đi kèm với ${name}?`,
      difficulty: 'hard',
      explanation: `Hệ sinh thái công nghệ thường bao gồm nhiều công cụ hỗ trợ`,
      options: [
        { text: 'VS Code, Git, Docker', isCorrect: true },
        { text: 'Microsoft Word', isCorrect: false },
        { text: 'Adobe Photoshop', isCorrect: false },
        { text: 'Calculator', isCorrect: false },
      ],
    },
  ];
}

// ─── ROADMAPS ─────────────────────────────────────────────
const ROADMAPS = [
  {
    title: 'Frontend Developer',
    description: 'Lộ trình trở thành Frontend Developer — từ HTML/CSS đến React/Next.js, tối ưu performance',
    careerPath: 'Frontend Developer',
    difficulty: 'intermediate',
    estimatedMonths: 6,
    skillNames: ['HTML/CSS', 'JavaScript', 'TypeScript', 'React', 'Tailwind CSS', 'Next.js', 'Redux/Zustand', 'Webpack/Vite', 'Git/GitHub', 'Responsive Design', 'Testing (Unit/E2E)'],
  },
  {
    title: 'Backend Developer (Node.js)',
    description: 'Lộ trình Backend Developer với Node.js — API, database, authentication, deployment',
    careerPath: 'Backend Developer',
    difficulty: 'intermediate',
    estimatedMonths: 6,
    skillNames: ['JavaScript', 'TypeScript', 'Node.js', 'Express.js', 'MongoDB', 'PostgreSQL', 'Redis', 'RESTful API Design', 'Authentication & Authorization', 'Docker', 'Git/GitHub', 'Testing (Unit/E2E)'],
  },
  {
    title: 'Full-Stack Developer',
    description: 'Lộ trình Full-stack — frontend React + backend Node.js + database + DevOps cơ bản',
    careerPath: 'Full-Stack Developer',
    difficulty: 'advanced',
    estimatedMonths: 9,
    skillNames: ['HTML/CSS', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'PostgreSQL', 'Git/GitHub', 'Docker', 'RESTful API Design', 'Testing (Unit/E2E)', 'System Design'],
  },
  {
    title: 'Mobile Developer (React Native)',
    description: 'Lộ trình Mobile Developer cross-platform với React Native — Expo, navigation, state management',
    careerPath: 'Mobile Developer',
    difficulty: 'intermediate',
    estimatedMonths: 5,
    skillNames: ['JavaScript', 'TypeScript', 'React', 'React Native', 'Redux/Zustand', 'Firebase', 'Git/GitHub', 'RESTful API Design'],
  },
  {
    title: 'Data Scientist',
    description: 'Lộ trình Data Scientist — Python, statistics, ML, deep learning, data visualization',
    careerPath: 'Data Scientist',
    difficulty: 'advanced',
    estimatedMonths: 8,
    skillNames: ['Python', 'SQL Fundamentals', 'Data Science', 'Machine Learning', 'Deep Learning', 'NLP', 'Git/GitHub'],
  },
  {
    title: 'DevOps Engineer',
    description: 'Lộ trình DevOps — CI/CD, container, cloud, monitoring, infrastructure as code',
    careerPath: 'DevOps Engineer',
    difficulty: 'advanced',
    estimatedMonths: 7,
    skillNames: ['Linux/Shell', 'Git/GitHub', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Nginx/Apache', 'Networking Fundamentals', 'Web Security'],
  },
  {
    title: 'Java Developer',
    description: 'Lộ trình Java Developer — Spring Boot, microservices, enterprise patterns',
    careerPath: 'Java Developer',
    difficulty: 'intermediate',
    estimatedMonths: 7,
    skillNames: ['Java', 'Spring Boot', 'PostgreSQL', 'MySQL', 'Docker', 'Git/GitHub', 'RESTful API Design', 'Design Patterns', 'Microservices', 'Testing (Unit/E2E)'],
  },
  {
    title: 'AI/ML Engineer',
    description: 'Lộ trình AI/ML — Python, deep learning frameworks, NLP, computer vision',
    careerPath: 'AI/ML Engineer',
    difficulty: 'advanced',
    estimatedMonths: 10,
    skillNames: ['Python', 'Data Science', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Docker', 'Git/GitHub', 'SQL Fundamentals'],
  },
  {
    title: 'iOS Developer',
    description: 'Lộ trình iOS Developer — Swift, SwiftUI, UIKit, App Store deployment',
    careerPath: 'iOS Developer',
    difficulty: 'intermediate',
    estimatedMonths: 6,
    skillNames: ['Swift', 'iOS Development', 'Git/GitHub', 'RESTful API Design', 'Firebase', 'Testing (Unit/E2E)'],
  },
  {
    title: 'Android Developer',
    description: 'Lộ trình Android Developer — Kotlin, Jetpack Compose, Architecture Components',
    careerPath: 'Android Developer',
    difficulty: 'intermediate',
    estimatedMonths: 6,
    skillNames: ['Kotlin', 'Java', 'Android Development', 'Git/GitHub', 'Firebase', 'RESTful API Design', 'Testing (Unit/E2E)'],
  },
  {
    title: 'Cybersecurity Specialist',
    description: 'Lộ trình chuyên gia an ninh mạng — bảo mật web, penetration testing, compliance',
    careerPath: 'Cybersecurity Specialist',
    difficulty: 'advanced',
    estimatedMonths: 8,
    skillNames: ['Networking Fundamentals', 'Linux/Shell', 'Web Security', 'Authentication & Authorization', 'Bảo mật ứng dụng Web', 'Python', 'Docker'],
  },
  {
    title: 'Python Full-Stack Developer',
    description: 'Lộ trình Python Full-stack — Django/Flask + React, REST API, PostgreSQL',
    careerPath: 'Python Developer',
    difficulty: 'intermediate',
    estimatedMonths: 7,
    skillNames: ['Python', 'Django', 'Flask', 'HTML/CSS', 'JavaScript', 'React', 'PostgreSQL', 'Git/GitHub', 'Docker', 'RESTful API Design'],
  },
  {
    title: 'Game Developer (Unity)',
    description: 'Lộ trình Game Developer với Unity — C#, game design, 2D/3D graphics, AI, deployment',
    careerPath: 'Game Developer',
    difficulty: 'intermediate',
    estimatedMonths: 8,
    skillNames: ['C#/.NET', 'Unity', 'Game Design', '2D/3D Graphics', 'Game AI', 'Git/GitHub', 'Data Structures & Algorithms', 'Design Patterns'],
  },
  {
    title: 'Game Developer (Unreal)',
    description: 'Lộ trình Game Developer với Unreal Engine — C++, Blueprints, 3D graphics, performance',
    careerPath: 'Game Developer',
    difficulty: 'advanced',
    estimatedMonths: 10,
    skillNames: ['C/C++', 'Unreal Engine', 'Game Design', '2D/3D Graphics', 'Game AI', 'Git/GitHub', 'Data Structures & Algorithms'],
  },
  {
    title: 'Embedded Systems Engineer',
    description: 'Lộ trình kỹ sư hệ thống nhúng — C/C++, vi điều khiển, RTOS, IoT, PCB design',
    careerPath: 'Embedded Engineer',
    difficulty: 'advanced',
    estimatedMonths: 9,
    skillNames: ['C/C++', 'Embedded C', 'Arduino', 'Raspberry Pi', 'RTOS', 'IoT', 'Microcontroller', 'PCB Design', 'Git/GitHub', 'Linux/Shell'],
  },
  {
    title: 'QA/Test Engineer',
    description: 'Lộ trình QA Engineer — kiểm thử thủ công, automation, API testing, performance testing',
    careerPath: 'QA Engineer',
    difficulty: 'intermediate',
    estimatedMonths: 6,
    skillNames: ['Manual Testing', 'Selenium/Cypress', 'API Testing', 'Performance Testing', 'Test Automation', 'Git/GitHub', 'Python', 'SQL Fundamentals'],
  },
  {
    title: 'Mobile QA Tester',
    description: 'Lộ trình kiểm thử di động — manual + automation cho iOS & Android',
    careerPath: 'QA Engineer',
    difficulty: 'intermediate',
    estimatedMonths: 5,
    skillNames: ['Manual Testing', 'Mobile Testing', 'API Testing', 'Test Automation', 'Git/GitHub'],
  },
];

// ─── JOB TEMPLATES ────────────────────────────────────────
const JOB_TEMPLATES = [
  {
    title: 'Junior Frontend Developer',
    description: 'Phát triển giao diện web responsive, tích hợp API, tối ưu UX',
    careerPath: 'Frontend Developer',
    salaryRange: { min: 8, max: 15 },
    skillNames: [
      { name: 'HTML/CSS', level: 'intermediate' },
      { name: 'JavaScript', level: 'intermediate' },
      { name: 'React', level: 'beginner' },
      { name: 'Git/GitHub', level: 'beginner' },
    ],
  },
  {
    title: 'Senior Frontend Developer',
    description: 'Lead Frontend team, kiến trúc ứng dụng, mentoring, performance optimization',
    careerPath: 'Frontend Developer',
    salaryRange: { min: 20, max: 40 },
    skillNames: [
      { name: 'React', level: 'advanced' },
      { name: 'TypeScript', level: 'advanced' },
      { name: 'Next.js', level: 'intermediate' },
      { name: 'Redux/Zustand', level: 'advanced' },
      { name: 'Testing (Unit/E2E)', level: 'intermediate' },
      { name: 'System Design', level: 'intermediate' },
    ],
  },
  {
    title: 'Junior Backend Developer (Node.js)',
    description: 'Xây dựng REST API, quản lý database, viết unit test',
    careerPath: 'Backend Developer',
    salaryRange: { min: 10, max: 18 },
    skillNames: [
      { name: 'JavaScript', level: 'intermediate' },
      { name: 'Node.js', level: 'beginner' },
      { name: 'Express.js', level: 'beginner' },
      { name: 'MongoDB', level: 'beginner' },
      { name: 'Git/GitHub', level: 'beginner' },
    ],
  },
  {
    title: 'Senior Backend Developer',
    description: 'Thiết kế system architecture, microservices, database optimization, CI/CD',
    careerPath: 'Backend Developer',
    salaryRange: { min: 25, max: 50 },
    skillNames: [
      { name: 'Node.js', level: 'advanced' },
      { name: 'TypeScript', level: 'advanced' },
      { name: 'PostgreSQL', level: 'advanced' },
      { name: 'Redis', level: 'intermediate' },
      { name: 'Docker', level: 'intermediate' },
      { name: 'Microservices', level: 'intermediate' },
      { name: 'System Design', level: 'advanced' },
    ],
  },
  {
    title: 'Full-Stack Developer',
    description: 'Phát triển full-stack — frontend React + backend Node.js + database',
    careerPath: 'Full-Stack Developer',
    salaryRange: { min: 15, max: 30 },
    skillNames: [
      { name: 'React', level: 'intermediate' },
      { name: 'Node.js', level: 'intermediate' },
      { name: 'MongoDB', level: 'intermediate' },
      { name: 'TypeScript', level: 'beginner' },
      { name: 'Git/GitHub', level: 'intermediate' },
    ],
  },
  {
    title: 'Mobile Developer (React Native)',
    description: 'Phát triển ứng dụng mobile cross-platform, tích hợp API, push notification',
    careerPath: 'Mobile Developer',
    salaryRange: { min: 12, max: 25 },
    skillNames: [
      { name: 'React Native', level: 'intermediate' },
      { name: 'JavaScript', level: 'intermediate' },
      { name: 'TypeScript', level: 'beginner' },
      { name: 'Redux/Zustand', level: 'beginner' },
    ],
  },
  {
    title: 'Data Scientist',
    description: 'Phân tích dữ liệu, xây dựng ML models, data visualization, reporting',
    careerPath: 'Data Scientist',
    salaryRange: { min: 18, max: 40 },
    skillNames: [
      { name: 'Python', level: 'advanced' },
      { name: 'Data Science', level: 'intermediate' },
      { name: 'Machine Learning', level: 'intermediate' },
      { name: 'SQL Fundamentals', level: 'intermediate' },
    ],
  },
  {
    title: 'DevOps Engineer',
    description: 'CI/CD pipeline, infrastructure management, monitoring, container orchestration',
    careerPath: 'DevOps Engineer',
    salaryRange: { min: 20, max: 45 },
    skillNames: [
      { name: 'Docker', level: 'advanced' },
      { name: 'Kubernetes', level: 'intermediate' },
      { name: 'AWS', level: 'intermediate' },
      { name: 'CI/CD', level: 'advanced' },
      { name: 'Linux/Shell', level: 'advanced' },
    ],
  },
  {
    title: 'Java Developer',
    description: 'Phát triển ứng dụng Java — Spring Boot, REST API, microservices',
    careerPath: 'Java Developer',
    salaryRange: { min: 12, max: 30 },
    skillNames: [
      { name: 'Java', level: 'intermediate' },
      { name: 'Spring Boot', level: 'intermediate' },
      { name: 'PostgreSQL', level: 'beginner' },
      { name: 'Git/GitHub', level: 'beginner' },
    ],
  },
  {
    title: 'AI/ML Engineer',
    description: 'Xây dựng AI models, triển khai ML pipeline, research & development',
    careerPath: 'AI/ML Engineer',
    salaryRange: { min: 25, max: 55 },
    skillNames: [
      { name: 'Python', level: 'advanced' },
      { name: 'Deep Learning', level: 'advanced' },
      { name: 'Machine Learning', level: 'advanced' },
      { name: 'Docker', level: 'intermediate' },
    ],
  },
  {
    title: 'iOS Developer',
    description: 'Phát triển ứng dụng iOS native — Swift, SwiftUI, performance optimization',
    careerPath: 'iOS Developer',
    salaryRange: { min: 15, max: 35 },
    skillNames: [
      { name: 'Swift', level: 'intermediate' },
      { name: 'iOS Development', level: 'intermediate' },
      { name: 'Git/GitHub', level: 'beginner' },
    ],
  },
  {
    title: 'Cybersecurity Analyst',
    description: 'Phân tích bảo mật, penetration testing, security policy, incident response',
    careerPath: 'Cybersecurity Specialist',
    salaryRange: { min: 18, max: 40 },
    skillNames: [
      { name: 'Web Security', level: 'advanced' },
      { name: 'Networking Fundamentals', level: 'intermediate' },
      { name: 'Linux/Shell', level: 'intermediate' },
      { name: 'Python', level: 'beginner' },
    ],
  },
  {
    title: 'Game Developer (Unity)',
    description: 'Phát triển game với Unity — gameplay programming, UI, physics, optimization',
    careerPath: 'Game Developer',
    salaryRange: { min: 12, max: 30 },
    skillNames: [
      { name: 'C#/.NET', level: 'intermediate' },
      { name: 'Unity', level: 'intermediate' },
      { name: 'Game Design', level: 'beginner' },
      { name: '2D/3D Graphics', level: 'beginner' },
      { name: 'Git/GitHub', level: 'beginner' },
    ],
  },
  {
    title: 'Game Developer (Unreal)',
    description: 'Phát triển game AAA với Unreal Engine — C++, Blueprints, shaders',
    careerPath: 'Game Developer',
    salaryRange: { min: 18, max: 45 },
    skillNames: [
      { name: 'C/C++', level: 'advanced' },
      { name: 'Unreal Engine', level: 'intermediate' },
      { name: '2D/3D Graphics', level: 'intermediate' },
      { name: 'Game AI', level: 'beginner' },
    ],
  },
  {
    title: 'Embedded Systems Engineer',
    description: 'Kỹ sư hệ thống nhúng — firmware, vi điều khiển, RTOS, IoT, hardware interfacing',
    careerPath: 'Embedded Engineer',
    salaryRange: { min: 15, max: 35 },
    skillNames: [
      { name: 'C/C++', level: 'advanced' },
      { name: 'Embedded C', level: 'intermediate' },
      { name: 'Microcontroller', level: 'intermediate' },
      { name: 'RTOS', level: 'beginner' },
      { name: 'IoT', level: 'beginner' },
    ],
  },
  {
    title: 'QA Engineer',
    description: 'Kỹ sư kiểm thử phần mềm — test planning, automation, API testing, reporting',
    careerPath: 'QA Engineer',
    salaryRange: { min: 10, max: 25 },
    skillNames: [
      { name: 'Manual Testing', level: 'intermediate' },
      { name: 'Selenium/Cypress', level: 'beginner' },
      { name: 'API Testing', level: 'intermediate' },
      { name: 'Git/GitHub', level: 'beginner' },
    ],
  },
  {
    title: 'Automation Tester',
    description: 'Chuyên viên kiểm thử tự động — test framework, CI/CD, performance testing',
    careerPath: 'QA Engineer',
    salaryRange: { min: 15, max: 35 },
    skillNames: [
      { name: 'Test Automation', level: 'advanced' },
      { name: 'Selenium/Cypress', level: 'advanced' },
      { name: 'API Testing', level: 'intermediate' },
      { name: 'Performance Testing', level: 'intermediate' },
      { name: 'Python', level: 'intermediate' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════
// EXECUTION
// ═══════════════════════════════════════════════════════════

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  // ─── STEP 1: Upsert Skills ──────────────────────────
  console.log('━━━ STEP 1: Skills ━━━');
  const skillMap = new Map(); // name → _id
  let skillCreated = 0, skillSkipped = 0;

  for (const s of SKILLS) {
    let skill = await Skill.findOne({ name: s.name });
    if (skill) {
      skillSkipped++;
    } else {
      skill = await Skill.create(s);
      skillCreated++;
    }
    skillMap.set(s.name, skill._id);
  }
  // Load existing skills not in SKILLS array
  const existing = await Skill.find({ isActive: true });
  for (const s of existing) {
    if (!skillMap.has(s.name)) skillMap.set(s.name, s._id);
  }
  console.log(`  ✅ Skills: ${skillCreated} tạo mới, ${skillSkipped} đã tồn tại (tổng map: ${skillMap.size})\n`);

  // ─── STEP 2: Resources cho mỗi skill ────────────────
  console.log('━━━ STEP 2: Resources ━━━');
  let resCreated = 0, resSkipped = 0;

  for (const [skillName, skillId] of skillMap) {
    const rawResources = createResourcesForSkill(skillName);

    for (const r of rawResources) {
      let existing = await Resource.findOne({ title: r.title, type: r.type });
      if (existing) {
        // Đảm bảo liên kết 2 chiều
        if (!existing.skills.some(s => s.toString() === skillId.toString())) {
          existing.skills.push(skillId);
          await existing.save();
        }
        if (!(await Skill.findOne({ _id: skillId, linkedResources: existing._id }))) {
          await Skill.findByIdAndUpdate(skillId, { $addToSet: { linkedResources: existing._id } });
        }
        resSkipped++;
        continue;
      }

      const resource = await Resource.create({
        ...r,
        skills: [skillId],
      });

      await Skill.findByIdAndUpdate(skillId, { $addToSet: { linkedResources: resource._id } });
      resCreated++;
    }
  }
  console.log(`  ✅ Resources: ${resCreated} tạo mới, ${resSkipped} đã tồn tại\n`);

  // ─── STEP 3: Roadmaps ───────────────────────────────
  console.log('━━━ STEP 3: Roadmaps ━━━');
  const roadmapMap = new Map(); // title → _id
  let rmCreated = 0, rmSkipped = 0;

  for (const rm of ROADMAPS) {
    let roadmap = await Roadmap.findOne({ title: rm.title });
    if (roadmap) {
      roadmapMap.set(rm.title, roadmap._id);
      rmSkipped++;
      continue;
    }

    const skills = rm.skillNames.map((name, i) => {
      const id = skillMap.get(name);
      if (!id) { console.warn(`    ⚠ Skill "${name}" not found for roadmap "${rm.title}"`); return null; }
      return { skill: id, order: i + 1, estimatedHours: SKILLS.find(s => s.name === name)?.estimatedHours || 20 };
    }).filter(Boolean);

    roadmap = await Roadmap.create({
      title: rm.title,
      description: rm.description,
      careerPath: rm.careerPath,
      difficulty: rm.difficulty,
      estimatedMonths: rm.estimatedMonths,
      skills,
    });
    roadmapMap.set(rm.title, roadmap._id);
    rmCreated++;
  }
  console.log(`  ✅ Roadmaps: ${rmCreated} tạo mới, ${rmSkipped} đã tồn tại\n`);

  // ─── STEP 4: Job Templates ──────────────────────────
  console.log('━━━ STEP 4: Job Templates ━━━');
  let jtCreated = 0, jtSkipped = 0;

  for (const jt of JOB_TEMPLATES) {
    let job = await JobTemplate.findOne({ title: jt.title });
    if (job) {
      jtSkipped++;
      continue;
    }

    const requiredSkills = jt.skillNames.map(s => {
      const id = skillMap.get(s.name);
      if (!id) { console.warn(`    ⚠ Skill "${s.name}" not found for job "${jt.title}"`); return null; }
      return { skill: id, level: s.level };
    }).filter(Boolean);

    const jobDoc = await JobTemplate.create({
      title: jt.title,
      description: jt.description,
      careerPath: jt.careerPath,
      salaryRange: jt.salaryRange,
      requiredSkills,
    });

    // Link job to matching roadmap
    const matchingRoadmap = await Roadmap.findOne({ careerPath: jt.careerPath });
    if (matchingRoadmap && !matchingRoadmap.relatedJobs.includes(jobDoc._id)) {
      matchingRoadmap.relatedJobs.push(jobDoc._id);
      await matchingRoadmap.save();
    }

    jtCreated++;
  }
  console.log(`  ✅ Job Templates: ${jtCreated} tạo mới, ${jtSkipped} đã tồn tại\n`);

  // ─── SUMMARY ────────────────────────────────────────
  const totalSkills = await Skill.countDocuments({ isActive: true });
  const totalResources = await Resource.countDocuments({ isActive: true });
  const totalRoadmaps = await Roadmap.countDocuments({ isActive: true });
  const totalJobs = await JobTemplate.countDocuments({ isActive: true });

  console.log('═══════════════════════════════════════');
  console.log('📊 TỔNG KẾT HỆ THỐNG:');
  console.log(`  🎯 Skills:        ${totalSkills}`);
  console.log(`  📚 Resources:     ${totalResources}`);
  console.log(`  🗺️  Roadmaps:     ${totalRoadmaps}`);
  console.log(`  💼 Job Templates: ${totalJobs}`);
  console.log('═══════════════════════════════════════');

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected. Done!');
}

run().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});

/**
 * Sample Data Seed
 * Tạo dữ liệu mẫu: Roadmaps, JobTemplates, Employer + Company + JobPostings
 * Chạy SAU khi đã chạy seed:main (admin + skills) và seed:courses
 * Lệnh: node src/seeders/sampleDataSeed.js
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Roadmap = require('../models/Roadmap');
const JobTemplate = require('../models/JobTemplate');
const Company = require('../models/Company');
const JobPosting = require('../models/JobPosting');

async function main() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Lấy admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ Admin not found. Run seed:main first.');
      process.exit(1);
    }

    // Lấy tất cả skills (dùng tên để mapping)
    const allSkills = await Skill.find({});
    const skillMap = {};
    for (const s of allSkills) {
      skillMap[s.name] = s._id;
    }
    console.log(`📋 Found ${allSkills.length} skills`);

    // ==========================================
    // 1. TẠO ROADMAPS MẪU
    // ==========================================
    console.log('\n🛣️ Creating sample roadmaps...');
    await Roadmap.deleteMany({});

    const roadmapsData = [
      {
        title: 'Frontend Developer',
        description: 'Lộ trình học trở thành Frontend Developer chuyên nghiệp. Bắt đầu từ HTML/CSS cơ bản đến React.js nâng cao, bao gồm cả responsive design và performance optimization.',
        careerPath: 'Frontend Developer',
        estimatedMonths: 6,
        difficulty: 'intermediate',
        skills: [
          { name: 'HTML/CSS', hours: 25, level: 'advanced' },
          { name: 'JavaScript', hours: 35, level: 'advanced' },
          { name: 'TypeScript', hours: 20, level: 'intermediate' },
          { name: 'React', hours: 40, level: 'advanced' },
          { name: 'Tailwind CSS', hours: 15, level: 'intermediate' },
          { name: 'Git & GitHub', hours: 10, level: 'intermediate' },
          { name: 'Software Testing', hours: 15, level: 'beginner' },
        ],
      },
      {
        title: 'Backend Developer',
        description: 'Lộ trình trở thành Backend Developer với Node.js/Express. Nắm vững thiết kế API, cơ sở dữ liệu, bảo mật và triển khai hệ thống.',
        careerPath: 'Backend Developer',
        estimatedMonths: 8,
        difficulty: 'intermediate',
        skills: [
          { name: 'JavaScript', hours: 30, level: 'advanced' },
          { name: 'Node.js/Express', hours: 35, level: 'advanced' },
          { name: 'RESTful API Design', hours: 20, level: 'advanced' },
          { name: 'SQL', hours: 25, level: 'intermediate' },
          { name: 'MongoDB', hours: 25, level: 'advanced' },
          { name: 'Docker', hours: 15, level: 'intermediate' },
          { name: 'Information Security', hours: 15, level: 'intermediate' },
          { name: 'Software Testing', hours: 20, level: 'intermediate' },
        ],
      },
      {
        title: 'Full-stack Web Developer',
        description: 'Lộ trình toàn diện từ frontend đến backend. Xây dựng ứng dụng web hoàn chỉnh với React + Node.js + MongoDB. Phù hợp cho SV muốn làm freelancer hoặc startup.',
        careerPath: 'Full-stack Developer',
        estimatedMonths: 12,
        difficulty: 'advanced',
        skills: [
          { name: 'HTML/CSS', hours: 20, level: 'advanced' },
          { name: 'JavaScript', hours: 35, level: 'advanced' },
          { name: 'TypeScript', hours: 20, level: 'intermediate' },
          { name: 'React', hours: 35, level: 'advanced' },
          { name: 'Node.js/Express', hours: 30, level: 'advanced' },
          { name: 'MongoDB', hours: 20, level: 'intermediate' },
          { name: 'RESTful API Design', hours: 15, level: 'advanced' },
          { name: 'Docker', hours: 15, level: 'intermediate' },
          { name: 'Git & GitHub', hours: 10, level: 'intermediate' },
          { name: 'CI/CD', hours: 10, level: 'beginner' },
        ],
      },
      {
        title: 'Mobile Developer (React Native)',
        description: 'Lộ trình phát triển ứng dụng di động cross-platform với React Native. Từ JavaScript nền tảng đến ứng dụng mobile thực tế trên iOS và Android.',
        careerPath: 'Mobile Developer',
        estimatedMonths: 9,
        difficulty: 'intermediate',
        skills: [
          { name: 'JavaScript', hours: 30, level: 'advanced' },
          { name: 'React', hours: 25, level: 'intermediate' },
          { name: 'React Native', hours: 35, level: 'advanced' },
          { name: 'TypeScript', hours: 15, level: 'intermediate' },
          { name: 'RESTful API Design', hours: 10, level: 'intermediate' },
          { name: 'Git & GitHub', hours: 10, level: 'intermediate' },
        ],
      },
      {
        title: 'Data Scientist / AI Engineer',
        description: 'Lộ trình trở thành Data Scientist hoặc AI Engineer. Từ Python cơ bản đến Machine Learning, Deep Learning và phân tích dữ liệu chuyên sâu.',
        careerPath: 'Data Scientist',
        estimatedMonths: 12,
        difficulty: 'advanced',
        skills: [
          { name: 'Python', hours: 30, level: 'advanced' },
          { name: 'SQL', hours: 20, level: 'intermediate' },
          { name: 'Data Analysis', hours: 25, level: 'advanced' },
          { name: 'Machine Learning', hours: 40, level: 'advanced' },
          { name: 'Deep Learning', hours: 40, level: 'intermediate' },
          { name: 'Git & GitHub', hours: 10, level: 'intermediate' },
          { name: 'Docker', hours: 10, level: 'beginner' },
        ],
      },
      {
        title: 'DevOps Engineer',
        description: 'Lộ trình trở thành DevOps Engineer. Quản lý hạ tầng, CI/CD, container, cloud computing và automation. Phù hợp cho SV thích system administration.',
        careerPath: 'DevOps Engineer',
        estimatedMonths: 9,
        difficulty: 'advanced',
        skills: [
          { name: 'Linux', hours: 25, level: 'advanced' },
          { name: 'Docker', hours: 20, level: 'advanced' },
          { name: 'CI/CD', hours: 20, level: 'advanced' },
          { name: 'Cloud Computing', hours: 30, level: 'intermediate' },
          { name: 'Computer Networking', hours: 20, level: 'intermediate' },
          { name: 'Git & GitHub', hours: 10, level: 'advanced' },
          { name: 'Python', hours: 15, level: 'intermediate' },
        ],
      },
      {
        title: 'Java Backend Developer',
        description: 'Lộ trình Backend Developer với Java & Spring Boot. Phổ biến trong các doanh nghiệp lớn, ngân hàng, fintech. Enterprise-grade development.',
        careerPath: 'Java Developer',
        estimatedMonths: 9,
        difficulty: 'intermediate',
        skills: [
          { name: 'Java', hours: 40, level: 'advanced' },
          { name: 'Spring Boot', hours: 35, level: 'advanced' },
          { name: 'SQL', hours: 25, level: 'advanced' },
          { name: 'RESTful API Design', hours: 15, level: 'advanced' },
          { name: 'Docker', hours: 15, level: 'intermediate' },
          { name: 'Software Architecture', hours: 20, level: 'intermediate' },
          { name: 'Software Testing', hours: 20, level: 'intermediate' },
          { name: 'Git & GitHub', hours: 10, level: 'intermediate' },
        ],
      },
    ];

    for (const rm of roadmapsData) {
      const skillRefs = [];
      for (let i = 0; i < rm.skills.length; i++) {
        const sk = rm.skills[i];
        const skillId = skillMap[sk.name];
        if (skillId) {
          skillRefs.push({
            skill: skillId,
            order: i + 1,
            estimatedHours: sk.hours,
            targetLevel: sk.level,
          });
        }
      }
      await Roadmap.create({
        title: rm.title,
        description: rm.description,
        careerPath: rm.careerPath,
        estimatedMonths: rm.estimatedMonths,
        difficulty: rm.difficulty,
        skills: skillRefs,
        createdBy: admin._id,
        isActive: true,
      });
    }
    console.log(`  ✅ Created ${roadmapsData.length} roadmaps`);

    // ==========================================
    // 2. TẠO JOB TEMPLATES
    // ==========================================
    console.log('\n💼 Creating job templates...');
    await JobTemplate.deleteMany({});

    const jobTemplatesData = [
      {
        title: 'Frontend Developer',
        careerPath: 'Frontend Developer',
        description: 'Phát triển giao diện web với React/Vue, responsive design, tối ưu hiệu năng.',
        salaryRange: { min: 10, max: 20 },
        skills: [
          { name: 'HTML/CSS', level: 'advanced' },
          { name: 'JavaScript', level: 'advanced' },
          { name: 'React', level: 'intermediate' },
          { name: 'Git & GitHub', level: 'intermediate' },
        ],
      },
      {
        title: 'Backend Developer (Node.js)',
        careerPath: 'Backend Developer',
        description: 'Xây dựng API, quản lý database, xử lý logic nghiệp vụ phía server.',
        salaryRange: { min: 12, max: 25 },
        skills: [
          { name: 'Node.js/Express', level: 'advanced' },
          { name: 'MongoDB', level: 'intermediate' },
          { name: 'RESTful API Design', level: 'advanced' },
          { name: 'Docker', level: 'beginner' },
        ],
      },
      {
        title: 'Full-stack Developer',
        careerPath: 'Full-stack Developer',
        description: 'Làm việc cả frontend và backend, xây dựng ứng dụng web end-to-end.',
        salaryRange: { min: 15, max: 30 },
        skills: [
          { name: 'React', level: 'intermediate' },
          { name: 'Node.js/Express', level: 'intermediate' },
          { name: 'MongoDB', level: 'intermediate' },
          { name: 'TypeScript', level: 'intermediate' },
        ],
      },
      {
        title: 'Mobile Developer',
        careerPath: 'Mobile Developer',
        description: 'Phát triển ứng dụng di động iOS/Android, cross-platform với React Native hoặc Flutter.',
        salaryRange: { min: 12, max: 25 },
        skills: [
          { name: 'React Native', level: 'intermediate' },
          { name: 'JavaScript', level: 'advanced' },
          { name: 'TypeScript', level: 'intermediate' },
        ],
      },
      {
        title: 'Data Analyst / Data Scientist',
        careerPath: 'Data Scientist',
        description: 'Phân tích dữ liệu, xây dựng mô hình ML, trực quan hóa và báo cáo insights.',
        salaryRange: { min: 15, max: 35 },
        skills: [
          { name: 'Python', level: 'advanced' },
          { name: 'Data Analysis', level: 'advanced' },
          { name: 'Machine Learning', level: 'intermediate' },
          { name: 'SQL', level: 'intermediate' },
        ],
      },
      {
        title: 'DevOps / Cloud Engineer',
        careerPath: 'DevOps Engineer',
        description: 'Quản lý hạ tầng, CI/CD pipeline, container orchestration, cloud services.',
        salaryRange: { min: 18, max: 35 },
        skills: [
          { name: 'Docker', level: 'advanced' },
          { name: 'Linux', level: 'advanced' },
          { name: 'CI/CD', level: 'intermediate' },
          { name: 'Cloud Computing', level: 'intermediate' },
        ],
      },
      {
        title: 'Java Developer',
        careerPath: 'Java Developer',
        description: 'Phát triển ứng dụng enterprise với Java/Spring Boot, microservices architecture.',
        salaryRange: { min: 12, max: 28 },
        skills: [
          { name: 'Java', level: 'advanced' },
          { name: 'Spring Boot', level: 'intermediate' },
          { name: 'SQL', level: 'intermediate' },
          { name: 'Software Architecture', level: 'intermediate' },
        ],
      },
      {
        title: 'QA / Software Tester',
        careerPath: 'QA Engineer',
        description: 'Kiểm thử phần mềm, viết test case, automation testing, đảm bảo chất lượng sản phẩm.',
        salaryRange: { min: 8, max: 18 },
        skills: [
          { name: 'Software Testing', level: 'advanced' },
          { name: 'JavaScript', level: 'intermediate' },
          { name: 'Agile/Scrum', level: 'intermediate' },
        ],
      },
    ];

    for (const tpl of jobTemplatesData) {
      const skillRefs = [];
      for (const sk of tpl.skills) {
        const skillId = skillMap[sk.name];
        if (skillId) {
          skillRefs.push({ skill: skillId, level: sk.level });
        }
      }
      await JobTemplate.create({
        title: tpl.title,
        careerPath: tpl.careerPath,
        description: tpl.description,
        salaryRange: tpl.salaryRange,
        requiredSkills: skillRefs,
        isActive: true,
      });
    }
    console.log(`  ✅ Created ${jobTemplatesData.length} job templates`);

    // ==========================================
    // 3. TẠO EMPLOYER + COMPANY + JOB POSTINGS
    // ==========================================
    console.log('\n🏢 Creating employers, companies, job postings...');
    await JobPosting.deleteMany({});
    await Company.deleteMany({});
    // Không xóa user employer cũ, chỉ upsert

    const companiesData = [
      {
        employerEmail: 'hr@fpt-software.local',
        employerName: 'HR FPT Software',
        company: {
          name: 'FPT Software',
          description: 'Công ty phần mềm hàng đầu Việt Nam, thuộc tập đoàn FPT. Chuyên outsourcing và phát triển giải pháp CNTT cho khách hàng toàn cầu.',
          industry: 'Công nghệ thông tin',
          website: 'https://fpt-software.com',
          size: '1000+',
        },
        jobs: [
          {
            title: 'Frontend Developer (React)',
            description: 'Phát triển giao diện web cho các dự án outsourcing quốc tế. Làm việc với React, TypeScript, Tailwind CSS.',
            requirements: '- Thành thạo React, JavaScript/TypeScript\n- Hiểu biết về responsive design\n- Giao tiếp tiếng Anh cơ bản',
            benefits: '- Lương cạnh tranh 12-20tr\n- Bảo hiểm sức khỏe\n- Đào tạo và phát triển',
            careerPath: 'Frontend Developer',
            jobType: 'full-time',
            salaryRange: { min: 12, max: 20 },
            locationText: 'Cần Thơ, Việt Nam',
            vacancies: 3,
            experienceYears: 0,
            status: 'approved',
            skills: ['React', 'JavaScript', 'TypeScript', 'HTML/CSS'],
          },
          {
            title: 'Java Backend Developer',
            description: 'Phát triển microservices cho hệ thống banking và fintech. Sử dụng Java, Spring Boot, PostgreSQL.',
            requirements: '- Java SE/EE, Spring Boot\n- SQL/PostgreSQL\n- RESTful API design\n- Kinh nghiệm microservice là lợi thế',
            benefits: '- Lương 15-28tr\n- Onsite Nhật Bản\n- Chứng chỉ quốc tế',
            careerPath: 'Java Developer',
            jobType: 'full-time',
            salaryRange: { min: 15, max: 28 },
            locationText: 'TP. Hồ Chí Minh, Việt Nam',
            vacancies: 5,
            experienceYears: 1,
            status: 'approved',
            skills: ['Java', 'Spring Boot', 'SQL', 'RESTful API Design'],
          },
        ],
      },
      {
        employerEmail: 'hr@nashtech.local',
        employerName: 'HR NashTech',
        company: {
          name: 'NashTech Vietnam',
          description: 'Công ty công nghệ thuộc Harvey Nash Group (UK). Phát triển phần mềm, tư vấn công nghệ, chuyên môn hóa .NET và JavaScript.',
          industry: 'Outsourcing',
          website: 'https://nashtechglobal.com',
          size: '501-1000',
        },
        jobs: [
          {
            title: 'Full-stack Developer (Node.js + React)',
            description: 'Tham gia phát triển hệ thống e-commerce cho khách hàng UK. Stack: React, Node.js, MongoDB, Docker.',
            requirements: '- React + Node.js\n- MongoDB hoặc SQL\n- Docker cơ bản\n- English B2+',
            benefits: '- Lương 18-30tr\n- Remote 2 ngày/tuần\n- Company trip hàng năm',
            careerPath: 'Full-stack Developer',
            jobType: 'full-time',
            salaryRange: { min: 18, max: 30 },
            locationText: 'TP. Hồ Chí Minh, Việt Nam',
            vacancies: 2,
            experienceYears: 1,
            status: 'approved',
            skills: ['React', 'Node.js/Express', 'MongoDB', 'Docker'],
          },
          {
            title: 'QA Engineer / Tester',
            description: 'Kiểm thử phần mềm cho các dự án outsourcing. Manual + automation testing, Selenium, Playwright.',
            requirements: '- Kiến thức testing fundamentals\n- Selenium hoặc Playwright\n- Agile/Scrum\n- SQL cơ bản',
            benefits: '- Lương 10-18tr\n- Đào tạo automation\n- Bảo hiểm premium',
            careerPath: 'QA Engineer',
            jobType: 'full-time',
            salaryRange: { min: 10, max: 18 },
            locationText: 'Đà Nẵng, Việt Nam',
            vacancies: 2,
            experienceYears: 0,
            status: 'pending',
            skills: ['Software Testing', 'JavaScript', 'Agile/Scrum'],
          },
        ],
      },
      {
        employerEmail: 'hr@techcorp.local',
        employerName: 'HR TechCorp',
        company: {
          name: 'TechCorp Solutions',
          description: 'Startup công nghệ tại Cần Thơ, chuyên phát triển SaaS platform cho giáo dục và nông nghiệp thông minh.',
          industry: 'EdTech / AgriTech',
          website: 'https://techcorp.vn',
          size: '11-50',
        },
        jobs: [
          {
            title: 'Mobile Developer (React Native)',
            description: 'Phát triển ứng dụng mobile cho nông dân và học sinh. React Native, TypeScript, Expo.',
            requirements: '- React Native\n- TypeScript\n- RESTful API\n- UX/UI cơ bản',
            benefits: '- Lương 10-18tr\n- Thưởng theo dự án\n- Giờ làm linh hoạt',
            careerPath: 'Mobile Developer',
            jobType: 'full-time',
            salaryRange: { min: 10, max: 18 },
            locationText: 'Cần Thơ, Việt Nam',
            vacancies: 2,
            experienceYears: 0,
            status: 'approved',
            skills: ['React Native', 'JavaScript', 'TypeScript'],
          },
          {
            title: 'Data Analyst Intern',
            description: 'Thực tập sinh phân tích dữ liệu. Hỗ trợ team data xử lý, trực quan hóa và phân tích dữ liệu nông nghiệp.',
            requirements: '- Python cơ bản\n- Pandas, Matplotlib\n- SQL cơ bản\n- Đang là SV năm 3-4',
            benefits: '- Trợ cấp 3-5tr/tháng\n- Mentor 1-1\n- Cơ hội nhận fulltime',
            careerPath: 'Data Scientist',
            jobType: 'internship',
            salaryRange: { min: 3, max: 5 },
            locationText: 'Cần Thơ, Việt Nam',
            vacancies: 3,
            experienceYears: 0,
            status: 'approved',
            skills: ['Python', 'Data Analysis', 'SQL'],
          },
          {
            title: 'Backend Developer (Python/Django)',
            description: 'Xây dựng API cho platform giáo dục. Django REST Framework, PostgreSQL, Redis.',
            requirements: '- Python, Django/FastAPI\n- PostgreSQL\n- Redis\n- Docker là lợi thế',
            benefits: '- Lương 12-22tr\n- Remote 3 ngày/tuần\n- Stock option',
            careerPath: 'Backend Developer',
            jobType: 'full-time',
            salaryRange: { min: 12, max: 22 },
            locationText: 'Cần Thơ, Việt Nam',
            vacancies: 1,
            experienceYears: 1,
            status: 'pending',
            skills: ['Python', 'Django/FastAPI', 'SQL', 'Docker'],
          },
        ],
      },
      {
        employerEmail: 'hr@vng.local',
        employerName: 'HR VNG Corporation',
        company: {
          name: 'VNG Corporation',
          description: 'Tập đoàn công nghệ hàng đầu Việt Nam, sở hữu Zalo, ZaloPay, và nhiều sản phẩm công nghệ tiêu dùng.',
          industry: 'Công nghệ',
          website: 'https://vng.com.vn',
          size: '1000+',
        },
        jobs: [
          {
            title: 'DevOps Engineer',
            description: 'Quản lý hạ tầng cho hệ thống triệu users. Kubernetes, AWS, monitoring, CI/CD pipeline.',
            requirements: '- Linux, Docker, Kubernetes\n- AWS/GCP\n- CI/CD (Jenkins, GitLab CI)\n- Script: Python/Bash',
            benefits: '- Lương 20-40tr\n- RSU\n- Môi trường top tech',
            careerPath: 'DevOps Engineer',
            jobType: 'full-time',
            salaryRange: { min: 20, max: 40 },
            locationText: 'TP. Hồ Chí Minh, Việt Nam',
            vacancies: 2,
            experienceYears: 2,
            status: 'approved',
            skills: ['Docker', 'Linux', 'CI/CD', 'Cloud Computing', 'Python'],
          },
        ],
      },
    ];

    for (const cData of companiesData) {
      // Upsert employer user
      let employer = await User.findOne({ email: cData.employerEmail });
      if (!employer) {
        employer = await User.create({
          email: cData.employerEmail,
          password: 'Employer@123456',
          fullName: cData.employerName,
          role: 'employer',
          isActive: true,
          isVerified: true,
          authProvider: 'local',
        });
      }

      // Tạo company
      const company = await Company.create({
        employer: employer._id,
        ...cData.company,
      });

      // Tạo job postings
      for (const job of cData.jobs) {
        const skillRefs = [];
        for (const sName of job.skills) {
          const sId = skillMap[sName];
          if (sId) skillRefs.push({ skill: sId, level: 'intermediate' });
        }

        const deadline = new Date();
        deadline.setMonth(deadline.getMonth() + 2);

        await JobPosting.create({
          employer: employer._id,
          company: company._id,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          benefits: job.benefits,
          careerPath: job.careerPath,
          jobType: job.jobType,
          salaryRange: job.salaryRange,
          locationText: job.locationText,
          vacancies: job.vacancies,
          experienceYears: job.experienceYears,
          deadline,
          status: job.status,
          requiredSkills: skillRefs,
          approvedBy: job.status === 'approved' ? admin._id : undefined,
          approvedAt: job.status === 'approved' ? new Date() : undefined,
        });
      }
      console.log(`  ✅ ${cData.company.name}: ${cData.jobs.length} job postings`);
    }

    // Tạo test student nếu chưa có
    const testStudent = await User.findOne({ email: 'test@student.com' });
    if (!testStudent) {
      await User.create({
        email: 'test@student.com',
        password: 'Student@123456',
        fullName: 'Dinh Van Thuan',
        role: 'student',
        isActive: true,
        isVerified: true,
        authProvider: 'local',
      });
      console.log('\n  ✅ Test student created: test@student.com / Student@123456');
    }

    // ==========================================
    // SUMMARY
    // ==========================================
    const roadmapCount = await Roadmap.countDocuments();
    const templateCount = await JobTemplate.countDocuments();
    const jobCount = await JobPosting.countDocuments();
    const companyCount = await Company.countDocuments();

    console.log('\n🎉 Sample data seeded successfully!');
    console.log(`  🛣️ Roadmaps: ${roadmapCount}`);
    console.log(`  💼 Job Templates: ${templateCount}`);
    console.log(`  🏢 Companies: ${companyCount}`);
    console.log(`  📋 Job Postings: ${jobCount} (${await JobPosting.countDocuments({ status: 'approved' })} approved, ${await JobPosting.countDocuments({ status: 'pending' })} pending)`);
    console.log('\n📝 Login credentials:');
    console.log('  Admin: admin@edupath.local / Admin@123456');
    console.log('  Student: test@student.com / Student@123456');
    console.log('  Employer: hr@fpt-software.local / Employer@123456');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();

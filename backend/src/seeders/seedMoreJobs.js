/**
 * Seed bổ sung Job Postings — Game, Embedded, Cybersecurity, AI/ML, QA...
 * Chạy ĐỘC LẬP, KHÔNG xóa data cũ.
 * Lệnh: node src/seeders/seedMoreJobs.js
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Company = require('../models/Company');
const JobPosting = require('../models/JobPosting');

async function main() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ Admin not found.');
      process.exit(1);
    }

    // Skill map
    const allSkills = await Skill.find({});
    const skillMap = {};
    for (const s of allSkills) {
      skillMap[s.name] = s._id;
    }
    console.log(`📋 Found ${allSkills.length} skills`);

    // Dữ liệu công ty + jobs mới
    const newCompaniesData = [
      {
        employerEmail: 'hr@gameloft.local',
        employerName: 'HR Gameloft',
        company: {
          name: 'Gameloft Vietnam',
          description: 'Studio game hàng đầu thuộc Vivendi Group. Phát triển game mobile và console cho thị trường toàn cầu.',
          industry: 'Game Development',
          website: 'https://www.gameloft.com',
          size: '501-1000',
        },
        jobs: [
          {
            title: 'Game Developer (Unity)',
            description: 'Phát triển gameplay, UI systems và game mechanics cho game mobile 3D. Sử dụng Unity Engine, C#, shader programming.',
            requirements: '- C#, Unity Engine\n- Kiến thức 3D math (vector, matrix)\n- OOP, Design Patterns\n- Git\n- Đam mê game',
            benefits: '- Lương 15-30tr\n- Chơi game trong giờ làm việc\n- Game library miễn phí\n- Team building hàng tháng',
            careerPath: 'Game Developer',
            jobType: 'full-time',
            salaryRange: { min: 15, max: 30 },
            locationText: 'TP. Hồ Chí Minh, Việt Nam',
            vacancies: 3,
            experienceYears: 0,
            status: 'approved',
            skills: ['C/C++', 'Software Architecture', 'Git & GitHub'],
          },
          {
            title: 'Game QA Tester',
            description: 'Kiểm thử chất lượng game mobile. Test gameplay, UX, performance trên nhiều thiết bị. Viết bug report chi tiết.',
            requirements: '- Kiến thức testing\n- Hiểu biết về game mechanics\n- Tiếng Anh đọc hiểu\n- Kiên nhẫn, tỉ mỉ',
            benefits: '- Lương 8-15tr\n- Chơi game sớm nhất\n- Đào tạo QA chuyên sâu',
            careerPath: 'QA Engineer',
            jobType: 'full-time',
            salaryRange: { min: 8, max: 15 },
            locationText: 'TP. Hồ Chí Minh, Việt Nam',
            vacancies: 5,
            experienceYears: 0,
            status: 'approved',
            skills: ['Software Testing', 'Agile/Scrum'],
          },
        ],
      },
      {
        employerEmail: 'hr@viettel-cyber.local',
        employerName: 'HR Viettel Cyber Security',
        company: {
          name: 'Viettel Cyber Security',
          description: 'Trung tâm An toàn thông tin thuộc Tập đoàn Viettel. Cung cấp giải pháp bảo mật, SOC, penetration testing cho tổ chức Chính phủ và doanh nghiệp lớn.',
          industry: 'Cybersecurity',
          website: 'https://viettelcybersecurity.com',
          size: '201-500',
        },
        jobs: [
          {
            title: 'Cybersecurity Analyst',
            description: 'Giám sát hệ thống SOC 24/7, phân tích log SIEM, phát hiện và phản ứng sự cố bảo mật. Điều tra các mối đe dọa an ninh mạng.',
            requirements: '- Kiến thức mạng máy tính, TCP/IP\n- Linux administration\n- Hiểu biết OWASP Top 10\n- Log analysis\n- Kiến thức về firewall, IDS/IPS',
            benefits: '- Lương 15-30tr\n- Đào tạo chứng chỉ quốc tế (CEH, OSCP)\n- Bảo hiểm premium\n- Chế độ Viettel Group',
            careerPath: 'Cybersecurity Engineer',
            jobType: 'full-time',
            salaryRange: { min: 15, max: 30 },
            locationText: 'Hà Nội, Việt Nam',
            vacancies: 3,
            experienceYears: 0,
            status: 'approved',
            skills: ['Computer Networking', 'Linux', 'Information Security'],
          },
          {
            title: 'Penetration Tester (Fresher)',
            description: 'Thực hiện kiểm thử xâm nhập cho hệ thống web/mobile/network. Viết báo cáo lỗ hổng bảo mật và đề xuất giải pháp khắc phục.',
            requirements: '- Kiến thức web security (SQL injection, XSS, CSRF)\n- Sử dụng công cụ: Burp Suite, Nmap, Metasploit\n- Linux + scripting (Python/Bash)\n- CTF hoặc bug bounty là lợi thế',
            benefits: '- Lương 12-25tr\n- Tham gia CTF quốc tế\n- Chứng chỉ OSCP/CEH\n- Làm việc với chuyên gia hàng đầu',
            careerPath: 'Cybersecurity Engineer',
            jobType: 'full-time',
            salaryRange: { min: 12, max: 25 },
            locationText: 'Hà Nội, Việt Nam',
            vacancies: 2,
            experienceYears: 0,
            status: 'approved',
            skills: ['Information Security', 'Computer Networking', 'Linux', 'Python'],
          },
        ],
      },
      {
        employerEmail: 'hr@renesas.local',
        employerName: 'HR Renesas Design Vietnam',
        company: {
          name: 'Renesas Design Vietnam',
          description: 'Chi nhánh thiết kế chip của Renesas Electronics (Nhật Bản). Phát triển vi mạch, firmware, hệ thống nhúng cho automotive và IoT.',
          industry: 'Semiconductor / Embedded',
          website: 'https://www.renesas.com',
          size: '201-500',
        },
        jobs: [
          {
            title: 'Embedded Software Engineer',
            description: 'Phát triển firmware cho vi điều khiển automotive. Lập trình C/C++ trên MCU, giao tiếp giao thức CAN/SPI/I2C, RTOS.',
            requirements: '- C/C++ embedded\n- Vi điều khiển ARM Cortex-M\n- Giao thức: SPI, I2C, UART, CAN\n- RTOS (FreeRTOS)\n- Đọc datasheet tiếng Anh',
            benefits: '- Lương 15-28tr\n- Onsite Nhật Bản 3-6 tháng\n- Đào tạo chip design\n- Thưởng 3-5 tháng lương',
            careerPath: 'Embedded Systems',
            jobType: 'full-time',
            salaryRange: { min: 15, max: 28 },
            locationText: 'TP. Hồ Chí Minh, Việt Nam',
            vacancies: 4,
            experienceYears: 0,
            status: 'approved',
            skills: ['C/C++', 'Computer Networking'],
          },
          {
            title: 'IoT Firmware Developer (Intern)',
            description: 'Thực tập phát triển firmware IoT. Lập trình ESP32, STM32, giao tiếp BLE/WiFi, cảm biến. Dự án smart home / smart agriculture.',
            requirements: '- C cơ bản\n- Arduino hoặc ESP32\n- Hiểu biết điện tử cơ bản\n- Đang học năm 3-4 CNTT/Điện tử',
            benefits: '- Trợ cấp 5-8tr\n- Mentor 1-1\n- Devkit miễn phí\n- Cơ hội fulltime',
            careerPath: 'Embedded Systems',
            jobType: 'internship',
            salaryRange: { min: 5, max: 8 },
            locationText: 'TP. Hồ Chí Minh, Việt Nam',
            vacancies: 3,
            experienceYears: 0,
            status: 'approved',
            skills: ['C/C++'],
          },
        ],
      },
      {
        employerEmail: 'hr@zalo-ai.local',
        employerName: 'HR Zalo AI Lab',
        company: {
          name: 'Zalo AI Lab (VNG)',
          description: 'Phòng nghiên cứu AI của VNG. Phát triển các sản phẩm AI cho Zalo: nhận dạng khuôn mặt, NLP, chatbot, recommendation system.',
          industry: 'AI / Machine Learning',
          website: 'https://ai.zalo.ai',
          size: '51-200',
        },
        jobs: [
          {
            title: 'AI/ML Engineer',
            description: 'Nghiên cứu và phát triển mô hình NLP/Computer Vision cho sản phẩm Zalo. Training, fine-tuning LLMs, deploy mô hình production.',
            requirements: '- Python, PyTorch/TensorFlow\n- NLP hoặc Computer Vision\n- Model training & evaluation\n- Docker, Linux\n- Đọc paper nghiên cứu',
            benefits: '- Lương 20-45tr\n- GPU cluster\n- Conference quốc tế\n- Publish paper',
            careerPath: 'AI/ML Engineer',
            jobType: 'full-time',
            salaryRange: { min: 20, max: 45 },
            locationText: 'TP. Hồ Chí Minh, Việt Nam',
            vacancies: 2,
            experienceYears: 1,
            status: 'approved',
            skills: ['Python', 'Machine Learning', 'Deep Learning', 'Docker'],
          },
          {
            title: 'Data Engineer',
            description: 'Xây dựng data pipeline cho hệ thống recommendation Zalo. ETL, data warehouse, Spark, Kafka.',
            requirements: '- Python, SQL\n- Apache Spark / Kafka\n- Data modeling\n- Cloud (AWS/GCP)\n- Docker',
            benefits: '- Lương 18-35tr\n- Big data platform\n- Chương trình ESOP',
            careerPath: 'Data Scientist',
            jobType: 'full-time',
            salaryRange: { min: 18, max: 35 },
            locationText: 'TP. Hồ Chí Minh, Việt Nam',
            vacancies: 2,
            experienceYears: 1,
            status: 'approved',
            skills: ['Python', 'SQL', 'Data Analysis', 'Docker', 'Cloud Computing'],
          },
        ],
      },
      {
        employerEmail: 'hr@axon.local',
        employerName: 'HR Axon Active',
        company: {
          name: 'Axon Active Vietnam',
          description: 'Nearshore software development company từ Thụy Sĩ. Chuyên Agile development, Scrum, phát triển sản phẩm chất lượng cao.',
          industry: 'Software Development',
          website: 'https://www.axonactive.com',
          size: '201-500',
        },
        jobs: [
          {
            title: 'Frontend Developer (Angular)',
            description: 'Phát triển ứng dụng web enterprise với Angular, TypeScript. Làm việc trực tiếp với PM Thụy Sĩ.',
            requirements: '- Angular 17+\n- TypeScript, RxJS\n- HTML/SCSS\n- Unit testing (Jasmine/Karma)\n- Agile/Scrum',
            benefits: '- Lương 14-25tr\n- Remote flexible\n- Swiss quality training\n- Team Tết bonus',
            careerPath: 'Frontend Developer',
            jobType: 'full-time',
            salaryRange: { min: 14, max: 25 },
            locationText: 'Đà Nẵng, Việt Nam',
            vacancies: 2,
            experienceYears: 1,
            status: 'approved',
            skills: ['JavaScript', 'TypeScript', 'HTML/CSS', 'Software Testing', 'Agile/Scrum'],
          },
          {
            title: 'Automation Tester',
            description: 'Xây dựng framework automation testing cho dự án SaaS. Cypress, Playwright, API testing.',
            requirements: '- JavaScript/TypeScript\n- Cypress hoặc Playwright\n- API testing (Postman, REST)\n- CI/CD integration\n- Agile/Scrum',
            benefits: '- Lương 12-22tr\n- Chứng chỉ ISTQB\n- Remote 3 ngày/tuần',
            careerPath: 'QA Engineer',
            jobType: 'full-time',
            salaryRange: { min: 12, max: 22 },
            locationText: 'Đà Nẵng, Việt Nam',
            vacancies: 1,
            experienceYears: 0,
            status: 'approved',
            skills: ['Software Testing', 'JavaScript', 'Agile/Scrum', 'CI/CD'],
          },
        ],
      },
      {
        employerEmail: 'hr@bosch.local',
        employerName: 'HR Bosch Vietnam',
        company: {
          name: 'Robert Bosch Engineering Vietnam',
          description: 'Trung tâm R&D của Bosch tại Việt Nam. Phát triển phần mềm automotive, IoT, smart manufacturing.',
          industry: 'Automotive / IoT',
          website: 'https://www.bosch.com.vn',
          size: '1000+',
        },
        jobs: [
          {
            title: 'Embedded C Developer (Automotive)',
            description: 'Phát triển phần mềm ECU cho hệ thống phanh ABS/ESP. Lập trình C theo chuẩn AUTOSAR, MISRA-C.',
            requirements: '- C embedded, AUTOSAR\n- Vi xử lý automotive\n- Giao thức CAN, LIN\n- JIRA, Confluence\n- Tiếng Anh/Đức giao tiếp',
            benefits: '- Lương 18-35tr\n- Training tại Đức\n- Chế độ Bosch toàn cầu\n- 13.5 tháng lương',
            careerPath: 'Embedded Systems',
            jobType: 'full-time',
            salaryRange: { min: 18, max: 35 },
            locationText: 'TP. Hồ Chí Minh, Việt Nam',
            vacancies: 3,
            experienceYears: 1,
            status: 'approved',
            skills: ['C/C++', 'Software Testing', 'Git & GitHub'],
          },
        ],
      },
    ];

    let totalCreated = 0;

    for (const cData of newCompaniesData) {
      // Upsert employer
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

      // Upsert company
      let company = await Company.findOne({ employer: employer._id });
      if (!company) {
        company = await Company.create({
          employer: employer._id,
          ...cData.company,
        });
      }

      // Tạo jobs (kiểm tra trùng title)
      for (const job of cData.jobs) {
        const exists = await JobPosting.findOne({
          employer: employer._id,
          title: job.title,
        });
        if (exists) {
          console.log(`  ⏭️ Skip (exists): ${job.title}`);
          continue;
        }

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
        totalCreated++;
      }
      console.log(`  ✅ ${cData.company.name}: ${cData.jobs.length} jobs`);
    }

    const totalJobs = await JobPosting.countDocuments();
    const approvedJobs = await JobPosting.countDocuments({ status: 'approved' });

    console.log(`\n🎉 Thêm ${totalCreated} job postings mới!`);
    console.log(`📊 Tổng: ${totalJobs} jobs (${approvedJobs} approved)`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();

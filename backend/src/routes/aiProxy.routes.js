/**
 * AI Proxy Routes — /api/ai/*
 * Backend Node.js query DB → gửi data JSON → Python AI Service (:8000)
 * 
 * Flow: Frontend → Backend (auth + DB query) → Python (AI) → Response
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const env = require('../config/env');

// Models
const AcademicProfile = require('../models/AcademicProfile');
const CareerPreference = require('../models/CareerPreference');
const StudentSkill = require('../models/StudentSkill');
const Roadmap = require('../models/Roadmap');
const JobPosting = require('../models/JobPosting');
const ChatHistory = require('../models/ChatHistory');

const AI_URL = env.AI_SERVICE_URL;

// Middleware: auth cho tất cả routes
router.use(protect);
router.use(authorize('student'));

// ==================== ROADMAP AI ====================

router.post('/suggest-roadmap', async (req, res) => {
  try {
    const studentId = req.user._id;

    // Thu thập 7 nguồn dữ liệu (request_ai.md 1.1)
    const [careerPreference, academicProfile, studentSkills, availableRoadmaps] = await Promise.all([
      CareerPreference.findOne({ student: studentId }).lean(),
      AcademicProfile.findOne({ student: studentId })
        .populate('courseGrades.course', 'name code courseType relatedSkills')
        .lean(),
      StudentSkill.find({ student: studentId })
        .populate('skill', 'name category')
        .lean(),
      Roadmap.find({ isActive: true })
        .populate('skills.skill', 'name category')
        .lean(),
    ]);

    // Chuẩn hóa data cho Python (flatten populated fields)
    const preparedSkills = (studentSkills || []).map(ss => ({
      skillName: ss.skill?.name || 'N/A',
      category: ss.skill?.category || '',
      proficiencyLevel: ss.proficiencyLevel || 1,
      source: ss.source || 'manual',
    }));

    const preparedRoadmaps = (availableRoadmaps || []).map(r => ({
      title: r.title,
      careerPath: r.careerPath,
      difficulty: r.difficulty,
      estimatedMonths: r.estimatedMonths,
      skillNames: r.skills?.map(s => s.skill?.name).filter(Boolean) || [],
    }));

    const preparedProfile = academicProfile ? {
      gpa: academicProfile.gpa,
      completedCredits: academicProfile.completedCredits,
      currentSemester: academicProfile.currentSemester,
      courseGrades: (academicProfile.courseGrades || []).map(cg => ({
        courseName: cg.course?.name || cg.courseName || 'N/A',
        courseCode: cg.course?.code || '',
        numericGrade: cg.numericGrade,
        letterGrade: cg.letterGrade,
      })),
    } : null;

    // Gọi Python AI Service
    const response = await fetch(`${AI_URL}/ai/suggest-roadmap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        careerPreference,
        academicProfile: preparedProfile,
        studentSkills: preparedSkills,
        availableRoadmaps: preparedRoadmaps,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      return res.status(response.status).json({ success: false, message: err.detail || 'AI service error' });
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('❌ AI Roadmap error:', error.message);
    if (error.name === 'TimeoutError') {
      return res.status(504).json({ success: false, message: 'AI Service timeout. Vui lòng thử lại.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== JOB AI ====================

router.post('/suggest-jobs', async (req, res) => {
  try {
    const studentId = req.user._id;

    const [studentSkills, careerPreference, jobs] = await Promise.all([
      StudentSkill.find({ student: studentId })
        .populate('skill', 'name category')
        .lean(),
      CareerPreference.findOne({ student: studentId }).lean(),
      JobPosting.find({ status: 'approved' })
        .populate('company', 'name logo')
        .populate('requiredSkills.skill', 'name category')
        .populate('location', 'city district')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    // Chuẩn hóa data
    const preparedSkills = (studentSkills || []).map(ss => ({
      skillName: ss.skill?.name || 'N/A',
      proficiencyLevel: ss.proficiencyLevel || 1,
      source: ss.source || 'manual',
    }));

    const preparedJobs = (jobs || []).map(job => ({
      _id: job._id.toString(),
      title: job.title,
      companyName: job.company?.name || 'N/A',
      jobType: job.jobType,
      salaryRange: job.salaryRange,
      requiredSkillNames: job.requiredSkills?.map(s => s.skill?.name).filter(Boolean) || [],
      locationText: job.locationText || '',
    }));

    const response = await fetch(`${AI_URL}/ai/suggest-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentSkills: preparedSkills,
        careerPreference,
        jobs: preparedJobs,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      return res.status(response.status).json({ success: false, message: err.detail || 'AI service error' });
    }

    const result = await response.json();

    // Enrich matched jobs với data thật từ DB
    if (result.data?.matchedJobs) {
      result.data.matchedJobs = result.data.matchedJobs.map(mj => {
        const fullJob = jobs.find(j => j._id.toString() === mj.jobId);
        return { ...mj, job: fullJob || null };
      }).filter(mj => mj.job);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ AI Jobs error:', error.message);
    if (error.name === 'TimeoutError') {
      return res.status(504).json({ success: false, message: 'AI Service timeout. Vui lòng thử lại.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== CHATBOT AI (SSE Proxy) ====================

router.post('/chat', async (req, res) => {
  try {
    const studentId = req.user._id;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Tin nhắn không được rỗng.' });
    }

    // Thu thập context data từ DB
    const [academicProfile, careerPref, skills, roadmaps, myRoadmaps] = await Promise.all([
      AcademicProfile.findOne({ student: studentId }).lean(),
      CareerPreference.findOne({ student: studentId }).lean(),
      StudentSkill.find({ student: studentId }).populate('skill', 'name').lean(),
      Roadmap.find({ isActive: true }).select('title careerPath difficulty estimatedMonths').lean(),
      // Lấy lộ trình đang học (nếu có model StudentRoadmap)
      Promise.resolve([]),
    ]);

    const contextData = {
      studentProfile: academicProfile ? {
        fullName: req.user.fullName || req.user.email,
        gpa: academicProfile.gpa,
        completedCredits: academicProfile.completedCredits,
      } : { fullName: req.user.fullName || req.user.email },
      careerPref,
      skills: (skills || []).map(s => ({ skillName: s.skill?.name || 'N/A' })),
      roadmaps: (roadmaps || []).map(r => ({
        title: r.title, careerPath: r.careerPath,
        difficulty: r.difficulty, estimatedMonths: r.estimatedMonths,
      })),
      myRoadmaps,
    };

    // Lấy lịch sử chat gần nhất
    const chatHistory = await ChatHistory.findOne({ student: studentId })
      .sort({ updatedAt: -1 })
      .lean();
    const history = (chatHistory?.messages || []).slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    // SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Gọi Python AI Service (SSE proxy)
    const aiResponse = await fetch(`${AI_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, contextData }),
      signal: AbortSignal.timeout(120000),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text().catch(() => 'AI service error');
      res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
      res.end();
      return;
    }

    // Stream response từ Python → Frontend
    let fullResponse = '';
    const reader = aiResponse.body;
    const decoder = new TextDecoder();

    for await (const chunk of reader) {
      const text = decoder.decode(chunk, { stream: true });
      // Python trả SSE format "data: {...}\n\n", forward trực tiếp
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          res.write(line + '\n\n');
          // Thu thập full response để lưu history
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.text) fullResponse += payload.text;
          } catch { /* skip */ }
        }
      }
    }

    res.end();

    // Lưu chat history (async, không block response)
    if (fullResponse) {
      try {
        await ChatHistory.findOneAndUpdate(
          { student: studentId },
          {
            $push: {
              messages: {
                $each: [
                  { role: 'user', content: message },
                  { role: 'assistant', content: fullResponse },
                ],
              },
            },
            $setOnInsert: { student: studentId },
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('Save chat history error:', err.message);
      }
    }
  } catch (error) {
    console.error('❌ AI Chat error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

// ==================== CHAT HISTORY ====================

router.get('/chat/history', async (req, res) => {
  try {
    const chatHistory = await ChatHistory.findOne({ student: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ success: true, data: chatHistory?.messages || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/chat/history', async (req, res) => {
  try {
    await ChatHistory.deleteMany({ student: req.user._id });
    res.json({ success: true, message: 'Đã xóa lịch sử chat.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

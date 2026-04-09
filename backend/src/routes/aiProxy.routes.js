/**
 * AI Proxy Routes — /api/ai/*
 * Backend Node.js lấy cached AI profile → gửi Python AI Service (:8000)
 * 
 * Optimization:
 * - Dùng StudentAIProfile (pre-computed) thay vì query 5 collections
 * - Cache AIPersonalizedRoadmap (lần 1 gọi AI, lần sau instant)
 * 
 * Flow: Frontend → Backend (cached profile) → Python (AI) → Response
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const env = require('../config/env');

// Models
const Roadmap = require('../models/Roadmap');
const JobPosting = require('../models/JobPosting');
const ChatHistory = require('../models/ChatHistory');
const AIPersonalizedRoadmap = require('../models/AIPersonalizedRoadmap');

// Services
const aiProfileService = require('../services/studentAIProfile.service');

const AI_URL = env.AI_SERVICE_URL;

// Middleware: auth cho tất cả routes
router.use(protect);
router.use(authorize('student'));

// ==================== ROADMAP AI ====================

router.post('/suggest-roadmap', async (req, res) => {
  try {
    const studentId = req.user._id;

    // 1. Check cache AIPersonalizedRoadmap (instant!)
    const cached = await AIPersonalizedRoadmap.findOne({
      student: studentId,
      isValid: true,
      expiresAt: { $gt: new Date() },
    }).sort({ generatedAt: -1 }).lean();

    if (cached) {
      return res.json({
        success: true,
        data: {
          analysis: cached.analysis,
          suggestedCareerPaths: cached.suggestedCareerPaths,
          personalizedRoadmap: cached.personalizedRoadmap,
          advice: cached.advice,
        },
        cached: true,
      });
    }

    // 2. Lấy AI Profile (pre-computed, 1 query) + roadmaps mẫu
    const [aiProfile, availableRoadmaps] = await Promise.all([
      aiProfileService.getOrCreate(studentId, req.user.fullName || req.user.email),
      Roadmap.find({ isActive: true })
        .populate('skills.skill', 'name category')
        .lean(),
    ]);

    // Chuẩn bị data cho Python (dùng pre-computed data)
    const preparedRoadmaps = (availableRoadmaps || []).map(r => ({
      title: r.title,
      careerPath: r.careerPath,
      difficulty: r.difficulty,
      estimatedMonths: r.estimatedMonths,
      skillNames: r.skills?.map(s => s.skill?.name).filter(Boolean) || [],
    }));

    // 3. Gọi Python AI Service
    const response = await fetch(`${AI_URL}/ai/suggest-roadmap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Gửi pre-computed data thay vì raw data
        careerPreference: aiProfile.careerData || {},
        academicProfile: aiProfile.profileData || {},
        studentSkills: aiProfile.skillsData || [],
        availableRoadmaps: preparedRoadmaps,
        // Thêm summaries cho context
        summaries: {
          profile: aiProfile.profileSummary,
          career: aiProfile.careerSummary,
          skills: aiProfile.skillsSummary,
          academic: aiProfile.academicSummary,
        },
      }),
      signal: AbortSignal.timeout(180000),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      return res.status(response.status).json({ success: false, message: err.detail || 'AI service error' });
    }

    const result = await response.json();

    // 4. Cache kết quả AI → AIPersonalizedRoadmap
    if (result.success && result.data) {
      AIPersonalizedRoadmap.create({
        student: studentId,
        analysis: result.data.analysis || {},
        suggestedCareerPaths: result.data.suggestedCareerPaths || [],
        personalizedRoadmap: result.data.personalizedRoadmap || {},
        advice: result.data.advice || '',
        modelUsed: 'google/gemma-4-31b-it:free',
        profileDataHash: aiProfile.dataHash || '',
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isValid: true,
      }).catch(err => console.error('Cache AI roadmap error:', err));
    }

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

    // Lấy AI Profile (pre-computed) + jobs
    const [aiProfile, jobs] = await Promise.all([
      aiProfileService.getOrCreate(studentId, req.user.fullName || req.user.email),
      JobPosting.find({ status: 'approved' })
        .populate('company', 'name logo')
        .populate('requiredSkills.skill', 'name category')
        .populate('location', 'city district')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

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
        studentSkills: aiProfile.skillsData || [],
        careerPreference: aiProfile.careerData || {},
        jobs: preparedJobs,
        summaries: {
          profile: aiProfile.profileSummary,
          career: aiProfile.careerSummary,
          skills: aiProfile.skillsSummary,
        },
      }),
      signal: AbortSignal.timeout(180000),
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

    // Lấy AI Profile (pre-computed, 1 query thay vì 5)
    const aiProfile = await aiProfileService.getOrCreate(
      studentId, req.user.fullName || req.user.email
    );

    const contextData = {
      studentProfile: {
        fullName: aiProfile.profileData?.fullName || req.user.fullName || req.user.email,
        gpa: aiProfile.profileData?.gpa || 0,
        completedCredits: aiProfile.profileData?.completedCredits || 0,
      },
      careerSummary: aiProfile.careerSummary || '',
      skillsSummary: aiProfile.skillsSummary || '',
      academicSummary: aiProfile.academicSummary || '',
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
      signal: AbortSignal.timeout(180000),
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
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          res.write(line + '\n\n');
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

/**
 * AI Proxy Routes — /api/ai/*
 * Chỉ còn Chatbot (SSE streaming via Python AI Service)
 * Roadmap + Jobs suggestions đã chuyển sang thuật toán CB+CF (không cần AI)
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const env = require('../config/env');

const ChatHistory = require('../models/ChatHistory');
const aiProfileService = require('../services/studentAIProfile.service');

const AI_URL = env.AI_SERVICE_URL;

router.use(protect);
router.use(authorize('student'));

// ==================== CHATBOT AI (SSE Proxy) ====================

router.post('/chat', async (req, res) => {
  try {
    const studentId = req.user._id;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Tin nhắn không được rỗng.' });
    }

    const aiProfile = await aiProfileService.getOrCreate(
      studentId, req.user.fullName || req.user.email
    );

    // Lấy thêm lộ trình đã đăng ký + tiến độ
    const PersonalRoadmap = require('../models/PersonalRoadmap');
    const enrolledRoadmaps = await PersonalRoadmap.find({
      student: studentId, status: { $ne: 'cancelled' },
    }).populate('roadmap', 'title careerPath').lean();

    const enrolledNames = enrolledRoadmaps.map(pr => {
      const title = pr.roadmap?.title || 'N/A';
      const total = pr.sessions?.length || 0;
      const done = (pr.sessions || []).filter(s => s.completed).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return `${title} (${pct}% hoàn thành)`;
    });

    const totalSessions = enrolledRoadmaps.reduce((sum, pr) => sum + (pr.sessions?.length || 0), 0);
    const doneSessions = enrolledRoadmaps.reduce((sum, pr) =>
      sum + (pr.sessions || []).filter(s => s.completed).length, 0);

    const contextData = {
      studentProfile: {
        fullName: aiProfile.profileData?.fullName || req.user.fullName || req.user.email,
        gpa: aiProfile.profileData?.gpa || 0,
        completedCredits: aiProfile.profileData?.completedCredits || 0,
        currentSemester: aiProfile.profileData?.currentSemester || 1,
      },
      careerSummary: aiProfile.careerSummary || '',
      skillsSummary: aiProfile.skillsSummary || '',
      academicSummary: aiProfile.academicSummary || '',
      enrolledRoadmaps: enrolledNames.length > 0 ? enrolledNames.join(', ') : '',
      progressSummary: totalSessions > 0
        ? `${doneSessions}/${totalSessions} buổi (${Math.round((doneSessions / totalSessions) * 100)}%)`
        : '',
    };

    const chatHistory = await ChatHistory.findOne({ student: studentId })
      .sort({ updatedAt: -1 })
      .lean();
    const history = (chatHistory?.messages || []).slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

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

    if (fullResponse) {
      ChatHistory.findOneAndUpdate(
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
      ).catch(err => console.error('Save chat history error:', err.message));
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

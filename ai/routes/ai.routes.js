/**
 * AI Routes — /api/ai/*
 * Tất cả endpoints AI: roadmap, jobs, chatbot
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../backend/src/middleware/auth');

// Controllers
const aiRoadmap = require('../controllers/aiRoadmap.controller');
const aiJob = require('../controllers/aiJob.controller');
const aiChatbot = require('../controllers/aiChatbot.controller');

// Middleware: tất cả routes yêu cầu auth (student only)
router.use(protect);
router.use(authorize('student'));

// === Roadmap AI ===
router.post('/suggest-roadmap', aiRoadmap.suggestRoadmap);

// === Job AI ===
router.post('/suggest-jobs', aiJob.suggestJobs);

// === Chatbot AI ===
router.post('/chat', aiChatbot.chat);
router.get('/chat/history', aiChatbot.getHistory);
router.delete('/chat/history', aiChatbot.clearHistory);

module.exports = router;

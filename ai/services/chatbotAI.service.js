/**
 * AI Chatbot Service — Chat DB + Free chat + Streaming
 */
const AcademicProfile = require('../../backend/src/models/AcademicProfile');
const CareerPreference = require('../../backend/src/models/CareerPreference');
const StudentSkill = require('../../backend/src/models/StudentSkill');
const Roadmap = require('../../backend/src/models/Roadmap');
const PersonalRoadmap = require('../../backend/src/models/PersonalRoadmap');
const User = require('../../backend/src/models/User');
const ChatHistory = require('../models/ChatHistory');
const { chatStream } = require('./aiClient');
const { CHATBOT_SYSTEM_PROMPT, buildChatContext } = require('../prompts/chatbotPrompt');

class ChatbotAIService {
  /**
   * Chat streaming — trả về AsyncGenerator<string>
   */
  async *chat(studentId, userMessage) {
    // 1. Lấy context data từ DB
    const contextData = await this._getContextData(studentId);
    const contextStr = buildChatContext(contextData);
    const systemPrompt = CHATBOT_SYSTEM_PROMPT + contextStr;

    // 2. Lấy lịch sử chat (10 tin gần nhất)
    let chatHistory = await ChatHistory.findOne({ student: studentId });
    const history = chatHistory?.messages?.slice(-10) || [];

    // 3. Stream response
    let fullResponse = '';
    const stream = chatStream(history, userMessage, {
      systemInstruction: systemPrompt,
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      fullResponse += chunk;
      yield chunk;
    }

    // 4. Lưu lịch sử
    await this._saveHistory(studentId, userMessage, fullResponse);
  }

  /**
   * Lấy context data cho chatbot
   */
  async _getContextData(studentId) {
    const [user, academicProfile, careerPref, skills, roadmaps, myRoadmaps] = await Promise.all([
      User.findById(studentId).select('fullName').lean(),
      AcademicProfile.findOne({ student: studentId }).select('gpa completedCredits').lean(),
      CareerPreference.findOne({ student: studentId }).lean(),
      StudentSkill.find({ student: studentId }).populate('skill', 'name').lean(),
      Roadmap.find({ isActive: true }).select('title careerPath difficulty estimatedMonths').lean(),
      PersonalRoadmap.find({ student: studentId, status: { $ne: 'cancelled' } })
        .populate('roadmap', 'title')
        .select('roadmap status progress')
        .lean(),
    ]);

    return {
      studentProfile: { fullName: user?.fullName, gpa: academicProfile?.gpa, completedCredits: academicProfile?.completedCredits },
      careerPref,
      skills,
      roadmaps,
      myRoadmaps,
    };
  }

  /**
   * Lưu lịch sử chat
   */
  async _saveHistory(studentId, userMessage, assistantResponse) {
    let chatHistory = await ChatHistory.findOne({ student: studentId });

    if (!chatHistory) {
      chatHistory = new ChatHistory({
        student: studentId,
        messages: [],
      });
    }

    chatHistory.messages.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantResponse }
    );

    // Giữ tối đa 50 messages
    if (chatHistory.messages.length > 50) {
      chatHistory.messages = chatHistory.messages.slice(-50);
    }

    await chatHistory.save();
  }

  /**
   * Lấy lịch sử chat
   */
  async getHistory(studentId) {
    const history = await ChatHistory.findOne({ student: studentId }).lean();
    return history?.messages || [];
  }

  /**
   * Xóa lịch sử chat
   */
  async clearHistory(studentId) {
    await ChatHistory.deleteMany({ student: studentId });
  }
}

module.exports = new ChatbotAIService();

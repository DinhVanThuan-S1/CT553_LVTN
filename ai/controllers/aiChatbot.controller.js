/**
 * AI Chatbot Controller — SSE Streaming
 */
const chatbotAI = require('../services/chatbotAI.service');

/**
 * POST /api/ai/chat
 * Chat streaming (SSE)
 * Body: { message: string }
 */
exports.chat = async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) {
    return res.status(400).json({ success: false, message: 'Tin nhắn không được để trống' });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // nginx
  res.flushHeaders();

  try {
    const stream = chatbotAI.chat(req.user._id, message.trim());

    for await (const chunk of stream) {
      // SSE format: data: <text>\n\n
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    // Kết thúc
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('AI Chat error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Lỗi AI' })}\n\n`);
    res.end();
  }
};

/**
 * GET /api/ai/chat/history
 * Lấy lịch sử chat
 */
exports.getHistory = async (req, res) => {
  try {
    const messages = await chatbotAI.getHistory(req.user._id);
    res.json({ success: true, data: messages });
  } catch (err) {
    console.error('Chat history error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * DELETE /api/ai/chat/history
 * Xóa lịch sử chat
 */
exports.clearHistory = async (req, res) => {
  try {
    await chatbotAI.clearHistory(req.user._id);
    res.json({ success: true, message: 'Đã xóa lịch sử chat' });
  } catch (err) {
    console.error('Clear history error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

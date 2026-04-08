/**
 * AI Client — Dual provider
 * PRIMARY: Ollama (local, no quota)
 * FALLBACK: Gemini API (khi Ollama không có sẵn)
 * 
 * Theo request_ai.md: "Ollama hoặc thuật toán gợi ý"
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../../backend/src/config/env');

// ============ OLLAMA (PRIMARY) ============

const OLLAMA_BASE = env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = env.OLLAMA_MODEL || 'llama3.1';

/**
 * Check Ollama có sẵn không
 */
async function isOllamaAvailable() {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { 
      signal: AbortSignal.timeout(3000) 
    });
    if (!res.ok) return false;
    const data = await res.json();
    // Kiểm tra model requested có trong list không
    const models = data.models || [];
    return models.some(m => m.name.includes(OLLAMA_MODEL.split(':')[0]));
  } catch {
    return false;
  }
}

/**
 * Gọi Ollama (non-streaming)
 */
async function callOllama(prompt, { system = '', temperature = 0.7 } = {}) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: { temperature, num_predict: 4096 },
    }),
    signal: AbortSignal.timeout(120000), // 2 phút timeout
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.status);
    throw new Error(`Ollama error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.message?.content || data.response || '';
}

/**
 * Gọi Ollama streaming (chat format)
 */
async function* streamOllama(messages, { temperature = 0.7 } = {}) {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: true,
      options: { temperature, num_predict: 2048 },
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.status);
    throw new Error(`Ollama stream error ${res.status}: ${err}`);
  }

  const reader = res.body;
  const decoder = new TextDecoder();
  for await (const chunk of reader) {
    const lines = decoder.decode(chunk, { stream: true }).split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        const text = data.message?.content || '';
        if (text) yield text;
      } catch { /* skip */ }
    }
  }
}

// ============ GEMINI (FALLBACK) ============

let genAI = null;
function getGemini() {
  if (!genAI && env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return genAI;
}

async function callGemini(prompt, { systemInstruction = '', temperature = 0.7, maxTokens = 4096 } = {}) {
  const ai = getGemini();
  if (!ai) throw new Error('GEMINI_API_KEY not configured');

  const model = ai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemInstruction || undefined,
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function* streamGeminiChat(systemPrompt, history, userMessage, { temperature = 0.7 } = {}) {
  const ai = getGemini();
  if (!ai) throw new Error('GEMINI_API_KEY not configured');

  const model = ai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt || undefined,
    generationConfig: { temperature, maxOutputTokens: 4096 },
  });

  const geminiHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessageStream(userMessage);
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

// ============ SMART ROUTER ============

/**
 * generateText — Ollama primary, Gemini fallback
 * Dùng cho: roadmap generation, job suggestions (non-streaming)
 */
async function generateText(prompt, options = {}) {
  const ollamaOk = await isOllamaAvailable();

  if (ollamaOk) {
    try {
      console.log(`🦙 Calling Ollama (${OLLAMA_MODEL})...`);
      const result = await callOllama(prompt, {
        system: options.systemInstruction || '',
        temperature: options.temperature ?? 0.7,
      });
      console.log('✅ Ollama response OK');
      return result;
    } catch (err) {
      console.warn('⚠️ Ollama failed:', err.message);
    }
  } else {
    console.log('🦙 Ollama not available, trying Gemini...');
  }

  // Gemini fallback
  if (env.GEMINI_API_KEY) {
    try {
      console.log('✨ Calling Gemini...');
      const result = await callGemini(prompt, options);
      console.log('✅ Gemini response OK');
      return result;
    } catch (err) {
      console.warn('⚠️ Gemini failed:', err.message);
      throw new Error(`AI không khả dụng. Ollama: không kết nối được. Gemini: ${err.message.substring(0, 100)}`);
    }
  }

  throw new Error('Không có AI provider nào được cấu hình. Hãy chạy Ollama hoặc thêm GEMINI_API_KEY.');
}

/**
 * chatStream — Ollama primary, Gemini fallback
 * Dùng cho: chatbot streaming
 */
async function* chatStream(history, userMessage, options = {}) {
  const systemPrompt = options.systemInstruction || '';
  const ollamaOk = await isOllamaAvailable();

  if (ollamaOk) {
    try {
      console.log(`🦙 Chatting with Ollama (${OLLAMA_MODEL})...`);
      // Build messages array cho Ollama chat format
      const messages = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      for (const msg of history) {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
      messages.push({ role: 'user', content: userMessage });

      let hasYielded = false;
      const gen = streamOllama(messages, { temperature: options.temperature ?? 0.7 });
      for await (const chunk of gen) {
        hasYielded = true;
        yield chunk;
      }
      if (hasYielded) return;
    } catch (err) {
      console.warn('⚠️ Ollama chat failed:', err.message);
    }
  }

  // Gemini fallback
  if (env.GEMINI_API_KEY) {
    try {
      console.log('✨ Chatting with Gemini...');
      const gen = streamGeminiChat(systemPrompt, history, userMessage, { temperature: options.temperature ?? 0.7 });
      for await (const chunk of gen) {
        yield chunk;
      }
      return;
    } catch (err) {
      console.warn('⚠️ Gemini chat failed:', err.message);
    }
  }

  throw new Error('AI không khả dụng. Vui lòng chạy: ollama pull ' + OLLAMA_MODEL);
}

// generateStream — alias của chatStream cho backwards compat
async function* generateStream(prompt, options = {}) {
  const messages = [];
  if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
  messages.push({ role: 'user', content: prompt });
  yield* streamOllama(messages, { temperature: options.temperature });
}

module.exports = { generateText, generateStream, chatStream, isOllamaAvailable };

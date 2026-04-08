/**
 * AI Client — Dual provider: Gemini (primary) + Ollama (fallback)
 * Auto-fallback khi Gemini trả 429 (quota exceeded)
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../../backend/src/config/env');

// ============ GEMINI ============
let genAI = null;
function getGemini() {
  if (!genAI && env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Gọi Gemini (non-streaming) → trả text
 */
async function callGemini(prompt, { systemInstruction = '', temperature = 0.7, maxTokens = 4096 } = {}) {
  const ai = getGemini();
  if (!ai) throw new Error('GEMINI_API_KEY not configured');

  const model = ai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemInstruction || undefined,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Gọi Gemini streaming → trả AsyncGenerator<string>
 */
async function* streamGemini(prompt, { systemInstruction = '', temperature = 0.7, maxTokens = 4096 } = {}) {
  const ai = getGemini();
  if (!ai) throw new Error('GEMINI_API_KEY not configured');

  const model = ai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemInstruction || undefined,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });

  const result = await model.generateContentStream(prompt);
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

/**
 * Gọi Gemini chat (multi-turn) streaming
 * Collect all chunks first for error detection, then yield
 */
async function* streamGeminiChat(history, userMessage, { systemInstruction = '', temperature = 0.7 } = {}) {
  const ai = getGemini();
  if (!ai) throw new Error('GEMINI_API_KEY not configured');

  const model = ai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemInstruction || undefined,
    generationConfig: { temperature, maxOutputTokens: 4096 },
  });

  // Convert history format → Gemini format
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

// ============ OLLAMA FALLBACK ============

/**
 * Gọi Ollama (non-streaming)
 */
async function callOllama(prompt, { system = '', temperature = 0.7 } = {}) {
  const baseUrl = env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.OLLAMA_MODEL || 'llama3.2',
      prompt,
      system,
      stream: false,
      options: { temperature },
    }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data.response;
}

/**
 * Gọi Ollama streaming
 */
async function* streamOllama(prompt, { system = '', temperature = 0.7 } = {}) {
  const baseUrl = env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.OLLAMA_MODEL || 'llama3.2',
      prompt,
      system,
      stream: true,
      options: { temperature },
    }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);

  const reader = res.body;
  const decoder = new TextDecoder();
  for await (const chunk of reader) {
    const lines = decoder.decode(chunk, { stream: true }).split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.response) yield data.response;
      } catch { /* skip */ }
    }
  }
}

// ============ SMART ROUTER ============

/**
 * Gọi AI (non-streaming) — Gemini first, Ollama fallback
 */
async function generateText(prompt, options = {}) {
  // Thử Gemini trước
  if (env.GEMINI_API_KEY) {
    try {
      return await callGemini(prompt, options);
    } catch (err) {
      console.warn('⚠️ Gemini failed, trying Ollama:', err.message);
    }
  }

  // Fallback Ollama
  try {
    return await callOllama(prompt, { system: options.systemInstruction, temperature: options.temperature });
  } catch (ollamaErr) {
    throw new Error(`AI không khả dụng. Gemini: rate-limited. Ollama: ${ollamaErr.message}. Vui lòng thử lại sau.`);
  }
}

/**
 * Gọi AI streaming — Gemini first, Ollama fallback
 */
async function* generateStream(prompt, options = {}) {
  if (env.GEMINI_API_KEY) {
    try {
      // Thử start stream Gemini — nếu lỗi sẽ throw ở dòng đầu
      const gen = streamGemini(prompt, options);
      for await (const chunk of gen) {
        yield chunk;
      }
      return;
    } catch (err) {
      console.warn('⚠️ Gemini stream failed, trying Ollama:', err.message);
    }
  }

  try {
    const gen = streamOllama(prompt, { system: options.systemInstruction, temperature: options.temperature });
    for await (const chunk of gen) {
      yield chunk;
    }
  } catch (ollamaErr) {
    throw new Error(`AI không khả dụng. Vui lòng thử lại sau. (${ollamaErr.message})`);
  }
}

/**
 * Chat streaming — Gemini chat first, Ollama fallback
 */
async function* chatStream(history, userMessage, options = {}) {
  if (env.GEMINI_API_KEY) {
    try {
      const gen = streamGeminiChat(history, userMessage, options);
      for await (const chunk of gen) {
        yield chunk;
      }
      return;
    } catch (err) {
      console.warn('⚠️ Gemini chat failed, trying Ollama:', err.message);
    }
  }

  // Ollama fallback — concat history into single prompt
  try {
    const context = history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    const fullPrompt = `${context}\nUser: ${userMessage}\nAssistant:`;
    const gen = streamOllama(fullPrompt, { system: options.systemInstruction, temperature: options.temperature });
    for await (const chunk of gen) {
      yield chunk;
    }
  } catch (ollamaErr) {
    throw new Error(`AI không khả dụng. Gemini: hết quota. Ollama: ${ollamaErr.message}. Vui lòng thử lại sau.`);
  }
}

module.exports = { generateText, generateStream, chatStream };

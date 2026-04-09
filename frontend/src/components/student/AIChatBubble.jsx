/**
 * AIChatBubble — Floating chat widget ở góc dưới phải
 * Click mở popup chat, streaming từng chữ real-time
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare, X, Send, Trash2, Loader2, Bot, User,
  Route, Briefcase, BookOpen, HelpCircle, Minimize2,
} from 'lucide-react';
import api from '../../lib/api';

const SUGGESTED = [
  { icon: Route, text: 'Tôi nên học lộ trình nào?' },
  { icon: Briefcase, text: 'Tôi phù hợp với nghề gì?' },
  { icon: BookOpen, text: 'Hướng dẫn nhập hồ sơ học tập' },
  { icon: HelpCircle, text: 'EduPath hỗ trợ những gì?' },
];

export default function AIChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [unread, setUnread] = useState(0);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Load history on first open
  useEffect(() => {
    if (open && !historyLoaded) {
      api.get('/ai/chat/history')
        .then(({ data }) => {
          if (data.success && data.data?.length) {
            setMessages(data.data.map(m => ({ role: m.role, content: m.content })));
          }
          setHistoryLoaded(true);
        })
        .catch(() => setHistoryLoaded(true));
    }
  }, [open, historyLoaded]);

  // Auto-scroll
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Focus input
  useEffect(() => {
    if (open && !streaming) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, streaming]);

  const handleSend = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || streaming) return;

    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setStreaming(true);
    setLoading(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const token = localStorage.getItem('accessToken');
      abortRef.current = new AbortController();

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/ai/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: msg }),
          signal: abortRef.current.signal,
        }
      );

      if (!response.ok) throw new Error('Failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      setLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6);
          if (raw === '[DONE]') continue;
          try {
            const payload = JSON.parse(raw);
            if (payload.error) {
              setMessages(prev => {
                const u = [...prev];
                u[u.length - 1] = { role: 'assistant', content: `❌ ${payload.error}` };
                return u;
              });
            } else if (payload.text) {
              setMessages(prev => {
                const u = [...prev];
                u[u.length - 1] = {
                  role: 'assistant',
                  content: u[u.length - 1].content + payload.text,
                };
                return u;
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const u = [...prev];
          u[u.length - 1] = { role: 'assistant', content: '❌ Không thể kết nối AI. Thử lại sau.' };
          return u;
        });
      }
    } finally {
      setStreaming(false);
      setLoading(false);
      abortRef.current = null;
    }
  }, [input, streaming]);

  const clearHistory = async () => {
    try {
      await api.delete('/ai/chat/history');
      setMessages([]);
    } catch { /* silent */ }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Floating bubble + chat panel (rendered via portal)
  return createPortal(
    <>
      {/* Chat Panel */}
      {open && (
        <div
          className="fixed bottom-20 right-5 z-[9999] w-[400px] h-[560px] bg-background rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold">EduPath AI</p>
                <p className="text-[10px] text-white/70">Trợ lý tư vấn lộ trình và công việc</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button onClick={clearHistory} className="p-1.5 rounded-lg hover:bg-white/20 transition" title="Xóa lịch sử">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition" title="Thu nhỏ">
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Xin chào! 👋</p>
                  <p className="text-xs text-muted-foreground">Mình là EduPath AI. Hỏi mình bất cứ điều gì!</p>
                </div>
                <div className="grid grid-cols-1 gap-1.5 w-full">
                  {SUGGESTED.map(({ icon: Icon, text }) => (
                    <button
                      key={text}
                      onClick={() => handleSend(text)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed text-xs text-left hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition"
                    >
                      <Icon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="text-muted-foreground">{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-sm'
                        : 'bg-muted/70 rounded-bl-sm'
                      }`}
                  >
                    {msg.content || (loading && i === messages.length - 1 ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="flex gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </span>
                    ) : '')}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="border-t px-3 py-2.5 flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                rows={1}
                className="flex-1 resize-none rounded-lg border bg-muted/30 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-muted-foreground/50"
                style={{ maxHeight: '80px', minHeight: '36px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || streaming}
                className="h-9 w-9 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white flex items-center justify-center disabled:opacity-40 transition shadow-md shadow-emerald-500/20 flex-shrink-0"
              >
                {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bubble */}
      <button
        onClick={() => { setOpen(!open); if (!open) setUnread(0); }}
        className="fixed bottom-5 right-5 z-[9999] w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group"
        title="Chat với AI"
      >
        {open ? (
          <X className="w-6 h-6 transition-transform group-hover:rotate-90 duration-200" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold animate-bounce">
                {unread}
              </span>
            )}
          </>
        )}
      </button>
    </>,
    document.body
  );
}

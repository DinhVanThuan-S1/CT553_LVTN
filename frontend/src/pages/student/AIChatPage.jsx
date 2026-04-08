/**
 * AI Chat Page — Chatbot AI với SSE Streaming
 */
import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import {
  MessageSquare, Send, Trash2, Loader2, Bot, User, Sparkles,
  Route, Briefcase, BookOpen, HelpCircle, ArrowDown,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

const SUGGESTED_QUESTIONS = [
  { icon: Route, text: 'Tôi nên học lộ trình nào?', color: 'text-violet-500' },
  { icon: Briefcase, text: 'Tôi phù hợp với nghề gì?', color: 'text-blue-500' },
  { icon: BookOpen, text: 'Hướng dẫn nhập hồ sơ học tập', color: 'text-emerald-500' },
  { icon: HelpCircle, text: 'EduPath hỗ trợ những gì?', color: 'text-amber-500' },
];

export default function AIChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const toast = useToast();

  // Load history
  useEffect(() => {
    loadHistory();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/ai/chat/history');
      if (data.success && data.data?.length) {
        setMessages(data.data.map(m => ({ role: m.role, content: m.content })));
      }
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  };

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || streaming) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setStreaming(true);
    setLoading(true);

    // Add empty assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg }),
      });

      if (!response.ok) throw new Error('Failed to connect');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      setLoading(false); // Streaming started

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: `❌ Lỗi: ${data.error}` };
                return updated;
              });
            } else if (data.text) {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: updated[updated.length - 1].content + data.text,
                };
                return updated;
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: '❌ Không thể kết nối tới AI. Vui lòng thử lại.' };
        return updated;
      });
    } finally {
      setStreaming(false);
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.delete('/ai/chat/history');
      setMessages([]);
      toast.success('Đã xóa lịch sử chat');
    } catch {
      toast.error('Không thể xóa lịch sử');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-1 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">EduPath AI</h1>
            <p className="text-xs text-muted-foreground">Trợ lý tư vấn nghề nghiệp • Powered by Gemini</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearHistory} className="text-xs gap-1.5 text-muted-foreground">
            <Trash2 className="w-3.5 h-3.5" /> Xóa lịch sử
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4 scrollbar-thin">
        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          /* Welcome screen */
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center">
              <Bot className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h2 className="text-lg font-semibold">Xin chào! 👋</h2>
              <p className="text-sm text-muted-foreground">
                Mình là EduPath AI, trợ lý tư vấn học tập và nghề nghiệp. Bạn có thể hỏi mình bất cứ điều gì!
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTED_QUESTIONS.map(({ icon: Icon, text, color }) => (
                <button
                  key={text}
                  onClick={() => handleSend(text)}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-dashed hover:border-primary/40 hover:bg-primary/5 transition-all text-left text-sm group"
                >
                  <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">{text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted/60 rounded-bl-md'
                }`}
              >
                {msg.content || (loading && i === messages.length - 1 ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang suy nghĩ...
                  </span>
                ) : '')}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t px-1 py-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              rows={1}
              className="w-full resize-none rounded-xl border bg-muted/30 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
              style={{ maxHeight: '120px', minHeight: '44px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || streaming}
            className="h-11 w-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20"
          >
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          EduPath AI có thể tạo thông tin không chính xác. Hãy kiểm tra thông tin quan trọng.
        </p>
      </div>
    </div>
  );
}

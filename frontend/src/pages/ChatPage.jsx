/**
 * ChatPage — Trang trò chuyện real-time
 * Dùng chung cho cả Student và Employer
 * Sidebar danh sách hội thoại + khung chat chính
 */
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { connectSocket, getSocket, disconnectSocket } from '../lib/socket';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import {
  MessageSquare, Send, Search, Loader2, User as UserIcon,
  ArrowLeft, Plus, Check, CheckCheck, X,
} from 'lucide-react';

export default function ChatPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Initialize socket on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) connectSocket(token);
    loadConversations();
    return () => { disconnectSocket(); };
  }, []);

  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (message.conversation === activeConv?._id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
      loadConversations();
    };

    const handleConvUpdated = ({ conversationId, lastMessage, unreadCount }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? { ...c, lastMessage, unreadCount: { ...c.unreadCount, [user?._id]: unreadCount } }
            : c
        )
      );
    };

    const handleTyping = ({ userId: typId, conversationId }) => {
      if (conversationId === activeConv?._id)
        setTypingUsers((prev) => ({ ...prev, [typId]: true }));
    };

    const handleStopTyping = ({ userId: typId }) => {
      setTypingUsers((prev) => { const next = { ...prev }; delete next[typId]; return next; });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_updated', handleConvUpdated);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_updated', handleConvUpdated);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [activeConv, user]);

  // Join/Leave conversation room
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeConv) return;
    socket.emit('join_conversation', activeConv._id);
    return () => { socket.emit('leave_conversation', activeConv._id); };
  }, [activeConv]);

  async function loadConversations() {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data.data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function openConversation(conv) {
    setActiveConv(conv);
    setMobileShowChat(true);
    setMessages([]);
    try {
      const { data } = await api.get(`/chat/conversations/${conv._id}/messages`);
      setMessages(data.data);
      scrollToBottom();
      loadConversations();
    } catch {
      toast.error('Không thể tải tin nhắn');
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv || sendingMsg) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSendingMsg(true);
    try {
      const { data } = await api.post(`/chat/conversations/${activeConv._id}/messages`, { content });
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === data.data._id);
        return exists ? prev : [...prev, data.data];
      });
      scrollToBottom();
      loadConversations();
    } catch {
      toast.error('Không thể gửi tin nhắn');
      setNewMessage(content);
    } finally {
      setSendingMsg(false);
    }
  }

  function handleTypingInput(e) {
    setNewMessage(e.target.value);
    const socket = getSocket();
    if (!socket || !activeConv) return;
    socket.emit('typing', { conversationId: activeConv._id });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('stop_typing', { conversationId: activeConv._id });
    }, 1500);
  }

  async function startNewChat(targetUserId) {
    try {
      const { data } = await api.post('/chat/conversations', { participantId: targetUserId });
      setShowNewChat(false);
      setSearchUsers('');
      setFoundUsers([]);
      await loadConversations();
      openConversation(data.data);
    } catch {
      toast.error('Không thể tạo cuộc trò chuyện');
    }
  }

  async function searchForUsers(query) {
    setSearchUsers(query);
    if (query.length < 2) { setFoundUsers([]); return; }
    try {
      const { data } = await api.get(`/chat/users/search?q=${encodeURIComponent(query)}`);
      setFoundUsers(data.data || []);
    } catch { setFoundUsers([]); }
  }

  function scrollToBottom() {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  }

  function getOtherParticipant(conv) {
    return conv.participants?.find((p) => p._id !== user?._id);
  }

  function formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return d.toLocaleDateString('vi-VN', { weekday: 'short' });
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }

  // Tạo màu avatar từ tên
  function getAvatarGradient(name = '') {
    const gradients = [
      'from-primary/80 to-primary',
      'from-emerald-400 to-teal-500',
      'from-amber-400 to-orange-500',
      'from-rose-400 to-pink-500',
      'from-sky-400 to-blue-500',
      'from-violet-400 to-purple-500',
    ];
    const idx = (name.charCodeAt(0) || 0) % gradients.length;
    return gradients[idx];
  }

  const isTyping = Object.keys(typingUsers).length > 0;

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-[70vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-[calc(100vh-7rem)] flex rounded-2xl border bg-card overflow-hidden shadow-sm">

      {/* ═══════════════════════════════════
          SIDEBAR — Danh sách hội thoại
      ═══════════════════════════════════ */}
      <div className={`w-80 border-r flex flex-col shrink-0 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>

        {/* Sidebar Header */}
        <div className="relative border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent pointer-events-none" />
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                </div>
                <h2 className="font-semibold text-sm">Tin nhắn</h2>
                {conversations.some(c => (c.unreadCount?.[user?._id] || 0) > 0) && (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <button
                onClick={() => { setShowNewChat(!showNewChat); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  showNewChat ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {showNewChat ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* New Chat Search */}
            {showNewChat && (
              <div className="relative animate-fade-in">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Tìm người dùng..."
                  value={searchUsers}
                  onChange={(e) => searchForUsers(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:ring-offset-1 outline-none transition-all"
                  autoFocus
                />
                {foundUsers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border/60 rounded-xl shadow-lg max-h-52 overflow-y-auto z-20">
                    <div className="py-1.5">
                      {foundUsers.map((u) => {
                        const grad = getAvatarGradient(u.fullName);
                        return (
                          <button
                            key={u._id}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 text-left transition-colors"
                            onClick={() => startNewChat(u._id)}
                          >
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center shrink-0`}>
                              {u.avatar
                                ? <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                                : <span className="text-xs font-bold text-white">{u.fullName?.[0]?.toUpperCase()}</span>
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{u.fullName}</p>
                              <p className="text-[10px] text-muted-foreground">{u.role === 'employer' ? 'Nhà tuyển dụng' : 'Sinh viên'}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-7 h-7 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Chưa có tin nhắn</p>
              <p className="text-xs text-muted-foreground/60 mb-3">Bắt đầu cuộc trò chuyện mới</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Tin nhắn mới
              </button>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const unread = conv.unreadCount?.[user?._id] || 0;
              const isActive = activeConv?._id === conv._id;
              const grad = getAvatarGradient(other?.fullName);

              return (
                <button
                  key={conv._id}
                  onClick={() => openConversation(conv)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all relative overflow-hidden ${
                    isActive
                      ? 'bg-primary/8'
                      : 'hover:bg-muted/30'
                  }`}
                >
                  {/* Active left indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r-full" />
                  )}

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm`}>
                      {other?.avatar
                        ? <img src={other.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                        : <span className="text-sm font-bold text-white">{other?.fullName?.[0]?.toUpperCase() || '?'}</span>
                      }
                    </div>
                    {unread > 0 && (
                      <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary border-2 border-card" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <p className={`text-sm truncate ${unread > 0 ? 'font-semibold' : 'font-medium'}`}>
                        {other?.fullName || 'Người dùng'}
                      </p>
                      <span className={`text-[10px] whitespace-nowrap shrink-0 ${unread > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {formatTime(conv.lastMessage?.timestamp || conv.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-xs truncate ${unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {conv.lastMessage?.content || 'Chưa có tin nhắn'}
                      </p>
                      {unread > 0 && (
                        <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[9px] flex items-center justify-center font-bold">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════
          MAIN CHAT AREA
      ═══════════════════════════════════ */}
      <div className={`flex-1 flex flex-col min-w-0 ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {!activeConv ? (
          /* ── Empty State ── */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 animate-pulse" />
                <div className="relative w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-9 h-9 text-primary/40" />
                </div>
              </div>
              <h3 className="font-semibold text-base mb-1.5">Chọn cuộc trò chuyện</h3>
              <p className="text-sm text-muted-foreground max-w-[240px]">
                Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Chat Header ── */}
            <div className="relative overflow-hidden border-b">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
              <div className="relative flex items-center gap-3 px-4 py-3">
                <button
                  className="md:hidden p-1.5 hover:bg-muted/60 rounded-lg transition-colors"
                  onClick={() => { setMobileShowChat(false); setActiveConv(null); }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                {/* Avatar */}
                {(() => {
                  const other = getOtherParticipant(activeConv);
                  const grad = getAvatarGradient(other?.fullName);
                  return (
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center shrink-0 shadow-sm`}>
                      {other?.avatar
                        ? <img src={other.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                        : <span className="text-sm font-bold text-white">{other?.fullName?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                  );
                })()}

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{getOtherParticipant(activeConv)?.fullName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {isTyping
                      ? <span className="text-primary font-medium animate-pulse">Đang nhập...</span>
                      : getOtherParticipant(activeConv)?.role === 'employer' ? 'Nhà tuyển dụng' : 'Sinh viên'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* ── Messages Area ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">Bắt đầu cuộc trò chuyện 👋</p>
                </div>
              )}

              {messages.map((msg, i) => {
                const isMine = msg.sender?._id === user?._id;
                const prevMsg = messages[i - 1];
                const nextMsg = messages[i + 1];
                const isFirstInGroup = !prevMsg || prevMsg.sender?._id !== msg.sender?._id;
                const isLastInGroup = !nextMsg || nextMsg.sender?._id !== msg.sender?._id;
                const showAvatar = !isMine && isFirstInGroup;
                const grad = getAvatarGradient(msg.sender?.fullName);

                // Bubble radius
                let bubbleRounded = 'rounded-2xl';
                if (isMine) {
                  if (!isFirstInGroup && !isLastInGroup) bubbleRounded = 'rounded-2xl rounded-r-md';
                  else if (!isFirstInGroup) bubbleRounded = 'rounded-2xl rounded-tr-md';
                  else if (!isLastInGroup) bubbleRounded = 'rounded-2xl rounded-br-md';
                } else {
                  if (!isFirstInGroup && !isLastInGroup) bubbleRounded = 'rounded-2xl rounded-l-md';
                  else if (!isFirstInGroup) bubbleRounded = 'rounded-2xl rounded-tl-md';
                  else if (!isLastInGroup) bubbleRounded = 'rounded-2xl rounded-bl-md';
                }

                return (
                  <div key={msg._id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[72%] ${isMine ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      {!isMine && (
                        <div className="w-7 shrink-0 self-end mb-0.5">
                          {showAvatar && (
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
                              {msg.sender?.avatar
                                ? <img src={msg.sender.avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                                : <span className="text-[10px] font-bold text-white">{msg.sender?.fullName?.[0]?.toUpperCase()}</span>
                              }
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        {/* Bubble */}
                        <div className={`px-3.5 py-2 text-sm leading-relaxed ${bubbleRounded} ${
                          isMine
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted/70 text-foreground'
                        }`}>
                          {msg.content}
                        </div>

                        {/* Timestamp + Read receipt */}
                        {isLastInGroup && (
                          <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start ml-0.5'}`}>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMine && (
                              msg.readBy?.length > 1
                                ? <CheckCheck className="w-3 h-3 text-primary" />
                                : <Check className="w-3 h-3 text-muted-foreground/60" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 mt-3 ml-9">
                  <div className="px-3.5 py-2.5 bg-muted/70 rounded-2xl rounded-bl-md inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Message Input ── */}
            <form onSubmit={handleSend} className="px-4 py-3 border-t bg-card/50">
              <div className="flex items-center gap-2 bg-muted/50 rounded-2xl px-2 py-1 transition-all">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={handleTypingInput}
                  className="flex-1 px-2 py-2 text-sm bg-transparent outline-none border-0 ring-0 focus:ring-0 focus:ring-offset-0 focus:outline-none placeholder:text-muted-foreground/60"
                  disabled={sendingMsg}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMsg}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    newMessage.trim()
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {sendingMsg
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

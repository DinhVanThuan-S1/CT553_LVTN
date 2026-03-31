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
  ArrowLeft, Plus, Check, CheckCheck,
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

  // Initialize socket on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      connectSocket(token);
    }
    loadConversations();

    return () => {
      disconnectSocket();
    };
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
      // Update conversation list
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
      if (conversationId === activeConv?._id) {
        setTypingUsers((prev) => ({ ...prev, [typId]: true }));
      }
    };

    const handleStopTyping = ({ userId: typId }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[typId];
        return next;
      });
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
    return () => {
      socket.emit('leave_conversation', activeConv._id);
    };
  }, [activeConv]);

  async function loadConversations() {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data.data);
    } catch {
      // Ignore if auth failed
    } finally {
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
      // Reload conversations to update unread count
      loadConversations();
    } catch (err) {
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
      // Only add if not already received via socket
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
    if (query.length < 2) {
      setFoundUsers([]);
      return;
    }
    try {
      const { data } = await api.get(`/chat/users/search?q=${encodeURIComponent(query)}`);
      setFoundUsers(data.data || []);
    } catch {
      setFoundUsers([]);
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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

  const isTyping = Object.keys(typingUsers).length > 0;

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-[70vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-[calc(100vh-7rem)] flex rounded-xl border bg-card overflow-hidden">
      {/* === Sidebar — Danh sách hội thoại === */}
      <div className={`w-80 border-r flex flex-col shrink-0 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-primary" /> Tin nhắn
            </h2>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowNewChat(!showNewChat)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* New Chat — Search */}
          {showNewChat && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm người dùng..."
                value={searchUsers}
                onChange={(e) => searchForUsers(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border bg-background focus:ring-1 focus:ring-primary outline-none"
                autoFocus
              />
              {foundUsers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {foundUsers.map((u) => (
                    <button
                      key={u._id}
                      className="w-full flex items-center gap-2.5 p-2.5 hover:bg-muted/50 text-left text-sm"
                      onClick={() => startNewChat(u._id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {u.avatar ? (
                          <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{u.fullName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {u.role === 'employer' ? 'Nhà tuyển dụng' : 'Sinh viên'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Chưa có cuộc trò chuyện</p>
              <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => setShowNewChat(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Bắt đầu trò chuyện
              </Button>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const unread = conv.unreadCount?.[user?._id] || 0;
              const isActive = activeConv?._id === conv._id;

              return (
                <button
                  key={conv._id}
                  className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors border-b border-border/50 ${
                    isActive ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                  onClick={() => openConversation(conv)}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {other?.avatar ? (
                        <img src={other.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${unread > 0 ? 'font-semibold' : 'font-medium'}`}>
                        {other?.fullName || 'Người dùng'}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {formatTime(conv.lastMessage?.timestamp || conv.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-xs truncate ${unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {conv.lastMessage?.content || 'Chưa có tin nhắn'}
                      </p>
                      {unread > 0 && (
                        <span className="ml-2 shrink-0 w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
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

      {/* === Main Chat Area === */}
      <div className={`flex-1 flex flex-col ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {!activeConv ? (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground/15 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-1">Chọn cuộc trò chuyện</h3>
              <p className="text-sm text-muted-foreground">
                Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b flex items-center gap-3">
              <button
                className="md:hidden p-1 hover:bg-muted rounded"
                onClick={() => { setMobileShowChat(false); setActiveConv(null); }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {getOtherParticipant(activeConv)?.avatar ? (
                  <img src={getOtherParticipant(activeConv).avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                ) : (
                  <UserIcon className="w-4.5 h-4.5 text-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">{getOtherParticipant(activeConv)?.fullName}</p>
                <p className="text-[10px] text-muted-foreground">
                  {getOtherParticipant(activeConv)?.role === 'employer' ? 'Nhà tuyển dụng' : 'Sinh viên'}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm text-muted-foreground">Bắt đầu cuộc trò chuyện 👋</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isMine = msg.sender?._id === user?._id;
                const showAvatar = !isMine && (i === 0 || messages[i - 1]?.sender?._id !== msg.sender?._id);
                const showTime = i === messages.length - 1 || messages[i + 1]?.sender?._id !== msg.sender?._id;

                return (
                  <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end gap-2 max-w-[75%] ${isMine ? 'flex-row-reverse' : ''}`}>
                      {!isMine && showAvatar && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mb-4">
                          {msg.sender?.avatar ? (
                            <img src={msg.sender.avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                          ) : (
                            <UserIcon className="w-3.5 h-3.5 text-primary" />
                          )}
                        </div>
                      )}
                      {!isMine && !showAvatar && <div className="w-7 shrink-0" />}
                      <div>
                        <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMine
                            ? 'bg-primary text-white rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        }`}>
                          {msg.content}
                        </div>
                        {showTime && (
                          <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : ''}`}>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMine && (
                              msg.readBy?.length > 1
                                ? <CheckCheck className="w-3 h-3 text-primary" />
                                : <Check className="w-3 h-3 text-muted-foreground" />
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
                <div className="flex items-center gap-2 px-3 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs">Đang nhập...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="p-3 border-t flex items-center gap-2">
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={handleTypingInput}
                className="flex-1 px-4 py-2.5 text-sm rounded-full border bg-background focus:ring-1 focus:ring-primary outline-none"
                disabled={sendingMsg}
                autoFocus
              />
              <Button
                type="submit"
                size="sm"
                className="rounded-full h-10 w-10 p-0 shrink-0"
                disabled={!newMessage.trim() || sendingMsg}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

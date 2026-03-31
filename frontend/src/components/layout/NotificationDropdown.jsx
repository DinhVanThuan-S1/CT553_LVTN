/**
 * NotificationDropdown Component
 * Dropdown thông báo real-time trong Header
 * - Badge đếm số chưa đọc
 * - Danh sách thông báo (scroll)
 * - Mark read / Mark all read
 * - Click → navigate to link
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Briefcase,
  FileText,
  Calendar,
  MessageSquare,
  Award,
  AlertCircle,
  X,
} from 'lucide-react';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';

// Icon map theo loại thông báo
const typeIconMap = {
  application_received: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  application_reviewed: { icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  interview_scheduled: { icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  application_accepted: { icon: Check, color: 'text-green-500', bg: 'bg-green-500/10' },
  application_rejected: { icon: X, color: 'text-red-500', bg: 'bg-red-500/10' },
  job_approved: { icon: Briefcase, color: 'text-green-500', bg: 'bg-green-500/10' },
  job_rejected: { icon: Briefcase, color: 'text-red-500', bg: 'bg-red-500/10' },
  new_message: { icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
  roadmap_completed: { icon: Award, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  skill_test_passed: { icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  system: { icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted' },
};

function timeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(date).toLocaleDateString('vi-VN');
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      if (data.success) setUnreadCount(data.data.count);
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications?limit=15');
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count khi component mount
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // mỗi 30s
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Listen Socket.IO real-time
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 15));
      setUnreadCount(prev => prev + 1);
    };

    socket.on('new_notification', handleNewNotification);
    return () => socket.off('new_notification', handleNewNotification);
  }, []);

  // Fetch khi mở dropdown
  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  // Click outside → đóng
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark 1 notification as read
  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true, readAt: new Date() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  };

  // Mark all as read
  const markAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  };

  // Delete notification
  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      const removed = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (removed && !removed.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  };

  // Click notification → navigate
  const handleClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id);
    if (notif.link) {
      navigate(notif.link);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-lg relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-destructive rounded-full px-1 ring-2 ring-background">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[480px] rounded-xl border bg-popover/95 backdrop-blur-xl shadow-xl shadow-black/10 z-50 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <h3 className="text-sm font-semibold">Thông báo</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-primary/5 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Đọc tất cả
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1 scrollbar-thin">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Chưa có thông báo</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const typeConfig = typeIconMap[notif.type] || typeIconMap.system;
                const Icon = typeConfig.icon;

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleClick(notif)}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-border/20 last:border-0 group',
                      notif.isRead
                        ? 'hover:bg-muted/40'
                        : 'bg-primary/[0.03] hover:bg-primary/[0.06]'
                    )}
                  >
                    {/* Icon */}
                    <div className={cn('flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5', typeConfig.bg)}>
                      <Icon className={cn('w-4 h-4', typeConfig.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm leading-snug',
                        !notif.isRead && 'font-medium'
                      )}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notif.content}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.isRead && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                          className="p-1 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                          title="Đánh dấu đã đọc"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => deleteNotification(notif._id, e)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Unread dot */}
                    {!notif.isRead && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

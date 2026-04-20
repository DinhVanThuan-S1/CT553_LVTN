/**
 * Header Component
 * - Student/Employer: Tin nhắn + Thông báo + Avatar
 * - Admin: Thông báo + Avatar (KHÔNG có Tin nhắn)
 * - Global search với dropdown kết quả
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import NotificationDropdown from './NotificationDropdown';
import {
  Search, LogOut, User, Settings, Moon, Sun,
  MessageSquare, X, Heart, Route, Briefcase, BookOpen,
  Loader2, ArrowRight,
} from 'lucide-react';
import { connectSocket, disconnectSocket } from '../../lib/socket';
import api from '../../lib/api';

// Debounce hook
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const RESULT_ICONS = {
  roadmap: { icon: Route, color: 'text-primary', bg: 'bg-primary/10', label: 'Lộ trình' },
  job: { icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-500/10', label: 'Việc làm' },
  course: { icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-500/10', label: 'Học phần' },
};

export default function Header({ user, onLogout, sidebarCollapsed }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Search state
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const navigate = useNavigate();
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const isAdmin = user?.role === 'admin';
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Connect Socket.IO
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('accessToken');
      if (token) connectSocket(token);
    }
    return () => disconnectSocket();
  }, [user]);

  // Fetch unread messages
  useEffect(() => {
    if (!user || isAdmin) return;
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/chat/unread-count');
        if (data.success) setUnreadMessages(data.data.count);
      } catch { /* silently */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user, isAdmin]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Global search
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const doSearch = async () => {
      setSearchLoading(true);
      setShowResults(true);
      try {
        const q = encodeURIComponent(debouncedQuery.trim());
        const results = [];

        // Fetch roadmaps
        try {
          const { data } = await api.get(`/roadmaps?search=${q}&limit=3`);
          const items = data.data?.roadmaps || data.data || [];
          items.slice(0, 3).forEach(r => results.push({
            type: 'roadmap', id: r._id, title: r.title,
            subtitle: r.difficulty || '',
            url: `/student/roadmaps/${r._id}`,
          }));
        } catch { /* ignore */ }

        // Fetch jobs
        try {
          const { data } = await api.get(`/jobs?search=${q}&limit=3`);
          const items = data.data?.jobs || data.data || [];
          items.slice(0, 3).forEach(j => results.push({
            type: 'job', id: j._id, title: j.title,
            subtitle: j.employer?.company?.name || j.jobType || '',
            url: `/student/jobs`,
          }));
        } catch { /* ignore */ }

        setSearchResults(results);
      } catch { /* ignore */ } finally {
        setSearchLoading(false);
      }
    };
    doSearch();
  }, [debouncedQuery]);

  const handleSearchKey = (e) => {
    if (e.key === 'Escape') { clearSearch(); }
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Navigate to roadmap list with search param
      navigate(`/student/roadmaps?search=${encodeURIComponent(searchQuery.trim())}`);
      clearSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowResults(false);
    setShowSearch(false);
    setSearchResults([]);
  };

  const handleResultClick = (url) => {
    navigate(url);
    clearSearch();
  };

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const roleLabel = {
    student: 'Sinh viên',
    employer: 'Nhà tuyển dụng',
    admin: 'Quản trị viên',
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-14 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 transition-all duration-300',
        sidebarCollapsed ? 'left-[68px]' : 'left-60'
      )}
    >
      {/* ── Search ── */}
      <div className="flex items-center gap-2 flex-1" ref={searchRef}>
        <div className={cn(
          'flex items-center transition-all duration-200 relative',
          showSearch ? 'w-full max-w-lg' : 'w-auto'
        )}>
          {showSearch ? (
            <div className="relative flex-1 w-full">
              {searchLoading
                ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              }
              <input
                ref={inputRef}
                type="text"
                placeholder="Tìm kiếm học phần, kỹ năng, công việc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKey}
                onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                autoFocus
                className="w-full h-9 pl-10 pr-9 rounded-lg bg-muted/60 border border-border/50 text-sm placeholder:text-muted-foreground/60 outline-none border-0 ring-0 focus:ring-0 focus:outline-none"
              />
              <button
                onMouseDown={e => { e.preventDefault(); clearSearch(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* ── Results Dropdown ── */}
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border/60 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                  {searchResults.length === 0 && !searchLoading && debouncedQuery.length >= 2 ? (
                    <div className="px-4 py-8 text-center">
                      <Search className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Không tìm thấy kết quả cho <strong>"{debouncedQuery}"</strong></p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div>
                      {/* Group by type */}
                      {(['roadmap', 'job', 'course']).map(type => {
                        const items = searchResults.filter(r => r.type === type);
                        if (!items.length) return null;
                        const cfg = RESULT_ICONS[type];
                        const Icon = cfg.icon;
                        return (
                          <div key={type}>
                            <div className="px-3 pt-3 pb-1 flex items-center gap-1.5">
                              <Icon className={`w-3 h-3 ${cfg.color}`} />
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{cfg.label}</span>
                            </div>
                            {items.map(item => (
                              <button
                                key={item.id}
                                onMouseDown={e => { e.preventDefault(); handleResultClick(item.url); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                              >
                                <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.title}</p>
                                  {item.subtitle && <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>}
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                              </button>
                            ))}
                          </div>
                        );
                      })}
                      {/* View all */}
                      <div className="border-t border-border/40 px-3 py-2">
                        <button
                          onMouseDown={e => { e.preventDefault(); navigate(`/student/roadmaps?search=${encodeURIComponent(searchQuery)}`); clearSearch(); }}
                          className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                        >
                          <Search className="w-3 h-3" />
                          Xem tất cả kết quả cho "{searchQuery}"
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setShowSearch(true)}>
              <Search className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-1">
        {/* Dark mode */}
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={toggleDarkMode}>
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* Tin nhắn - KHÔNG cho Admin */}
        {!isAdmin && (
          <Button
            variant="ghost" size="icon" className="h-9 w-9 rounded-lg relative"
            onClick={() => navigate(`/${user?.role}/chat`)}
          >
            <MessageSquare className="w-4 h-4" />
            {unreadMessages > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-primary rounded-full px-1 ring-2 ring-background">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </Button>
        )}

        {/* Thông báo */}
        <NotificationDropdown />

        {/* User Avatar + Dropdown */}
        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-lg hover:bg-muted/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-teal-500/20 flex items-center justify-center ring-2 ring-primary/10">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                : <span className="text-xs font-bold text-primary">{user?.fullName?.charAt(0) || 'U'}</span>
              }
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-tight">{user?.fullName || 'User'}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{roleLabel[user?.role] || ''}</p>
            </div>
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border bg-popover/95 backdrop-blur-xl shadow-xl shadow-black/5 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-2 border-b border-border/50 mb-1">
                <p className="text-sm font-semibold">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { navigate(`/${user?.role}/profile`); setShowUserMenu(false); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
              >
                <User className="w-4 h-4 text-muted-foreground" /> Thông tin cá nhân
              </button>
              {user?.role === 'student' && (
                <button
                  onClick={() => { navigate('/student/favorites'); setShowUserMenu(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
                >
                  <Heart className="w-4 h-4 text-muted-foreground" /> Yêu Thích
                </button>
              )}
              <button
                onClick={() => { navigate(`/${user?.role}/settings`); setShowUserMenu(false); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
              >
                <Settings className="w-4 h-4 text-muted-foreground" /> Cài đặt
              </button>
              <hr className="my-1 border-border/50" />
              <button
                onClick={() => { onLogout(); setShowUserMenu(false); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

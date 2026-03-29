/**
 * Header Component
 * Cập nhật theo supplementary-requirements:
 * - Student/Employer: Tin nhắn + Thông báo + Avatar (Info, Settings, Logout)
 * - Admin: Thông báo + Avatar (Info, Settings, Logout) (KHÔNG có Tin nhắn)
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import {
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  Moon,
  Sun,
  MessageSquare,
  X,
} from 'lucide-react';

export default function Header({ user, onLogout, sidebarCollapsed }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const isAdmin = user?.role === 'admin';

  // Đóng menu khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      {/* Search */}
      <div className="flex items-center gap-2 flex-1">
        <div className={cn(
          'flex items-center transition-all duration-300',
          showSearch ? 'w-full max-w-lg' : 'w-auto'
        )}>
          {showSearch ? (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm học phần, kỹ năng, công việc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery) setShowSearch(false); }}
                autoFocus
                className="w-full h-9 pl-10 pr-10 rounded-lg bg-muted/60 border border-border/50 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30"
              />
              <button
                onClick={() => { setSearchQuery(''); setShowSearch(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={() => setShowSearch(true)}
            >
              <Search className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Dark mode */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={toggleDarkMode}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* Tin nhắn - KHÔNG hiển thị cho Admin */}
        {!isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg relative"
            onClick={() => navigate('/chat')}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
          </Button>
        )}

        {/* Thông báo */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-background" />
        </Button>

        {/* User Avatar + Dropdown */}
        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-lg hover:bg-muted/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-teal-500/20 flex items-center justify-center ring-2 ring-primary/10">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-primary">
                  {user?.fullName?.charAt(0) || 'U'}
                </span>
              )}
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
                onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
              >
                <User className="w-4 h-4 text-muted-foreground" /> Thông tin cá nhân
              </button>
              <button
                onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
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

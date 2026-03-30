/**
 * Sidebar Component
 * Navigation theo role: student, employer, admin
 * Cập nhật theo supplementary-requirements.md
 */
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Route,
  Briefcase,
  FileText,
  Heart,
  Building2,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ClipboardList,
  Target,
  Calendar,
  TrendingUp,
  FolderOpen,
  CheckCircle2,
  Map,
  Star,
} from 'lucide-react';

const menuConfig = {
  student: [
    { label: 'Tổng quan', path: '/student', icon: LayoutDashboard },
    { type: 'divider', label: 'Học tập' },
    { label: 'Hồ sơ học tập', path: '/student/academic-profile', icon: GraduationCap },
    { label: 'Sở thích nghề nghiệp', path: '/student/career-preferences', icon: Star },
    { type: 'divider', label: 'Lộ trình' },
    { label: 'Danh sách lộ trình', path: '/student/roadmaps', icon: Route },
    { label: 'Lộ trình của tôi', path: '/student/my-roadmap', icon: Map },
    { label: 'Tiến độ học', path: '/student/progress', icon: TrendingUp },
    { label: 'Skill Map', path: '/student/skill-map', icon: Target },
    { type: 'divider', label: 'Việc làm' },
    { label: 'Danh sách công việc', path: '/student/jobs', icon: Briefcase },
    { label: 'CV', path: '/student/cv', icon: FileText },
    { label: 'Đơn ứng tuyển', path: '/student/applications', icon: ClipboardList },
    { label: 'Yêu thích', path: '/student/favorites', icon: Heart },
  ],
  employer: [
    { label: 'Tổng quan', path: '/employer', icon: LayoutDashboard },
    { type: 'divider', label: 'Quản lý' },
    { label: 'Hồ sơ công ty', path: '/employer/company', icon: Building2 },
    { label: 'Tin tuyển dụng', path: '/employer/job-postings', icon: Briefcase },
    { label: 'Ứng viên', path: '/employer/applicants', icon: Users },
  ],
  admin: [
    { label: 'Tổng quan', path: '/admin', icon: LayoutDashboard },
    { type: 'divider', label: 'Hệ thống' },
    { label: 'QL Người dùng', path: '/admin/users', icon: Users },
    { type: 'divider', label: 'Đào tạo' },
    { label: 'QL Học phần', path: '/admin/courses', icon: BookOpen },
    { label: 'QL CTĐT', path: '/admin/curriculum-programs', icon: GraduationCap },
    { label: 'QL Kỹ năng', path: '/admin/skills', icon: Target },
    { label: 'QL Lộ trình mẫu', path: '/admin/roadmaps', icon: Route },
    { label: 'QL Tài nguyên', path: '/admin/resources', icon: FolderOpen },
    { type: 'divider', label: 'Tuyển dụng' },
    { label: 'QL Công việc mẫu', path: '/admin/job-templates', icon: Briefcase },
    { label: 'QL Tin tuyển dụng', path: '/admin/job-postings', icon: ClipboardList },
    { type: 'divider', label: 'Báo cáo' },
    { label: 'Thống kê', path: '/admin/reports', icon: BarChart3 },
  ],
};

export default function Sidebar({ role = 'student', user }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const menu = menuConfig[role] || menuConfig.student;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col',
        collapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-accent/50 flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shadow-lg shadow-primary/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight whitespace-nowrap bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
              EduPath
            </span>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {menu.map((item, index) => {
          if (item.type === 'divider') {
            return (
              <div key={index} className="pt-4 pb-1.5 first:pt-0">
                {!collapsed ? (
                  <span className="px-3 text-[11px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
                    {item.label}
                  </span>
                ) : (
                  <hr className="border-sidebar-accent/30 mx-3" />
                )}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = item.path === `/${role}`
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-primary/15 text-primary shadow-sm'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground/90',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
              )}
              <Icon className={cn(
                'flex-shrink-0 transition-colors',
                collapsed ? 'w-5 h-5' : 'w-4 h-4',
                isActive ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80'
              )} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info + Collapse */}
      <div className="border-t border-sidebar-accent/30 p-2 flex-shrink-0">
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1 rounded-lg bg-sidebar-accent/20">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-teal-500/30 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-primary/20">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                user.fullName?.charAt(0) || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground/90 truncate">{user.fullName}</p>
              <p className="text-[10px] text-sidebar-foreground/40 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-1.5 rounded-lg hover:bg-sidebar-accent/30 transition-colors text-sidebar-foreground/40 hover:text-sidebar-foreground/70"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

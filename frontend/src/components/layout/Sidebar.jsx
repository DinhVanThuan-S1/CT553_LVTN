/**
 * Sidebar Component
 * Navigation theo role: student, employer, admin
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
  ClipboardList,
  Target,
  TrendingUp,
  FolderOpen,
  Map,
  Star,
} from 'lucide-react';

const menuConfig = {
  student: [
    { label: 'Tổng Quan', path: '/student', icon: LayoutDashboard },
    { type: 'divider', label: 'Học Tập' },
    { label: 'Hồ Sơ Học Tập', path: '/student/academic-profile', icon: GraduationCap },
    { label: 'Sở Thích Nghề Nghiệp', path: '/student/career-preferences', icon: Star },
    { type: 'divider', label: 'Lộ Trình' },
    { label: 'Danh Sách Lộ Trình', path: '/student/roadmaps', icon: Route },
    { label: 'Lộ Trình Của Tôi', path: '/student/my-roadmap', icon: Map },
    { label: 'Tiến Độ Học', path: '/student/progress', icon: TrendingUp },
    { label: 'Skill Map', path: '/student/skill-map', icon: Target },
    { type: 'divider', label: 'Việc Làm' },
    { label: 'Danh Sách Công Việc', path: '/student/jobs', icon: Briefcase },
    { label: 'CVs', path: '/student/cv', icon: FileText },
    { label: 'Đơn Ứng Tuyển', path: '/student/applications', icon: ClipboardList },
    { label: 'Yêu Thích', path: '/student/favorites', icon: Heart },
  ],
  employer: [
    { label: 'Tổng Quan', path: '/employer', icon: LayoutDashboard },
    { type: 'divider', label: 'Quản Lý' },
    { label: 'Hồ Sơ Công Ty', path: '/employer/company', icon: Building2 },
    { label: 'Tin Tuyển Dụng', path: '/employer/job-postings', icon: Briefcase },
    { label: 'Ứng Viên', path: '/employer/applicants', icon: Users },
  ],
  admin: [
    { type: 'divider', label: 'Hệ Thống' },
    { label: 'Tổng Quan', path: '/admin', icon: LayoutDashboard },
    { label: 'Thống Kê', path: '/admin/reports', icon: BarChart3 },
    { label: 'Người Dùng', path: '/admin/users', icon: Users },
    { type: 'divider', label: 'Đào tạo' },
    { label: 'Học Phần', path: '/admin/courses', icon: BookOpen },
    { label: 'CTĐT', path: '/admin/curriculum-programs', icon: GraduationCap },
    { label: 'Tài Nguyên', path: '/admin/resources', icon: FolderOpen },
    { label: 'Kỹ Năng', path: '/admin/skills', icon: Target },
    { label: 'Lộ Trình Mẫu', path: '/admin/roadmaps', icon: Route },
    { type: 'divider', label: 'Tuyển dụng' },
    { label: 'Tin Tuyển Dụng', path: '/admin/job-postings', icon: Briefcase },
    { label: 'Công Việc Mẫu', path: '/admin/job-templates', icon: ClipboardList },
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
      <div className="flex items-center h-16 px-4 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shadow-lg shadow-primary/30">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="text-lg font-bold tracking-tight whitespace-nowrap bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent">
                EduPath
              </span>
              <p className="text-[10px] text-sidebar-foreground/30 -mt-0.5 capitalize">{role === 'student' ? 'Sinh viên' : role === 'employer' ? 'Nhà tuyển dụng' : 'Admin'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5 scrollbar-thin">
        {menu.map((item, index) => {
          if (item.type === 'divider') {
            return (
              <div key={index} className="pt-5 pb-1.5 first:pt-1">
                {!collapsed ? (
                  <span className="px-2 text-[10px] font-bold text-sidebar-foreground/30 uppercase tracking-[0.12em]">
                    {item.label}
                  </span>
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-px bg-white/10" />
                  </div>
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
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'text-sidebar-foreground/55 hover:bg-white/[0.06] hover:text-sidebar-foreground/90',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className={cn(
                'flex-shrink-0 transition-colors',
                collapsed ? 'w-5 h-5' : 'w-4 h-4',
                isActive ? 'text-white' : 'text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80'
              )} />
              {!collapsed && <span className="truncate">{item.label}</span>}

              {/* Collapsed tooltip */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info + Collapse */}
      <div className="border-t border-white/[0.06] p-2.5 flex-shrink-0 space-y-1">
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] transition-colors cursor-default">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-teal-500/40 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-white/10 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  user.fullName?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-sidebar" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground/90 truncate leading-tight">{user.fullName}</p>
              <p className="text-[10px] text-sidebar-foreground/35 truncate mt-0.5">{user.email}</p>
            </div>
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-2 w-full py-2 px-3 rounded-lg hover:bg-white/[0.06] transition-colors text-sidebar-foreground/35 hover:text-sidebar-foreground/60',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px] font-medium">Thu gọn</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

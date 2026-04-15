/**
 * Admin Dashboard - Tổng quan hệ thống EduPath
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import {
  Users, BookOpen, GraduationCap, Route, Target,
  TrendingUp, AlertCircle, Briefcase, ArrowRight,
  Shield, Sparkles, BarChart3,
} from 'lucide-react';

// ─── StatCard — exact same pattern as StudentDashboard ──
function StatCard({ icon, iconBg, label, value, sub, alert }) {
  return (
    <div className="rounded-xl border bg-card p-5 card-hover group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1.5 leading-tight">{value.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      {alert && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/8 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{alert}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    try {
      const [userRes, courseRes, skillRes, programRes, roadmapRes] = await Promise.all([
        api.get('/admin/users/stats'),
        api.get('/courses/all'),
        api.get('/skills/all'),
        api.get('/curriculum-programs'),
        api.get('/roadmaps'),
      ]);
      setStats({
        users: userRes.data.data,
        totalCourses: courseRes.data.data.length,
        totalSkills: skillRes.data.data.length,
        totalPrograms: programRes.data.pagination.total,
        totalRoadmaps: roadmapRes.data.pagination.total,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="h-36 skeleton rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-xl border bg-card p-6">
            <div className="h-4 w-20 skeleton mb-3" /><div className="h-8 w-12 skeleton mb-1" /><div className="h-3 w-28 skeleton" />
          </div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="h-52 skeleton rounded-xl" /><div className="h-52 skeleton rounded-xl" /></div>
      </div>
    );
  }

  const totalUsers = (stats?.users?.totalStudents || 0) + (stats?.users?.totalEmployers || 0);
  const activeUsers = (stats?.users?.activeStudents || 0) + (stats?.users?.activeEmployers || 0);
  const lockedUsers = (stats?.users?.lockedStudents || 0) + (stats?.users?.lockedEmployers || 0);
  const activeRate = totalUsers > 0 ? Math.round(activeUsers / totalUsers * 100) : 0;

  const statCards = [
    {
      label: 'Sinh viên', value: stats?.users?.totalStudents || 0,
      sub: `${stats?.users?.activeStudents || 0} đang hoạt động`,
      icon: <Users className="w-5 h-5" />, iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      alert: stats?.users?.lockedStudents > 0 ? `${stats.users.lockedStudents} tài khoản bị khóa` : null,
    },
    {
      label: 'Nhà tuyển dụng', value: stats?.users?.totalEmployers || 0,
      sub: `${stats?.users?.activeEmployers || 0} đang hoạt động`,
      icon: <Briefcase className="w-5 h-5" />, iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Học phần', value: stats?.totalCourses || 0,
      sub: 'Trong hệ thống',
      icon: <BookOpen className="w-5 h-5" />, iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Kỹ năng', value: stats?.totalSkills || 0,
      sub: 'Đã thiết lập',
      icon: <Target className="w-5 h-5" />, iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Chương trình ĐT', value: stats?.totalPrograms || 0,
      sub: 'Chương trình đào tạo',
      icon: <GraduationCap className="w-5 h-5" />, iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    },
    {
      label: 'Lộ trình mẫu', value: stats?.totalRoadmaps || 0,
      sub: 'Đang hoạt động',
      icon: <Route className="w-5 h-5" />, iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
  ];

  const distBars = [
    { label: 'Sinh viên', value: stats?.users?.totalStudents || 0, color: 'bg-sky-500' },
    { label: 'Nhà tuyển dụng', value: stats?.users?.totalEmployers || 0, color: 'bg-emerald-500' },
    { label: 'Đang hoạt động', value: activeUsers, color: 'bg-primary' },
  ];

  const quickActions = [
    { label: 'Thêm học phần', href: '/admin/courses', icon: BookOpen, color: 'group-hover:text-amber-500' },
    { label: 'Thêm kỹ năng', href: '/admin/skills', icon: Target, color: 'group-hover:text-rose-500' },
    { label: 'Tạo lộ trình', href: '/admin/roadmaps', icon: Route, color: 'group-hover:text-indigo-500' },
    { label: 'Duyệt tin TD', href: '/admin/job-postings', icon: Briefcase, color: 'group-hover:text-emerald-500' },
    { label: 'Người dùng', href: '/admin/users', icon: Users, color: 'group-hover:text-sky-500' },
    { label: 'Thống kê', href: '/admin/stats', icon: TrendingUp, color: 'group-hover:text-primary' },
  ];

  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Hero Header — same pattern as StudentDashboard ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-accent/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Tổng Quan</span>
            </p>
            <p className="text-muted-foreground text-sm mt-1.5 max-w-lg">
              Dashboard quản trị hệ thống EduPath!
            </p>
          </div>

          {/* Live summary pills — same compact style */}
          <div className="flex items-center gap-5 bg-card/70 backdrop-blur-sm border border-border/50 rounded-xl px-5 py-3 shadow-sm">
            <div className="text-center">
              <p className="text-xl font-bold">{totalUsers}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Người dùng</p>
            </div>
            <div className="h-7 w-px bg-border" />
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-500">{activeRate}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Hoạt động</p>
            </div>
            {lockedUsers > 0 && <>
              <div className="h-7 w-px bg-border" />
              <div className="text-center">
                <p className="text-xl font-bold text-amber-500">{lockedUsers}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Bị khóa</p>
              </div>
            </>}
          </div>
        </div>
      </div>

      {/* ── Stats Grid — same StatCard as StudentDashboard ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      {/* ── Bottom: Distribution + Quick Actions — same card style ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Phân bổ người dùng */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-0">
            <h2 className="font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Phân bổ người dùng
            </h2>
            <Link to="/admin/users"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/40 hover:shadow-sm transition-all duration-200 group">
              Xem tất cả
              <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="p-5 space-y-4">
            {distBars.map(({ label, value, color }) => {
              const pct = totalUsers > 0 ? Math.round(value / totalUsers * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <span className="text-xs font-bold">{value} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Thao tác nhanh */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center p-5 pb-0">
            <h2 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Thao tác nhanh
            </h2>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            {quickActions.map(({ label, href, icon: Icon, color }) => (
              <Link key={label} to={href}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-dashed hover:border-primary/30 hover:bg-gradient-to-br hover:from-primary/[0.03] hover:to-transparent transition-all group">
                <div className="w-9 h-9 rounded-lg bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <Icon className={`w-4 h-4 text-muted-foreground ${color} transition-colors`} />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

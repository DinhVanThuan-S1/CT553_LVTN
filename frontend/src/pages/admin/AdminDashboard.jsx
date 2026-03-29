/**
 * Admin Dashboard
 * Tổng quan: Cards thống kê + danh sách nhanh
 */
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import {
  Users, BookOpen, GraduationCap, Route, Target,
  TrendingUp, AlertCircle, Briefcase,
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

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
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <div className="h-4 w-20 skeleton mb-3" />
              <div className="h-8 w-12 skeleton mb-1" />
              <div className="h-3 w-28 skeleton" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Sinh viên',
      value: stats?.users?.totalStudents || 0,
      sub: `${stats?.users?.activeStudents || 0} đang hoạt động`,
      icon: Users,
      color: 'text-blue-500 bg-blue-500/10',
      alert: stats?.users?.lockedStudents > 0 ? `${stats.users.lockedStudents} bị khóa` : null,
    },
    {
      title: 'Nhà tuyển dụng',
      value: stats?.users?.totalEmployers || 0,
      sub: `${stats?.users?.activeEmployers || 0} đang hoạt động`,
      icon: Briefcase,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      title: 'Học phần',
      value: stats?.totalCourses || 0,
      sub: 'Trong hệ thống',
      icon: BookOpen,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      title: 'Kỹ năng',
      value: stats?.totalSkills || 0,
      sub: 'Đã thiết lập',
      icon: Target,
      color: 'text-rose-500 bg-rose-500/10',
    },
    {
      title: 'Chương trình ĐT',
      value: stats?.totalPrograms || 0,
      sub: 'Đã tạo',
      icon: GraduationCap,
      color: 'text-cyan-500 bg-cyan-500/10',
    },
    {
      title: 'Lộ trình mẫu',
      value: stats?.totalRoadmaps || 0,
      sub: 'Đang hoạt động',
      icon: Route,
      color: 'text-purple-500 bg-purple-500/10',
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <p className="text-muted-foreground text-sm mt-1">Dashboard quản trị hệ thống EduPath</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ title, value, sub, icon: Icon, color, alert }) => (
          <div key={title} className="rounded-xl border bg-card p-5 card-hover group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{title}</p>
                <p className="text-3xl font-bold mt-1">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center 
                group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            {alert && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/5 px-2 py-1 rounded-md">
                <AlertCircle className="w-3.5 h-3.5" />
                {alert}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Thêm học phần', href: '/admin/courses', icon: BookOpen },
            { label: 'Thêm kỹ năng', href: '/admin/skills', icon: Target },
            { label: 'Tạo lộ trình', href: '/admin/roadmaps', icon: Route },
            { label: 'Duyệt tin TD', href: '/admin/job-postings', icon: Briefcase },
          ].map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              className="flex items-center gap-3 p-3 rounded-lg border border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

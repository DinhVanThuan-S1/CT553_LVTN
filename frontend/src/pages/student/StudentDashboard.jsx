/**
 * Student Dashboard - Tổng quan sinh viên
 * Hiển thị GPA, tiến độ, upcoming sessions, thông tin nhanh
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import {
  BookOpen, Target, Route, Briefcase, TrendingUp,
  Calendar, Clock, ChevronRight, GraduationCap,
} from 'lucide-react';

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [pref, setPref] = useState(null);
  const [myRoadmaps, setMyRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [profileRes, prefRes, roadmapsRes] = await Promise.allSettled([
        api.get('/student/academic-profile'),
        api.get('/student/career-preferences'),
        api.get('/student/my-roadmaps'),
      ]);

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data.data);
      if (prefRes.status === 'fulfilled') setPref(prefRes.value.data.data);
      if (roadmapsRes.status === 'fulfilled') setMyRoadmaps(roadmapsRes.value.data.data || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-6">
              <div className="h-5 w-24 skeleton mb-3" />
              <div className="h-8 w-16 skeleton" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeRoadmap = myRoadmaps.find((r) => r.status === 'active');
  const upcomingSessions = activeRoadmap?.sessions
    ?.filter((s) => s.status === 'upcoming')
    ?.slice(0, 3) || [];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tổng Quan</h1>
        <p className="text-muted-foreground text-sm mt-1">Chào mừng trở lại! Đây là tình hình học tập của bạn.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5 card-hover group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">GPA hiện tại</p>
              <p className="text-3xl font-bold mt-1">
                {profile?.gpa?.toFixed(2) || '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">/ 4.00</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 card-hover group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tín chỉ tích lũy</p>
              <p className="text-3xl font-bold mt-1">{profile?.completedCredits || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">tín chỉ</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 card-hover group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Lộ trình đang học</p>
              <p className="text-3xl font-bold mt-1">{myRoadmaps.filter((r) => r.status === 'active').length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeRoadmap ? `${activeRoadmap.progress}% hoàn thành` : 'Chưa đăng ký'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Route className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 card-hover group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Nghề nghiệp mục tiêu</p>
              <p className="text-lg font-semibold mt-1 line-clamp-1">
                {pref?.careerPaths?.[0] || '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {pref?.careerPaths?.length > 1 ? `+${pref.careerPaths.length - 1} khác` : 'Chưa thiết lập'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tiến độ lộ trình */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Lộ trình đang học</h2>
            <Link to="/student/my-roadmap" className="text-sm text-primary hover:underline flex items-center gap-1">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {activeRoadmap ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{activeRoadmap.roadmap?.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{activeRoadmap.roadmap?.careerPath}</p>
              </div>
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Tiến độ</span>
                  <span className="font-semibold">{activeRoadmap.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                    style={{ width: `${activeRoadmap.progress}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {activeRoadmap.totalHoursLearned}h đã học
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {activeRoadmap.durationMonths} tháng
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Route className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">Bạn chưa đăng ký lộ trình nào</p>
              <Link to="/student/roadmaps" className="text-sm text-primary hover:underline font-medium">
                Khám phá lộ trình →
              </Link>
            </div>
          )}
        </div>

        {/* Buổi học sắp tới */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold mb-4">Buổi học sắp tới</h2>
          {upcomingSessions.length > 0 ? (
            <div className="space-y-3">
              {upcomingSessions.map((session, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {new Date(session.date).getDate()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{session.skill?.name || 'Kỹ năng'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.date).toLocaleDateString('vi-VN', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                      {' • '}{session.startTime} - {session.endTime}
                    </p>
                  </div>
                  <Badge variant="secondary">Sắp tới</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Chưa có buổi học nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Hồ sơ học tập', href: '/student/academic-profile', icon: BookOpen },
            { label: 'Sở thích nghề nghiệp', href: '/student/career-preferences', icon: Target },
            { label: 'Khám phá lộ trình', href: '/student/roadmaps', icon: Route },
            { label: 'Tìm việc làm', href: '/student/jobs', icon: Briefcase },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={label} to={href}
              className="flex items-center gap-3 p-3 rounded-lg border border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all group">
              <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

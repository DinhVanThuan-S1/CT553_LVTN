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
  Sparkles, ArrowRight, Flame,
} from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Chào buổi Sáng', emoji: '☀️' };
  if (h < 18) return { text: 'Chào buổi Chiều', emoji: '🌤️' };
  return { text: 'Chào buổi Tối', emoji: '🌙' };
}

function getDayLabel(date) {
  return new Date(date).toLocaleDateString('vi-VN', {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
  });
}

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
        {/* Skeleton header */}
        <div>
          <div className="h-7 w-48 skeleton mb-2" />
          <div className="h-4 w-72 skeleton" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
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

  // Collect all upcoming sessions, chỉ lấy buổi chưa kết thúc so với thời điểm hiện tại
  // So sánh (date + endTime) với now để loại bỏ buổi đã qua trong ngày hôm nay
  const now = new Date();

  function getSessionEndDatetime(session) {
    const d = new Date(session.date);
    // endTime dạng "HH:MM"
    const [h, m] = (session.endTime || '23:59').split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  }

  const upcomingSessions = myRoadmaps
    .filter((r) => r.status === 'active')
    .flatMap((r) =>
      (r.sessions || [])
        .filter((s) => s.status === 'upcoming' && getSessionEndDatetime(s) > now)
        .map((s) => ({ ...s, _prId: r._id }))
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const greeting = getGreeting();
  const completedCredits = profile?.completedCredits || 0;
  const gpa = profile?.gpa;
  const activeCount = myRoadmaps.filter((r) => r.status === 'active').length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-accent/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
            <span className="text-base">{greeting.emoji}</span> {greeting.text}!
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tổng Quan</h1>
          <p className="text-muted-foreground text-sm mt-1.5 max-w-lg">
            Theo dõi tiến độ, lộ trình và các buổi học sắp tới của bạn.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<GraduationCap className="w-5 h-5" />}
          iconBg="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          label="GPA hiện tại"
          value={gpa?.toFixed(2) || '—'}
          sub="/ 4.00"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          label="Tín chỉ tích lũy"
          value={completedCredits}
          sub="Tín chỉ"
        />
        <StatCard
          icon={<Route className="w-5 h-5" />}
          iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          label="Lộ trình của tôi"
          value={activeCount}
          sub={activeRoadmap ? `${activeRoadmap.progress}% hoàn thành` : 'Chưa đăng ký'}
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          iconBg="bg-rose-500/10 text-rose-600 dark:text-rose-400"
          label="Nghề nghiệp mục tiêu"
          value={pref?.careerPaths?.[0] || '—'}
          sub={pref?.careerPaths?.length > 1 ? `+${pref.careerPaths.length - 1} khác` : 'Chưa thiết lập'}
          isText
        />
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tiến độ lộ trình */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-0">
            <h2 className="font-semibold flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              Lộ trình của tôi
            </h2>
            <Link to="/student/my-roadmap"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/40 hover:shadow-sm transition-all duration-200 group">
              Xem tất cả
              <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="p-5">
            {activeRoadmap ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                    <Route className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium leading-snug">{activeRoadmap.roadmap?.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{activeRoadmap.roadmap?.careerPath}</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground text-xs">Tiến độ</span>
                    <span className="font-semibold text-sm">{activeRoadmap.progress}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${activeRoadmap.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                    <Clock className="w-3.5 h-3.5" /> {activeRoadmap.totalHoursLearned}h đã học
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                    <Calendar className="w-3.5 h-3.5" /> {activeRoadmap.durationMonths} tháng
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Route className="w-7 h-7 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">Bạn chưa đăng ký lộ trình nào</p>
                <Link to="/student/roadmaps" className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                  Khám phá lộ trình <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Buổi học sắp tới */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-0">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Buổi học sắp tới
            </h2>
            <Link to="/student/progress"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/40 hover:shadow-sm transition-all duration-200 group">
              Xem tất cả
              <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="p-5">
            {upcomingSessions.length > 0 ? (
              <div className="space-y-2">
                {upcomingSessions.map((session, i) => {
                  const sessionDate = new Date(session.date);
                  const dayNum = sessionDate.getDate();
                  const isToday = new Date().toDateString() === sessionDate.toDateString();

                  return (
                    <Link
                      key={session._id || i}
                      to={`/student/my-roadmap/${session._prId}/session/${session._id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-primary/20 hover:bg-primary/[0.03] transition-all group"
                    >
                      <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center text-sm font-bold shrink-0 transition-transform group-hover:scale-105 ${isToday
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                        : 'bg-primary/10 text-primary'
                        }`}>
                        <span className="text-base leading-none">{dayNum}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                          {session.skill?.name || 'Kỹ năng'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {getDayLabel(session.date)}
                          {' • '}{session.startTime} - {session.endTime}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="text-[10px] font-medium">
                          {isToday ? 'Hôm nay' : 'Sắp tới'}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-7 h-7 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground">Chưa có buổi học nào sắp tới</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Hồ sơ học tập', href: '/student/academic-profile', icon: BookOpen, color: 'group-hover:text-sky-500' },
            { label: 'Sở thích nghề nghiệp', href: '/student/career-preferences', icon: Target, color: 'group-hover:text-rose-500' },
            { label: 'Khám phá lộ trình', href: '/student/roadmaps', icon: Route, color: 'group-hover:text-amber-500' },
            { label: 'Tìm việc làm', href: '/student/jobs', icon: Briefcase, color: 'group-hover:text-emerald-500' },
          ].map(({ label, href, icon: Icon, color }) => (
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
  );
}

function StatCard({ icon, iconBg, label, value, sub, isText }) {
  return (
    <div className="rounded-xl border bg-card p-5 card-hover group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className={`${isText ? 'text-base' : 'text-2xl'} font-bold mt-1.5 leading-tight ${isText ? 'line-clamp-1' : ''}`}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

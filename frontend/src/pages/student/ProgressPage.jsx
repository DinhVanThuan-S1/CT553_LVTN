/**
 * ProgressPage - Tổng quan tiến độ + Lịch học tuần/tháng
 * Hiển thị stats, calendar view theo tuần/tháng, chi tiết lộ trình
 */
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import {
  TrendingUp, Clock, CheckCircle2, Loader2,
  Target, Calendar, BookOpen, Route,
  BarChart3, Award, ChevronLeft, ChevronRight,
  Eye, Circle,
} from 'lucide-react';

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day + 1); // Monday
  if (day === 0) start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthRange(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function formatDateShort(d) {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function isSameDay(a, b) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

export default function ProgressPage() {
  const toast = useToast();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarMode, setCalendarMode] = useState('week'); // 'week' | 'month'
  const [referenceDate, setReferenceDate] = useState(new Date());

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data } = await api.get('/student/my-roadmaps');
      setRoadmaps(data.data);
    } catch {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  // Flatten all sessions across active/completed roadmaps only (exclude paused/cancelled)
  const allSessions = useMemo(() => {
    const now = new Date();
    const sessions = [];
    roadmaps
      .filter((pr) => pr.status === 'active' || pr.status === 'completed')
      .forEach((pr) => {
        (pr.sessions || []).forEach((s) => {
          const sessionDate = new Date(s.date);
          // Derive missed on frontend: upcoming + past end time → missed
          let status = s.status;
          if (s.status === 'upcoming') {
            const [endH, endM] = (s.endTime || '23:59').split(':').map(Number);
            const endDateTime = new Date(sessionDate);
            endDateTime.setHours(endH, endM, 0, 0);
            if (endDateTime < now) status = 'missed';
          }
          sessions.push({
            ...s,
            status,
            roadmapId: pr._id,
            roadmapTitle: pr.roadmap?.title || '',
            date: sessionDate,
          });
        });
      });
    return sessions;
  }, [roadmaps]);

  // Stats — chỉ tính active/paused/completed (bỏ cancelled)
  const visibleRoadmaps = roadmaps.filter((r) => r.status !== 'cancelled');
  const totalRoadmaps = visibleRoadmaps.length;
  const activeRoadmaps = visibleRoadmaps.filter((r) => r.status === 'active').length;
  const completedRoadmaps = visibleRoadmaps.filter((r) => r.status === 'completed').length;
  const totalHours = visibleRoadmaps.reduce((sum, r) => sum + (r.totalHoursLearned || 0), 0);
  const totalSessions = allSessions.length;
  const completedSessions = allSessions.filter((s) => s.status === 'completed').length;
  const avgProgress = totalRoadmaps > 0
    ? Math.round(visibleRoadmaps.reduce((sum, r) => sum + (r.progress || 0), 0) / totalRoadmaps)
    : 0;

  // Color map cho từng roadmap — mỗi roadmap 1 màu riêng
  const ROADMAP_COLORS = [
    { bg: 'bg-blue-500/15', text: 'text-blue-700', border: 'border-l-blue-500', dot: 'bg-blue-500' },
    { bg: 'bg-amber-500/15', text: 'text-amber-700', border: 'border-l-amber-500', dot: 'bg-amber-500' },
    { bg: 'bg-violet-500/15', text: 'text-violet-700', border: 'border-l-violet-500', dot: 'bg-violet-500' },
    { bg: 'bg-rose-500/15', text: 'text-rose-700', border: 'border-l-rose-500', dot: 'bg-rose-500' },
    { bg: 'bg-teal-500/15', text: 'text-teal-700', border: 'border-l-teal-500', dot: 'bg-teal-500' },
    { bg: 'bg-orange-500/15', text: 'text-orange-700', border: 'border-l-orange-500', dot: 'bg-orange-500' },
  ];
  const roadmapColorMap = useMemo(() => {
    const map = {};
    visibleRoadmaps.forEach((pr, idx) => {
      map[pr._id] = ROADMAP_COLORS[idx % ROADMAP_COLORS.length];
    });
    return map;
  }, [visibleRoadmaps]);

  // Navigation
  function navigate(dir) {
    setReferenceDate((prev) => {
      const d = new Date(prev);
      if (calendarMode === 'week') {
        d.setDate(d.getDate() + dir * 7);
      } else {
        d.setMonth(d.getMonth() + dir);
      }
      return d;
    });
  }

  function goToday() {
    setReferenceDate(new Date());
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="h-32 skeleton rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-teal-500/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Tiến Độ Học tập</span>
          </div>
          {/* <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tiến Độ Học Tập</h1> */}
          <p className="text-muted-foreground text-sm mt-1.5">Tổng quan quá trình học và rèn luyện kỹ năng</p>
        </div>
      </div>

      {totalRoadmaps === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Chưa có dữ liệu</h3>
          <p className="text-sm text-muted-foreground">
            Đăng ký một lộ trình để bắt đầu theo dõi tiến độ
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={<Route className="w-5 h-5" />}
              value={`${activeRoadmaps} / ${totalRoadmaps}`}
              label="Lộ trình đang học"
              color="primary"
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              value={`${totalHours}h`}
              label="Tổng giờ đã học"
              color="amber"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              value={`${completedSessions} / ${totalSessions}`}
              label="Buổi hoàn thành"
              color="emerald"
            />
            <StatCard
              icon={<Target className="w-5 h-5" />}
              value={`${avgProgress}%`}
              label="Tiến độ TB"
              color="sky"
            />
          </div>

          {/* Calendar Section */}
          <div className="rounded-xl border bg-card overflow-hidden">
            {/* Calendar Header */}
            <div className="p-4 border-b flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Lịch học
              </h2>
              <div className="flex items-center gap-2">
                {/* Mode tabs */}
                <div className="flex rounded-lg border overflow-hidden text-xs">
                  <button
                    className={`px-3 py-1.5 font-medium transition-colors ${calendarMode === 'week' ? 'bg-primary text-white' : 'hover:bg-muted/50'
                      }`}
                    onClick={() => setCalendarMode('week')}>
                    Tuần
                  </button>
                  <button
                    className={`px-3 py-1.5 font-medium transition-colors ${calendarMode === 'month' ? 'bg-primary text-white' : 'hover:bg-muted/50'
                      }`}
                    onClick={() => setCalendarMode('month')}>
                    Tháng
                  </button>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={goToday}>
                  Hôm nay
                </Button>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(-1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Calendar Content */}
            {calendarMode === 'week' ? (
              <WeekView referenceDate={referenceDate} sessions={allSessions} roadmapColorMap={roadmapColorMap} />
            ) : (
              <MonthView referenceDate={referenceDate} sessions={allSessions} roadmapColorMap={roadmapColorMap} />
            )}

            {/* Legend */}
            <div className="px-4 py-2.5 border-t bg-muted/10 flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
              <span className="font-medium text-foreground mr-1">Trạng thái:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Hoàn thành
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Sắp tới
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Bỏ lỡ
              </span>
              {visibleRoadmaps.length > 1 && (
                <>
                  <span className="mx-1 text-border">|</span>
                  <span className="font-medium text-foreground mr-1">Lộ trình:</span>
                  {visibleRoadmaps.filter(r => r.status === 'active' || r.status === 'completed').map((pr) => (
                    <span key={pr._id} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-sm ${roadmapColorMap[pr._id]?.dot}`} />
                      <span className="truncate max-w-[120px]">{pr.roadmap?.title}</span>
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Roadmap Progress Cards */}
          <div>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Chi tiết từng lộ trình
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleRoadmaps.map(pr => {
                const sessions = pr.sessions || [];
                const done = sessions.filter(s => s.status === 'completed').length;
                const total = sessions.length;
                const pct = pr.progress || 0;
                const rmColor = roadmapColorMap[pr._id];

                const STATUS_MAP = {
                  active: { label: 'Đang học', cls: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' },
                  completed: { label: 'Hoàn thành', cls: 'bg-primary/10    text-primary    border border-primary/20' },
                  paused: { label: 'Tạm dừng', cls: 'bg-amber-500/10  text-amber-600  border border-amber-500/20' },
                  cancelled: { label: 'Đã hủy', cls: 'bg-red-500/10    text-red-600    border border-red-500/20' },
                };
                const st = STATUS_MAP[pr.status] || STATUS_MAP.cancelled;
                const progressBar = pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-primary' : 'bg-amber-500';

                return (
                  <div key={pr._id} className="rounded-xl border bg-card overflow-hidden">
                    {/* Color strip */}
                    <div className={`h-1.5 ${rmColor?.dot || 'bg-primary'}`}
                      style={{ width: '100%', background: undefined }}
                    />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm leading-snug truncate">{pr.roadmap?.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{pr.roadmap?.careerPath}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                          <span>{done} / {total} buổi hoàn thành</span>
                          <span className="font-bold text-foreground">{pct}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${progressBar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {pr.totalHoursLearned || 0}h đã học
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {pr.durationMonths} tháng
                        </span>
                        {pr.readinessScore > 0 && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Award className="w-3.5 h-3.5" /> Sẵn sàng: {pr.readinessScore}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completed Roadmaps */}
          {completedRoadmaps > 0 && (
            <div className="rounded-xl border bg-gradient-to-br from-emerald-500/5 to-transparent p-6">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-emerald-500" /> Lộ trình đã hoàn thành ({completedRoadmaps})
              </h3>
              <div className="flex flex-wrap gap-2">
                {roadmaps.filter((r) => r.status === 'completed').map((r) => (
                  <Badge key={r._id} variant="success" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {r.roadmap?.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Week View ---------- */
function WeekView({ referenceDate, sessions, roadmapColorMap }) {
  const { start, end } = getWeekRange(referenceDate);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }

  const today = new Date();

  // Group sessions by day
  const sessionsByDay = days.map((day) =>
    sessions.filter((s) => isSameDay(s.date, day))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  );

  const weekLabel = `${formatDateShort(start)} — ${formatDateShort(end)}/${end.getFullYear()}`;

  return (
    <div className="p-4">
      <p className="text-sm font-medium text-center mb-4 text-muted-foreground">{weekLabel}</p>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          const daySessions = sessionsByDay[i];
          const completed = daySessions.filter((s) => s.status === 'completed').length;
          const upcoming = daySessions.filter((s) => s.status === 'upcoming').length;
          const missed = daySessions.filter((s) => s.status === 'missed').length;

          return (
            <div key={i} className={`rounded-lg border p-2 min-h-[140px] transition-colors ${isToday ? 'border-primary bg-primary/[0.03] ring-1 ring-primary/20' : 'bg-card'
              }`}>
              {/* Day header */}
              <div className="text-center mb-2">
                <p className="text-[10px] text-muted-foreground font-medium">{DAY_LABELS[(i + 1) % 7]}</p>
                <p className={`text-sm font-bold ${isToday ? 'text-primary' : ''}`}>
                  {day.getDate()}
                </p>
              </div>

              {/* Sessions */}
              <div className="space-y-1">
                {daySessions.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/40 text-center mt-4">—</p>
                )}
                {daySessions.map((s) => (
                  <SessionChip key={s._id} session={s} roadmapColorMap={roadmapColorMap} />
                ))}
              </div>

              {/* Summary dots */}
              {daySessions.length > 0 && (
                <div className="flex items-center justify-center gap-0.5 mt-1.5">
                  {completed > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  {upcoming > 0 && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  {missed > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Month View ---------- */
function MonthView({ referenceDate, sessions, roadmapColorMap }) {
  const { start: monthStart, end: monthEnd } = getMonthRange(referenceDate);
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1);
  let startDay = firstDayOfMonth.getDay(); // 0=Sunday
  if (startDay === 0) startDay = 7; // treat Sunday as 7 for Monday-start
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Fill empty cells before month start
  const calendarDays = [];
  for (let i = 1; i < startDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }

  const today = new Date();

  return (
    <div className="p-4">
      <p className="text-sm font-medium text-center mb-4 text-muted-foreground">
        {MONTH_NAMES[month]} {year}
      </p>

      {/* Header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="min-h-[120px] rounded" />;
          }

          const isToday = isSameDay(day, today);
          const daySessions = sessions.filter((s) => isSameDay(s.date, day));
          const completed = daySessions.filter((s) => s.status === 'completed').length;
          const upcoming = daySessions.filter((s) => s.status === 'upcoming').length;
          const total = daySessions.length;

          return (
            <div key={i} className={`min-h-[120px] rounded-lg border p-1.5 transition-colors relative group ${isToday ? 'border-primary bg-primary/[0.03] ring-1 ring-primary/20' : 'bg-card hover:bg-muted/20'
              }`}>
              <span className={`text-xs font-medium ${isToday ? 'text-primary font-bold' : ''}`}>
                {day.getDate()}
              </span>

              {total > 0 && (
                <div className="mt-0.5 space-y-0.5">
                  {daySessions.map((s) => {
                    const rmColor = roadmapColorMap?.[s.roadmapId];
                    const statusClass = s.status === 'completed'
                      ? 'bg-emerald-500/15 text-emerald-700'
                      : s.status === 'missed'
                        ? 'bg-red-400/15 text-red-600'
                        : 'bg-primary/10 text-primary';
                    return (
                      <Link
                        key={s._id}
                        to={`/student/my-roadmap/${s.roadmapId}/session/${s._id}`}
                        className={`block text-[9px] px-1 py-0.5 rounded truncate border-l-[2px] hover:opacity-80 transition-opacity cursor-pointer ${statusClass} ${rmColor?.border || ''}`}
                      >
                        {s.skill?.name || 'Kỹ năng'}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Hover tooltip */}
              {total > 0 && (
                <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-50
                  bg-popover border rounded-lg shadow-lg p-2.5 min-w-[180px] max-w-[240px]">
                  <p className="text-xs font-medium mb-1.5">
                    {day.toLocaleDateString('vi-VN')} — {total} buổi
                  </p>
                  <div className="space-y-1">
                    {daySessions.map((s) => (
                      <div key={s._id} className="flex items-center gap-1.5 text-[10px]">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.status === 'completed' ? 'bg-emerald-500' : s.status === 'missed' ? 'bg-red-400' : 'bg-primary'
                          }`} />
                        <span className="truncate">{s.skill?.icon} {s.skill?.name}</span>
                        <span className="ml-auto text-muted-foreground whitespace-nowrap">{s.startTime}</span>
                      </div>
                    ))}
                    {/* Hiện tên lộ trình ở dưới tooltip */}
                    {daySessions.some(s => s.roadmapTitle) && (
                      <div className="mt-1 pt-1 border-t border-border/50 space-y-0.5">
                        {[...new Set(daySessions.map(s => s.roadmapId))].map(rid => {
                          const s = daySessions.find(x => x.roadmapId === rid);
                          const color = roadmapColorMap?.[rid];
                          return (
                            <div key={rid} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                              <span className={`w-1.5 h-1.5 rounded-sm shrink-0 ${color?.dot || 'bg-muted-foreground'}`} />
                              <span className="truncate">{s?.roadmapTitle}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Session Chip (for Week View) ---------- */
function SessionChip({ session, roadmapColorMap }) {
  const s = session;
  const rmColor = roadmapColorMap?.[s.roadmapId];
  const statusBg = s.status === 'completed'
    ? 'bg-emerald-500/15 text-emerald-700 border-emerald-200'
    : s.status === 'missed'
      ? 'bg-red-400/15 text-red-600 border-red-200'
      : 'bg-primary/10 text-primary border-primary/20';

  return (
    <Link to={`/student/my-roadmap/${s.roadmapId}/session/${s._id}`}
      className={`block px-1.5 py-1 rounded border text-[10px] leading-tight hover:opacity-80 transition-opacity border-l-[3px] ${statusBg} ${rmColor?.border || ''}`}>
      <div className="font-medium truncate">{s.skill?.icon} {s.skill?.name || 'Kỹ năng'}</div>
      <div className="text-[9px] opacity-70">{s.startTime}-{s.endTime}</div>
    </Link>
  );
}

/* ---------- Stat Card ---------- */
function StatCard({ icon, value, label, color }) {
  const colorMap = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', icon: 'text-primary' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600', icon: 'text-amber-500' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', icon: 'text-emerald-500' },
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-600', icon: 'text-sky-500' },
  };
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-lg ${c.bg} ${c.icon} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

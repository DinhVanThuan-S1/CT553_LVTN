/**
 * AdminReportsPage — Trang Thống kê & Báo cáo
 * Với bộ lọc khoảng thời gian và biểu đồ được cải tiến
 */
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts';
import {
  Users, Briefcase, GraduationCap, TrendingUp, FileText, Route as RouteIcon,
  RefreshCcw, Award, MapPin, BarChart3, Calendar, X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

// ─── Palette ──────────────────────────────────────
const COLORS = [
  'hsl(167, 75%, 45%)', 'hsl(217, 82%, 55%)', 'hsl(45, 85%, 50%)',
  'hsl(340, 70%, 55%)', 'hsl(271, 65%, 55%)', 'hsl(145, 60%, 45%)',
  'hsl(30, 80%, 55%)', 'hsl(190, 70%, 50%)',
];
const STATUS_COLORS = {
  'Đang học': 'hsl(217, 82%, 55%)', 'Hoàn thành': 'hsl(145, 60%, 45%)',
  'Tạm dừng': 'hsl(45, 85%, 50%)', 'Đã hủy': 'hsl(340, 70%, 55%)',
  'Chưa bắt đầu': 'hsl(220, 10%, 60%)', 'Chờ xem xét': 'hsl(217, 82%, 55%)',
  'Đã xem': 'hsl(167, 75%, 45%)', 'Hẹn phỏng vấn': 'hsl(45, 85%, 50%)',
  'Được nhận': 'hsl(145, 60%, 45%)', 'Bị từ chối': 'hsl(340, 70%, 55%)',
  'Đã rút': 'hsl(220, 10%, 60%)', 'Nháp': 'hsl(220, 10%, 60%)',
  'Chờ duyệt': 'hsl(45, 85%, 50%)', 'Đã duyệt': 'hsl(145, 60%, 45%)',
  'Hết hạn': 'hsl(30, 80%, 55%)',
};

// ─── Time range options ───────────────────────────
const RANGES = [
  { label: '3 tháng', months: 3 },
  { label: '6 tháng', months: 6 },
  { label: '12 tháng', months: 12 },
  { label: 'Tất cả', months: 0 },
];

// ─── Custom Tooltip ───────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-popover/95 backdrop-blur-xl shadow-lg p-3.5 min-w-[140px]">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 pb-2 border-b border-border/50">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-sm py-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-bold tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── PieWithLegend — legend tách ra ngoài, không bị clip ─
function PieWithLegend({ data, colorMap, height = 260 }) {
  const total = data.reduce((s, d) => s + (d.count || 0), 0);
  return (
    <div className="flex items-center gap-4">
      {/* Chart */}
      <div className="shrink-0" style={{ width: 200, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%"
              innerRadius={62} outerRadius={92}
              dataKey="count" nameKey="label"
              stroke="none" paddingAngle={3}>
              {data.map((entry, i) => (
                <Cell key={i} fill={colorMap[entry.label] || COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex-1 min-w-0 space-y-2">
        {data.map((entry, i) => {
          const pct = total > 0 ? Math.round(entry.count / total * 100) : 0;
          const color = colorMap[entry.label] || COLORS[i % COLORS.length];
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-muted-foreground truncate">{entry.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="font-semibold">{entry.count}</span>
                  <span className="text-muted-foreground/60 text-[10px] w-8 text-right">{pct}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────
function StatCard({ icon, iconBg, label, value, sub }) {
  return (
    <div className="rounded-xl border bg-card p-5 card-hover group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1.5 leading-tight">{value ?? '—'}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── ChartCard ────────────────────────────────────
function ChartCard({ title, icon: Icon, iconCls = 'text-primary', headBg = 'bg-primary/5', borderColor = 'border-l-primary/40', children, className = '' }) {
  return (
    <div className={`rounded-xl border bg-card overflow-hidden border-l-4 ${borderColor} ${className}`}>
      <div className={`flex items-center gap-2.5 px-5 py-3.5 border-b ${headBg}`}>
        <Icon className={`w-4 h-4 ${iconCls}`} />
        <h3 className={`text-sm font-semibold ${iconCls}`}>{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────
function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40">
      <BarChart3 className="w-10 h-10 mb-2" />
      <p className="text-sm">Chưa có dữ liệu</p>
    </div>
  );
}

// ─── Shared axis props ────────────────────────────
const axisProps = { tick: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }, stroke: 'hsl(var(--border))' };
const gridProps = { stroke: 'hsl(var(--border))', strokeDasharray: '3 3', opacity: 0.6 };

export default function AdminReportsPage() {
  const [months, setMonths] = useState(6);
  // Custom date range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCustomRange, setIsCustomRange] = useState(false);

  const [overview, setOverview] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [careerPaths, setCareerPaths] = useState([]);
  const [roadmapCompletion, setRoadmapCompletion] = useState(null);
  const [topSkills, setTopSkills] = useState([]);
  const [appStats, setAppStats] = useState(null);
  const [jobStats, setJobStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const toQS = (p) => Object.keys(p).length ? '?' + new URLSearchParams(p).toString() : '';
      const rangeParams = isCustomRange && startDate && endDate
        ? { startDate, endDate }
        : months > 0 ? { months } : {};
      const appParams = isCustomRange && startDate && endDate
        ? { startDate, endDate }
        : { months: months > 0 ? months : 120 };
      const q = toQS(rangeParams);
      const appQ = toQS(appParams);
      const [ov, reg, cp, rc, ts, apps, jobs] = await Promise.all([
        api.get(`/admin/reports/overview${q}`),
        api.get(`/admin/reports/registrations${q}`),
        api.get('/admin/reports/career-paths'),
        api.get('/admin/reports/roadmap-completion'),
        api.get('/admin/reports/top-skills'),
        api.get(`/admin/reports/applications${appQ}`),
        api.get('/admin/reports/job-postings'),
      ]);
      setOverview(ov.data.data);
      setRegistrations(reg.data.data);
      setCareerPaths(cp.data.data);
      setRoadmapCompletion(rc.data.data);
      setTopSkills(ts.data.data);
      setAppStats(apps.data.data);
      setJobStats(jobs.data.data);
    } catch (err) {
      console.error('Report fetch error:', err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months, isCustomRange, startDate, endDate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function selectQuickRange(m) {
    setMonths(m);
    setIsCustomRange(false);
    setStartDate('');
    setEndDate('');
  }

  function applyCustomRange() {
    if (startDate && endDate && endDate >= startDate) setIsCustomRange(true);
  }

  function clearCustomRange() {
    setIsCustomRange(false);
    setStartDate('');
    setEndDate('');
  }

  function handleRefresh() {
    setIsCustomRange(false);
    setStartDate('');
    setEndDate('');
    setMonths(6);
    // fetchAll sẽ tự re-run qua useEffect khi state thay đổi
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="h-32 skeleton rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <div className="h-3 w-20 skeleton mb-3" /><div className="h-7 w-12 skeleton mb-2" /><div className="h-2.5 w-28 skeleton" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card overflow-hidden">
              <div className="h-12 skeleton" /><div className="m-5 h-52 skeleton rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const rangeLabel = isCustomRange && startDate && endDate
    ? `${new Date(startDate + 'T00:00:00').toLocaleDateString('vi-VN')} – ${new Date(endDate + 'T00:00:00').toLocaleDateString('vi-VN')}`
    : RANGES.find(r => r.months === months)?.label || '6 tháng';

  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-accent/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col gap-4">
          {/* Title + refresh */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-widest">Thống Kê & Báo Cáo</span>
              </p>
              <p className="text-muted-foreground text-sm mt-1.5">
                {isCustomRange
                  ? <>Dữ liệu từ <strong className="text-foreground">{rangeLabel}</strong></>
                  : <>Dữ liệu trong <strong className="text-foreground">{rangeLabel}</strong> gần nhất</>}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5 h-8 text-xs shrink-0">
              <RefreshCcw className="w-3 h-3" /> Làm mới
            </Button>
          </div>

          {/* Filter controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick pills */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground ml-1.5 mr-0.5" />
              {RANGES.map(({ label, months: m }) => (
                <button key={m} onClick={() => selectQuickRange(m)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    !isCustomRange && months === m
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-border/60 shrink-0 hidden sm:block" />

            {/* Date range inputs */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                Tuỳ chỉnh:
              </span>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={e => { setStartDate(e.target.value); setIsCustomRange(false); }}
                className="h-8 px-2.5 rounded-lg border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition cursor-pointer"
              />
              <span className="text-muted-foreground text-xs shrink-0">→</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={e => { setEndDate(e.target.value); setIsCustomRange(false); }}
                className="h-8 px-2.5 rounded-lg border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition cursor-pointer"
              />

              {/* Apply button */}
              {startDate && endDate && !isCustomRange && endDate >= startDate && (
                <button
                  onClick={applyCustomRange}
                  className="h-8 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shrink-0"
                >
                  Áp dụng
                </button>
              )}

              {/* Clear custom range */}
              {isCustomRange && (
                <button
                  onClick={clearCustomRange}
                  className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/60 transition shrink-0"
                  title="Xóa bộ lọc tuỳ chỉnh"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Active badge */}
              {isCustomRange && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <Calendar className="w-2.5 h-2.5 shrink-0" /> Đang lọc theo ngày
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards Row 1 ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} iconBg="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          label="Sinh viên" value={overview?.totalStudents} />
        <StatCard icon={<Briefcase className="w-5 h-5" />} iconBg="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          label="Nhà tuyển dụng" value={overview?.totalEmployers} />
        <StatCard icon={<FileText className="w-5 h-5" />} iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          label="Tin tuyển dụng" value={overview?.totalJobPostings}
          sub={overview?.pendingJobs > 0 ? `${overview.pendingJobs} chờ duyệt` : undefined} />
        <StatCard icon={<GraduationCap className="w-5 h-5" />} iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          label="Đơn ứng tuyển" value={overview?.totalApplications} />
      </div>

      {/* ── Stat Cards Row 2 ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<RouteIcon className="w-5 h-5" />} iconBg="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
          label="Lộ trình mẫu" value={overview?.totalRoadmaps} />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-primary/10 text-primary"
          label="Lộ trình đang học" value={overview?.activePersonalRoadmaps} />
        <StatCard icon={<Award className="w-5 h-5" />} iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          label="TB hoàn thành"
          value={roadmapCompletion ? `${roadmapCompletion.averageCompletion}%` : '—'}
          sub="Tỷ lệ hoàn thành lộ trình" />
      </div>

      {/* ── Chart: Đăng ký theo tháng — AreaChart ── */}
      <ChartCard title="Đăng ký tài khoản theo tháng" icon={Users}
        iconCls="text-sky-600" headBg="bg-sky-500/5" borderColor="border-l-sky-400/50">
        {registrations.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={registrations} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(167, 75%, 45%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(167, 75%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradEmployers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 82%, 55%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(217, 82%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="students" name="Sinh viên"
                  stroke="hsl(167, 75%, 45%)" strokeWidth={2.5}
                  fill="url(#gradStudents)"
                  dot={{ r: 3.5, fill: 'hsl(167, 75%, 45%)' }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="employers" name="Nhà tuyển dụng"
                  stroke="hsl(217, 82%, 55%)" strokeWidth={2.5}
                  fill="url(#gradEmployers)"
                  dot={{ r: 3.5, fill: 'hsl(217, 82%, 55%)' }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-3">
              {[['hsl(167, 75%, 45%)', 'Sinh viên'], ['hsl(217, 82%, 55%)', 'Nhà tuyển dụng']].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </div>
              ))}
            </div>
          </>
        ) : <EmptyChart />}
      </ChartCard>


      {/* ── Charts Row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Hướng nghề nghiệp phổ biến" icon={MapPin}
          iconCls="text-rose-600" headBg="bg-rose-500/5" borderColor="border-l-rose-400/50">
          {careerPaths.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={careerPaths} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridProps} horizontal={false} />
                <XAxis type="number" {...axisProps} />
                <YAxis dataKey="name" type="category" {...axisProps} width={150} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Sinh viên" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {careerPaths.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Trạng thái lộ trình cá nhân" icon={RouteIcon}
          iconCls="text-indigo-600" headBg="bg-indigo-500/5" borderColor="border-l-indigo-400/50">
          {roadmapCompletion?.distribution?.length > 0
            ? <PieWithLegend data={roadmapCompletion.distribution} colorMap={STATUS_COLORS} />
            : <EmptyChart />}
        </ChartCard>
      </div>

      {/* ── Charts Row 3 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top kỹ năng được học nhiều nhất" icon={Award}
          iconCls="text-amber-600" headBg="bg-amber-500/5" borderColor="border-l-amber-400/50">
          {topSkills.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topSkills} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridProps} horizontal={false} />
                <XAxis type="number" {...axisProps} />
                <YAxis dataKey="name" type="category" {...axisProps} width={140} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Lượt học" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {topSkills.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Thống kê đơn ứng tuyển" icon={FileText}
          iconCls="text-emerald-600" headBg="bg-emerald-500/5" borderColor="border-l-emerald-400/50">
          {appStats?.byStatus?.length > 0
            ? <PieWithLegend data={appStats.byStatus} colorMap={STATUS_COLORS} />
            : <EmptyChart />}
        </ChartCard>
      </div>

      {/* ── Charts Row 4 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Trạng thái tin tuyển dụng" icon={Briefcase}
          iconCls="text-blue-600" headBg="bg-blue-500/5" borderColor="border-l-blue-400/50">
          {jobStats?.byStatus?.length > 0
            ? <PieWithLegend data={jobStats.byStatus} colorMap={STATUS_COLORS} />
            : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Top công ty đăng tin" icon={Briefcase}
          iconCls="text-primary" headBg="bg-primary/5" borderColor="border-l-primary/40">
          {jobStats?.topCompanies?.length > 0 ? (
            <div className="space-y-4 pt-1">
              {jobStats.topCompanies.map((company, i) => {
                const maxCount = jobStats.topCompanies[0].count;
                const pct = maxCount > 0 ? (company.count / maxCount) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-medium truncate">{company.name}</span>
                      </div>
                      <span className="text-muted-foreground text-xs shrink-0 ml-2">{company.count} tin</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* ── Ứng tuyển theo tháng — AreaChart ── */}
      {appStats?.monthly?.length > 0 && (
        <ChartCard title="Lượt ứng tuyển theo tháng" icon={TrendingUp}
          iconCls="text-primary" headBg="bg-primary/5" borderColor="border-l-primary/40">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={appStats.monthly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradApps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(167, 75%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(167, 75%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Đơn ứng tuyển"
                stroke="hsl(167, 75%, 45%)" strokeWidth={2.5}
                fill="url(#gradApps)"
                dot={{ r: 4, fill: 'hsl(167, 75%, 45%)', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}

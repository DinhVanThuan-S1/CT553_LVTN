/**
 * AdminReportsPage — Trang Thống kê & Báo cáo
 * Biểu đồ: đăng ký theo tháng, hướng nghề, tỷ lệ lộ trình, top kỹ năng, ứng tuyển, tin TD
 */
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import {
  Users, Briefcase, GraduationCap, TrendingUp, FileText, Route as RouteIcon,
  RefreshCcw, Award, MapPin,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

// Bảng màu hài hòa
const COLORS = [
  'hsl(167, 75%, 45%)',  // teal
  'hsl(217, 82%, 55%)',  // blue
  'hsl(45, 85%, 50%)',   // amber
  'hsl(340, 70%, 55%)',  // rose
  'hsl(271, 65%, 55%)',  // violet
  'hsl(145, 60%, 45%)',  // green
  'hsl(30, 80%, 55%)',   // orange
  'hsl(190, 70%, 50%)',  // cyan
];

const STATUS_COLORS = {
  'Đang học': 'hsl(217, 82%, 55%)',
  'Hoàn thành': 'hsl(145, 60%, 45%)',
  'Tạm dừng': 'hsl(45, 85%, 50%)',
  'Đã hủy': 'hsl(340, 70%, 55%)',
  'Chưa bắt đầu': 'hsl(220, 10%, 60%)',
  // Application
  'Chờ xem xét': 'hsl(217, 82%, 55%)',
  'Đã xem': 'hsl(167, 75%, 45%)',
  'Hẹn phỏng vấn': 'hsl(45, 85%, 50%)',
  'Được nhận': 'hsl(145, 60%, 45%)',
  'Bị từ chối': 'hsl(340, 70%, 55%)',
  'Đã rút': 'hsl(220, 10%, 60%)',
  // Job
  'Nháp': 'hsl(220, 10%, 60%)',
  'Chờ duyệt': 'hsl(45, 85%, 50%)',
  'Đã duyệt': 'hsl(145, 60%, 45%)',
  'Bị từ chối': 'hsl(340, 70%, 55%)',
  'Hết hạn': 'hsl(30, 80%, 55%)',
};

// Custom tooltip cho biểu đồ
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover/95 backdrop-blur-xl shadow-lg p-3 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

// Stat Card component
function StatCard({ icon: Icon, label, value, color = 'primary', sub }) {
  const colorMap = {
    primary: 'from-primary/10 to-teal-500/10 text-primary',
    blue: 'from-blue-500/10 to-blue-600/10 text-blue-500',
    amber: 'from-amber-500/10 to-amber-600/10 text-amber-500',
    rose: 'from-rose-500/10 to-rose-600/10 text-rose-500',
    green: 'from-green-500/10 to-green-600/10 text-green-500',
    violet: 'from-violet-500/10 to-violet-600/10 text-violet-500',
  };

  return (
    <div className="rounded-xl border bg-card p-5 card-hover group">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value ?? '—'}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// Chart Card wrapper
function ChartCard({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`rounded-xl border bg-card p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function AdminReportsPage() {
  const [overview, setOverview] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [careerPaths, setCareerPaths] = useState([]);
  const [roadmapCompletion, setRoadmapCompletion] = useState(null);
  const [topSkills, setTopSkills] = useState([]);
  const [appStats, setAppStats] = useState(null);
  const [jobStats, setJobStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ov, reg, cp, rc, ts, apps, jobs] = await Promise.all([
        api.get('/admin/reports/overview'),
        api.get('/admin/reports/registrations'),
        api.get('/admin/reports/career-paths'),
        api.get('/admin/reports/roadmap-completion'),
        api.get('/admin/reports/top-skills'),
        api.get('/admin/reports/applications'),
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
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Thống Kê & Báo Cáo</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <div className="h-4 w-24 skeleton mb-3" />
              <div className="h-8 w-16 skeleton mb-2" />
              <div className="h-3 w-32 skeleton" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 h-72">
              <div className="h-4 w-36 skeleton mb-4" />
              <div className="h-52 skeleton rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thống Kê & Báo Cáo</h1>
          <p className="text-sm text-muted-foreground mt-1">Tổng quan dữ liệu hệ thống EduPath</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2">
          <RefreshCcw className="w-3.5 h-3.5" /> Làm mới
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Sinh viên" value={overview?.totalStudents} color="primary" />
        <StatCard icon={Briefcase} label="Nhà tuyển dụng" value={overview?.totalEmployers} color="blue" />
        <StatCard icon={FileText} label="Tin tuyển dụng" value={overview?.totalJobPostings} color="green"
          sub={overview?.pendingJobs > 0 ? `${overview.pendingJobs} chờ duyệt` : undefined} />
        <StatCard icon={GraduationCap} label="Đơn ứng tuyển" value={overview?.totalApplications} color="amber" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={RouteIcon} label="Lộ trình mẫu" value={overview?.totalRoadmaps} color="violet" />
        <StatCard icon={TrendingUp} label="Lộ trình đang học" value={overview?.activePersonalRoadmaps} color="primary" />
        <StatCard
          icon={Award} label="TB hoàn thành" color="green"
          value={roadmapCompletion ? `${roadmapCompletion.averageCompletion}%` : '—'}
          sub="Tỷ lệ hoàn thành lộ trình trung bình"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Đăng ký theo tháng */}
        <ChartCard title="Đăng ký tài khoản theo tháng" icon={Users} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={registrations}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="students" name="Sinh viên" fill="hsl(167, 75%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="employers" name="Nhà tuyển dụng" fill="hsl(217, 82%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hướng nghề phổ biến */}
        <ChartCard title="Hướng nghề nghiệp phổ biến" icon={MapPin}>
          {careerPaths.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={careerPaths} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={140} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Số sinh viên" fill="hsl(167, 75%, 45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
          )}
        </ChartCard>

        {/* Tỷ lệ hoàn thành lộ trình */}
        <ChartCard title="Trạng thái lộ trình cá nhân" icon={RouteIcon}>
          {roadmapCompletion?.distribution?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roadmapCompletion.distribution}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  dataKey="count" nameKey="label"
                  stroke="hsl(var(--background))" strokeWidth={3}
                >
                  {roadmapCompletion.distribution.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.label] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top kỹ năng */}
        <ChartCard title="Top kỹ năng được học nhiều nhất" icon={Award}>
          {topSkills.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSkills} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Lượt học" radius={[0, 4, 4, 0]}>
                  {topSkills.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
          )}
        </ChartCard>

        {/* Thống kê ứng tuyển */}
        <ChartCard title="Thống kê đơn ứng tuyển" icon={FileText}>
          {appStats?.byStatus?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appStats.byStatus}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  dataKey="count" nameKey="label"
                  stroke="hsl(var(--background))" strokeWidth={3}
                >
                  {appStats.byStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.label] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tin tuyển dụng */}
        <ChartCard title="Trạng thái tin tuyển dụng" icon={Briefcase}>
          {jobStats?.byStatus?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={jobStats.byStatus}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={95}
                  dataKey="count" nameKey="label"
                  stroke="hsl(var(--background))" strokeWidth={3}
                >
                  {jobStats.byStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.label] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
          )}
        </ChartCard>

        {/* Top công ty */}
        <ChartCard title="Top công ty đăng tin" icon={Briefcase}>
          {jobStats?.topCompanies?.length > 0 ? (
            <div className="space-y-3 pt-2">
              {jobStats.topCompanies.map((company, i) => {
                const maxCount = jobStats.topCompanies[0].count;
                const pct = maxCount > 0 ? (company.count / maxCount) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate mr-2">{company.name}</span>
                      <span className="text-muted-foreground flex-shrink-0">{company.count} tin</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
          )}
        </ChartCard>
      </div>

      {/* Ứng tuyển theo tháng */}
      {appStats?.monthly?.length > 0 && (
        <ChartCard title="Lượt ứng tuyển theo tháng" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={appStats.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="count" name="Đơn ứng tuyển"
                stroke="hsl(167, 75%, 45%)" strokeWidth={2.5}
                dot={{ fill: 'hsl(167, 75%, 45%)', r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}

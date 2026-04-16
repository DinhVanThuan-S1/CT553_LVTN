/**
 * WelcomePage - Landing Page
 * Lấy dữ liệu thật từ API: roadmaps nổi bật + công việc nổi bật + stats
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import api from '../lib/api';
import {
  GraduationCap,
  Route,
  Briefcase,
  Sparkles,
  ArrowRight,
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  MapPin,
  DollarSign,
  Users,
  ChevronRight,
  CheckCircle2,
  Zap,
  Brain,
  BarChart3,
  Calendar,
  Building2,
  Loader2,
} from 'lucide-react';

const DIFFICULTY = {
  beginner: { label: 'Cơ bản', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  intermediate: { label: 'Trung bình', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  advanced: { label: 'Nâng cao', cls: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

const CARD_GRADIENT = {
  beginner: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
  intermediate: 'from-amber-500/10 via-amber-500/5 to-transparent',
  advanced: 'from-red-500/10 via-red-500/5 to-transparent',
};

const jobTypeLabels = {
  'full-time': 'Toàn thời gian', 'part-time': 'Bán thời gian',
  internship: 'Thực tập', freelance: 'Freelance', remote: 'Remote',
};

const jobTypeColors = {
  'full-time': 'bg-blue-500/10 text-blue-600 border-blue-300/30',
  'part-time': 'bg-sky-500/10 text-sky-600 border-sky-300/30',
  internship: 'bg-violet-500/10 text-violet-600 border-violet-300/30',
  freelance: 'bg-amber-500/10 text-amber-600 border-amber-300/30',
  remote: 'bg-emerald-500/10 text-emerald-600 border-emerald-300/30',
};

const features = [
  {
    icon: GraduationCap,
    title: 'Hồ sơ Học tập Thông minh',
    description: 'Tự động phân tích điểm số, nhận diện thế mạnh và kỹ năng hiện có từ CTĐT của bạn',
    color: 'text-blue-500 bg-blue-500/10',
  },
  {
    icon: Sparkles,
    title: 'AI Gợi ý Lộ trình',
    description: 'Phân tích toàn diện: học lực + sở thích + xu hướng thị trường → lộ trình hoàn toàn cá nhân hóa',
    color: 'text-emerald-500 bg-emerald-500/10',
  },
  {
    icon: Calendar,
    title: 'Lịch học Tự động',
    description: 'AI sắp xếp buổi học theo thời gian rảnh, theo dõi tiến độ với biểu đồ trực quan',
    color: 'text-amber-500 bg-amber-500/10',
  },
  {
    icon: Briefcase,
    title: 'Kết nối Việc làm',
    description: 'Gợi ý công việc phù hợp kỹ năng, CV tích hợp thành tích từ hệ thống tăng uy tín',
    color: 'text-rose-500 bg-rose-500/10',
  },
];

const processSteps = [
  { step: '01', title: 'Nhập hồ sơ', desc: 'Chọn KHHT, nhập điểm & sở thích', icon: GraduationCap },
  { step: '02', title: 'AI phân tích', desc: 'Gợi ý lộ trình cá nhân hóa', icon: Brain },
  { step: '03', title: 'Học & thực hành', desc: 'Theo dõi tiến độ, làm bài test', icon: TrendingUp },
  { step: '04', title: 'Ứng tuyển', desc: 'CV thông minh, match công việc', icon: Briefcase },
];


export default function WelcomePage() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState([
    { value: '...', label: 'Kỹ năng CNTT', icon: Target },
    { value: '...', label: 'Lộ trình mẫu', icon: Route },
    { value: '...', label: 'Việc làm', icon: Briefcase },
    { value: 'AI', label: 'Gợi ý thông minh', icon: Sparkles },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roadmapRes, jobRes, skillRes] = await Promise.allSettled([
          api.get('/roadmaps', { params: { limit: 3, sort: '-enrollmentCount' } }),
          api.get('/jobs', { params: { limit: 4, sort: '-createdAt' } }),
          api.get('/skills/all'),
        ]);

        if (roadmapRes.status === 'fulfilled') {
          const data = roadmapRes.value.data.data || [];
          setRoadmaps(data);
          setStats(prev => prev.map(s =>
            s.label === 'Lộ trình mẫu'
              ? { ...s, value: (roadmapRes.value.data.pagination?.total || data.length) + '+' }
              : s
          ));
        }

        if (jobRes.status === 'fulfilled') {
          setJobs(jobRes.value.data.data || []);
          setStats(prev => prev.map(s =>
            s.label === 'Việc làm'
              ? { ...s, value: (jobRes.value.data.pagination?.total || 0) + '+' }
              : s
          ));
        }

        if (skillRes.status === 'fulfilled') {
          const count = (skillRes.value.data.data || []).length;
          setStats(prev => prev.map(s =>
            s.label === 'Kỹ năng CNTT'
              ? { ...s, value: count + '+' }
              : s
          ));
        }
      } catch {/* fail silently */ } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* ====== HEADER ====== */}
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shadow-lg shadow-primary/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">EduPath</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Tính năng</a>
            <a href="#roadmaps" className="hover:text-foreground transition-colors">Lộ trình</a>
            <a href="#jobs" className="hover:text-foreground transition-colors">Việc làm</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Đăng nhập</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="shadow-lg shadow-primary/20">Đăng ký</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ====== HERO ====== */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-medium mb-6 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Tích hợp AI gợi ý thông minh
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-5 leading-[1.1]">
              Cá nhân hóa{' '}
              <span className="bg-gradient-to-r from-primary via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                Lộ trình học tập
              </span>
              <br />Định hướng nghề nghiệp
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Hệ thống hỗ trợ sinh viên CNTT phân tích năng lực, gợi ý lộ trình học tập
              phù hợp & kết nối với cơ hội việc làm thực tế từ các nhà tuyển dụng.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/register">
                <Button size="lg" className="gap-2 shadow-xl shadow-primary/25 h-12 px-8">
                  Bắt đầu miễn phí <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#roadmaps">
                <Button variant="outline" size="lg" className="h-12 px-8">
                  Khám phá lộ trình
                </Button>
              </a>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-16 max-w-3xl mx-auto">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center group">
                <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/15 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== QUY TRÌNH ====== */}
      <section className="bg-muted/30 border-y">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">Quy trình 4 bước</h2>
            <p className="text-muted-foreground">Từ nhập học đến ứng tuyển – mọi thứ trong một hệ thống</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {processSteps.map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="relative group">
                <div className="bg-card border rounded-xl p-5 text-center card-hover h-full">
                  <div className="text-[10px] font-bold text-primary/40 mb-3">BƯỚC {step}</div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== TÍNH NĂNG ====== */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-2">Tính năng nổi bật</h2>
          <p className="text-muted-foreground">Mọi công cụ bạn cần cho hành trình phát triển sự nghiệp CNTT</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, description, color }) => (
            <div key={title} className="rounded-xl border bg-card p-6 card-hover group">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ====== LỘ TRÌNH NỔI BẬT ====== */}
      <section id="roadmaps" className="bg-muted/30 border-y">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold mb-2">Lộ trình nổi bật</h2>
              <p className="text-muted-foreground">Các lộ trình được đăng ký nhiều nhất, thiết kế bởi chuyên gia</p>
            </div>
            <Link
              to="/roadmaps"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
                  <div className="h-28 bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 w-20 bg-muted rounded-full" />
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-full" />
                  </div>
                </div>
              ))
            ) : roadmaps.length > 0 ? (
              roadmaps.map((roadmap) => {
                const diff = DIFFICULTY[roadmap.difficulty] || DIFFICULTY.beginner;
                const grad = CARD_GRADIENT[roadmap.difficulty] || CARD_GRADIENT.beginner;
                return (
                  <Link
                    key={roadmap._id}
                    to={`/roadmaps/${roadmap._id}`}
                    className="rounded-xl border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col"
                  >
                    {/* Thumbnail */}
                    <div className={`h-28 bg-gradient-to-br ${grad} flex items-center justify-center relative`}>
                      <Route className="w-10 h-10 text-foreground/10" />
                      <span className={`absolute bottom-3 left-3 text-[11px] font-bold px-2 py-0.5 rounded-full border ${diff.cls}`}>
                        {diff.label}
                      </span>
                    </div>
                    {/* Body */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors leading-snug">
                        {roadmap.title}
                      </h3>
                      {roadmap.careerPath && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                          <Target className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{roadmap.careerPath}</span>
                        </p>
                      )}
                      {roadmap.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed flex-1">
                          {roadmap.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {roadmap.estimatedMonths} tháng
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {roadmap.enrollmentCount || 0} SV
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border/60">
                        <span className="text-xs text-muted-foreground">{roadmap.skills?.length || 0} kỹ năng</span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          Xem chi tiết <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-3 text-center text-muted-foreground py-8">Chưa có lộ trình</div>
            )}
          </div>

          <div className="md:hidden text-center mt-6">
            <Link
              to="/roadmaps"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-full border border-primary/25 bg-primary/8 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              Xem tất cả lộ trình <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ====== CÔNG VIỆC NỔI BẬT ====== */}
      <section id="jobs" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold mb-2">Công việc nổi bật</h2>
            <p className="text-muted-foreground">Cơ hội việc làm mới nhất dành cho sinh viên CNTT</p>
          </div>
          <Link
            to="/jobs"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
          >
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-40 bg-muted rounded" />
                    <div className="h-3 w-28 bg-muted rounded" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-24 bg-muted rounded-full" />
                  <div className="h-5 w-20 bg-muted rounded-full" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 w-32 bg-muted rounded" />
                  <div className="h-3 w-36 bg-muted rounded" />
                </div>
              </div>
            ))
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <Link
                key={job._id}
                to="/jobs"
                state={{ openJobId: job._id }}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="group relative rounded-xl border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden border-l-4 border-l-primary/50 block"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                          {job.title}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{job.company?.name || ''}</p>
                      </div>
                    </div>
                  </div>
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${jobTypeColors[job.jobType] || 'bg-muted text-muted-foreground border-border'}`}>
                      {jobTypeLabels[job.jobType] || job.jobType}
                    </span>
                    {job.careerPath && (
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/15">
                        {job.careerPath}
                      </span>
                    )}
                  </div>
                  {/* Info rows */}
                  <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                      <span className="font-medium text-foreground">
                        {job.salaryRange?.isNegotiable || (!job.salaryRange?.min && !job.salaryRange?.max)
                          ? 'Thỏa thuận'
                          : `${job.salaryRange.min} - ${job.salaryRange.max} triệu`}
                      </span>
                    </div>
                    {(job.locationText || job.location) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                        <span className="truncate">{job.locationText || 'Xem chi tiết'}</span>
                      </div>
                    )}
                  </div>
                  {/* Skills */}
                  {job.requiredSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border/50">
                      {job.requiredSkills.slice(0, 4).map((rs) => (
                        <span key={rs._id} className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                          {rs.skill?.icon} {rs.skill?.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-2 text-center text-muted-foreground py-8">Chưa có công việc nào</div>
          )}
        </div>

        <div className="md:hidden text-center mt-6">
          <Link
            to="/jobs"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-full border border-primary/25 bg-primary/8 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
          >
            Xem tất cả công việc <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="border-t bg-gradient-to-br from-primary/5 via-background to-teal-500/5">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-3">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Tạo tài khoản miễn phí, nhập hồ sơ học tập và để AI giúp bạn
            tìm lộ trình phát triển sự nghiệp CNTT phù hợp nhất.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="gap-2 shadow-xl shadow-primary/20 h-12 px-8">
                Đăng ký miễn phí <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 mt-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Miễn phí hoàn toàn</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Không cần thẻ tín dụng</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Hỗ trợ AI 24/7</span>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="border-t bg-muted/20 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold">EduPath</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                Hệ thống Cá nhân hóa Lộ trình Học tập & Định hướng Nghề nghiệp cho sinh viên CNTT.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Sinh viên</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/register" className="hover:text-foreground transition-colors">Đăng ký</Link></li>
                <li><a href="#roadmaps" className="hover:text-foreground transition-colors">Lộ trình học tập</a></li>
                <li><a href="#jobs" className="hover:text-foreground transition-colors">Tìm việc làm</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Nhà tuyển dụng</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/register" className="hover:text-foreground transition-colors">Đăng ký tuyển dụng</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Đăng tin</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Tìm ứng viên</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>© 2026 EduPath - Đại học Cần Thơ - Trường CNTT & Truyền thông</p>
            <p>Luận văn tốt nghiệp - Ngành Kỹ thuật phần mềm K48</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

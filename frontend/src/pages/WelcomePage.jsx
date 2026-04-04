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

// Màu gradient cho lộ trình theo index
const ROAD_COLORS = [
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
];

const difficultyLabels = { beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' };

const jobTypeLabels = {
  'full-time': 'Full-time', 'part-time': 'Part-time',
  internship: 'Thực tập', freelance: 'Freelance', remote: 'Remote',
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
      } catch {/* fail silently */} finally {
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
            <Link to="/roadmaps" className="hidden md:flex items-center gap-1 text-sm text-primary hover:underline font-medium">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {loading ? (
              // Skeleton cards
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
                  <div className="h-2 bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="flex gap-2">
                      {Array.from({ length: 3 }).map((_, j) => <div key={j} className="h-5 bg-muted rounded w-16" />)}
                    </div>
                  </div>
                </div>
              ))
            ) : roadmaps.length > 0 ? (
              roadmaps.map((roadmap, idx) => (
                <Link key={roadmap._id} to={`/roadmaps/${roadmap._id}`}
                  className="rounded-xl border bg-card overflow-hidden card-hover group block">
                  <div className={`h-2 bg-gradient-to-r ${ROAD_COLORS[idx % ROAD_COLORS.length]}`} />
                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                      {roadmap.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{roadmap.description}</p>
                    {/* Skills tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(roadmap.skills || []).slice(0, 5).map((s) => (
                        <span key={s._id || s.skill?._id}
                          className="px-2 py-0.5 rounded-md bg-primary/8 text-primary text-xs font-medium">
                          {s.skill?.icon} {s.skill?.name || s.name}
                        </span>
                      ))}
                    </div>
                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {roadmap.estimatedMonths} tháng
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {roadmap.enrollmentCount || 0} SV
                        </span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted">
                        {difficultyLabels[roadmap.difficulty] || roadmap.difficulty}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center text-muted-foreground py-8">Chưa có lộ trình</div>
            )}
          </div>

          <div className="md:hidden text-center mt-6">
            <Link to="/roadmaps">
              <Button variant="outline" size="sm" className="gap-1">
                Xem tất cả lộ trình <ChevronRight className="w-4 h-4" />
              </Button>
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
          <Link to="/jobs" className="hidden md:flex items-center gap-1 text-sm text-primary hover:underline font-medium">
            Xem tất cả <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 animate-pulse space-y-3">
                <div className="h-5 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="flex gap-3">
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-4 bg-muted rounded w-24" />
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((_, j) => <div key={j} className="h-5 bg-muted rounded w-16" />)}
                </div>
              </div>
            ))
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <Link key={job._id} to={`/jobs`}
                className="rounded-xl border bg-card p-5 card-hover group block">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{job.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {job.company?.name || 'Ẩn tên công ty'}
                    </p>
                  </div>
                  <span className="flex-shrink-0 px-2 py-0.5 rounded-md bg-muted text-[11px]">
                    {jobTypeLabels[job.jobType] || job.jobType}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                  {(job.locationText || job.location) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.locationText || 'Xem chi tiết'}
                    </span>
                  )}
                  {job.salaryRange?.min > 0 && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {job.salaryRange.min}{job.salaryRange.isNegotiable ? '+ triệu' : ` - ${job.salaryRange.max} triệu`}
                    </span>
                  )}
                  {job.salaryRange?.isNegotiable && !job.salaryRange?.min && (
                    <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Thỏa thuận</span>
                  )}
                </div>
                {job.requiredSkills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills.slice(0, 4).map((rs) => (
                      <span key={rs._id} className="px-2 py-0.5 rounded-md bg-muted text-xs">
                        {rs.skill?.icon} {rs.skill?.name}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))
          ) : (
            <div className="col-span-2 text-center text-muted-foreground py-8">Chưa có công việc nào</div>
          )}
        </div>

        <div className="md:hidden text-center mt-6">
          <Link to="/jobs">
            <Button variant="outline" size="sm" className="gap-1">
              Xem tất cả công việc <ChevronRight className="w-4 h-4" />
            </Button>
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

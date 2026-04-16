/**
 * JobListPage - Danh sách công việc
 * Browse jobs, search, filter, apply
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import SmartJobModal from '../../components/student/SmartJobModal';
import {
  Search, Briefcase, MapPin, DollarSign, Eye, Heart,
  ChevronLeft, ChevronRight, Building2, Send, FileText,
  Loader2, Sparkles, CalendarDays, Users, CheckCircle2, ChevronDown,
} from 'lucide-react';


const jobTypeLabels = {
  'full-time': 'Toàn thời gian', 'part-time': 'Bán thời gian',
  'internship': 'Thực tập', 'freelance': 'Freelance', 'remote': 'Remote',
};

const jobTypeColors = {
  'full-time': 'bg-blue-500/10 text-blue-600 border-blue-300/30',
  'part-time': 'bg-sky-500/10 text-sky-600 border-sky-300/30',
  'internship': 'bg-violet-500/10 text-violet-600 border-violet-300/30',
  'freelance': 'bg-amber-500/10 text-amber-600 border-amber-300/30',
  'remote': 'bg-emerald-500/10 text-emerald-600 border-emerald-300/30',
};

export default function JobListPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState('');
  const [careerPath, setCareerPath] = useState('');
  const [careerPaths, setCareerPaths] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [favorites, setFavorites] = useState({});
  const [showSmart, setShowSmart] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showCareerMenu, setShowCareerMenu] = useState(false);
  const typeRef = useRef(null);
  const careerMenuRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (typeRef.current && !typeRef.current.contains(e.target)) setShowTypeMenu(false);
      if (careerMenuRef.current && !careerMenuRef.current.contains(e.target)) setShowCareerMenu(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);


  // Apply flow
  const [showApply, setShowApply] = useState(false);
  const [cvs, setCvs] = useState([]);
  const [selectedCvId, setSelectedCvId] = useState('');
  const [applying, setApplying] = useState(false);
  const [cvsLoading, setCvsLoading] = useState(false);

  // Load distinct careerPaths once
  useEffect(() => {
    api.get('/jobs', { params: { limit: 100 } })
      .then(({ data }) => {
        const paths = [...new Set((data.data || []).map(j => j.careerPath).filter(Boolean))].sort();
        setCareerPaths(paths);
      })
      .catch(() => { });
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 12 };
      if (search) params.search = search;
      if (jobType) params.jobType = jobType;
      if (careerPath) params.careerPath = careerPath;
      const { data } = await api.get('/jobs', { params });
      setJobs(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Không thể tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, jobType, careerPath]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/student/favorites', { params: { type: 'job' } })
      .then(({ data }) => {
        const map = {};
        (data.data || []).forEach(f => {
          if (f.jobPosting?._id) map[f.jobPosting._id] = true;
        });
        setFavorites(map);
      })
      .catch(() => { });
  }, [isAuthenticated]);

  async function viewDetail(job) {
    try {
      const { data } = await api.get(`/jobs/${job._id}`);
      setSelectedJob(data.data);
      setShowDetail(true);
    } catch {
      toast.error('Không thể tải chi tiết');
    }
  }

  async function toggleFavorite(jobId) {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    try {
      const { data } = await api.post('/student/favorites/toggle', {
        type: 'job', itemId: jobId,
      });
      setFavorites(prev => ({ ...prev, [jobId]: data.added }));
      toast.success(data.message);
    } catch {
      toast.error('Có lỗi');
    }
  }

  async function openApplyDialog() {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setCvsLoading(true);
    setShowApply(true);
    try {
      const { data } = await api.get('/student/cvs');
      setCvs(data.data || []);
      const defaultCv = (data.data || []).find(c => c.isDefault);
      setSelectedCvId(defaultCv?._id || (data.data?.[0]?._id || ''));
    } catch {
      toast.error('Không thể tải CV');
      setShowApply(false);
    } finally {
      setCvsLoading(false);
    }
  }

  async function handleApply() {
    if (!selectedCvId) { toast.error('Vui lòng chọn CV'); return; }
    setApplying(true);
    try {
      await api.post('/student/applications', {
        jobPostingId: selectedJob._id,
        cvId: selectedCvId,
      });
      toast.success('Ứng tuyển thành công!');
      setShowApply(false);
      setShowDetail(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi khi ứng tuyển');
    } finally {
      setApplying(false);
    }
  }

  function formatSalary(range) {
    if (!range || (!range.min && !range.max)) return 'Thỏa thuận';
    if (range.isNegotiable) return 'Thỏa thuận';
    return `${range.min} - ${range.max} triệu`;
  }

  const isDeadlineSoon = (deadline) => {
    if (!deadline) return false;
    const days = (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);
    return days <= 7 && days >= 0;
  };

  return (
    <div className="animate-fade-in space-y-5">
      <SmartJobModal isOpen={showSmart} onClose={() => setShowSmart(false)} />

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-500/10 via-primary/5 to-transparent p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-sky-500/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/8 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Danh sách công việc</span>
            </div>
            {/* <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Danh Sách Công Việc</h1> */}
            <p className="text-muted-foreground text-sm mt-1.5">
              {pagination.total} công việc đang tuyển dụng
            </p>
          </div>
          <Button
            className="gap-2 shadow-md"
            onClick={() => {
              if (!isAuthenticated) { navigate(`/login?next=${encodeURIComponent(location.pathname)}`); return; }
              setShowSmart(true);
            }}
          >
            <Sparkles className="w-4 h-4" /> Gợi ý việc làm
          </Button>
        </div>
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm công việc, hướng nghề nghiệp..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="pl-9"
          />
        </div>
        {/* Job type custom dropdown */}
        <div className="relative shrink-0" ref={typeRef}>
          <button
            onClick={() => { setShowTypeMenu(v => !v); setShowCareerMenu(false); }}
            className={`h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all w-40 ${showTypeMenu || jobType
                ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1'
                : 'border-input bg-background text-foreground hover:border-primary/60'
              }`}
          >
            <span className="flex-1 text-left truncate">
              {jobType ? jobTypeLabels[jobType] : 'Tất cả loại'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${showTypeMenu ? 'rotate-180 text-primary' : 'text-muted-foreground'
              }`} />
          </button>
          {showTypeMenu && (
            <div className="absolute left-0 top-full mt-1.5 z-30 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden w-44 animate-fade-in">
              <div className="py-1.5">
                {[{ value: '', label: 'Tất cả loại' }, ...Object.entries(jobTypeLabels).map(([k, v]) => ({ value: k, label: v }))]
                  .map(({ value, label }) => (
                    <button key={value}
                      onClick={() => { setJobType(value); setPagination(p => ({ ...p, page: 1 })); setShowTypeMenu(false); }}
                      className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${jobType === value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted/50'
                        }`}
                    >
                      {jobType === value && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      <span className={jobType === value ? '' : 'ml-3.5'}>{label}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
        {/* Career path custom dropdown */}
        {careerPaths.length > 0 && (
          <div className="relative shrink-0" ref={careerMenuRef}>
            <button
              onClick={() => { setShowCareerMenu(v => !v); setShowTypeMenu(false); }}
              className={`h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all w-48 ${showCareerMenu || careerPath
                  ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1'
                  : 'border-input bg-background text-foreground hover:border-primary/60'
                }`}
            >
              <span className="flex-1 text-left truncate">
                {careerPath || 'Tất cả hướng nghề'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${showCareerMenu ? 'rotate-180 text-primary' : 'text-muted-foreground'
                }`} />
            </button>
            {showCareerMenu && (
              <div className="absolute right-0 top-full mt-1.5 z-30 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden w-52 animate-fade-in">
                <div className="py-1.5 max-h-64 overflow-y-auto">
                  {[{ value: '', label: 'Tất cả hướng nghề' }, ...careerPaths.map(cp => ({ value: cp, label: cp }))]
                    .map(({ value, label }) => (
                      <button key={value}
                        onClick={() => { setCareerPath(value); setPagination(p => ({ ...p, page: 1 })); setShowCareerMenu(false); }}
                        className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${careerPath === value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted/50'
                          }`}
                      >
                        {careerPath === value && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                        <span className={careerPath === value ? '' : 'ml-3.5'}>{label}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Job Cards ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 skeleton rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-40 skeleton" />
                  <div className="h-3 w-28 skeleton" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-24 skeleton rounded-full" />
                <div className="h-5 w-20 skeleton rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-32 skeleton" />
                <div className="h-3 w-36 skeleton" />
              </div>
              <div className="h-8 skeleton rounded-lg" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <p className="font-medium text-muted-foreground">Không tìm thấy công việc</p>
          <p className="text-xs text-muted-foreground mt-1">Thử thay đổi từ khóa hoặc bộ lọc</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map(job => {
            const isFav = favorites[job._id];
            const soon = isDeadlineSoon(job.deadline);
            return (
              <div key={job._id} className="group relative rounded-xl border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden border-l-4 border-l-primary/50">

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
                    <button
                      onClick={() => toggleFavorite(job._id)}
                      className={`p-1.5 rounded-lg transition-all shrink-0 ${isFav ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'}`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${jobTypeColors[job.jobType] || 'bg-muted text-muted-foreground'}`}>
                      {jobTypeLabels[job.jobType] || job.jobType}
                    </span>
                    {job.careerPath && (
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/15">
                        {job.careerPath}
                      </span>
                    )}
                    {soon && (
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-300/30">
                        Sắp hết hạn
                      </span>
                    )}
                  </div>

                  {/* Info rows */}
                  <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                      <span className="font-medium text-foreground">{formatSalary(job.salaryRange)}</span>
                    </div>
                    {job.locationText && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                        <span className="truncate">{job.locationText}</span>
                      </div>
                    )}
                    {job.deadline && (
                      <div className="flex items-center gap-2">
                        <CalendarDays className={`w-3.5 h-3.5 shrink-0 ${soon ? 'text-red-500' : ''}`} />
                        <span className={soon ? 'text-red-500 font-medium' : ''}>
                          Hạn: {new Date(job.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => viewDetail(job)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border
                      text-sm font-medium transition-all
                      hover:bg-primary hover:text-primary-foreground hover:border-primary group-hover:border-primary/40"
                  >
                    <Eye className="w-4 h-4" /> Xem chi tiết
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={pagination.page <= 1}
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            className="w-8 h-8 rounded-lg flex items-center justify-center border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium tabular-nums">
            {pagination.page} / {pagination.pages}
          </span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            className="w-8 h-8 rounded-lg flex items-center justify-center border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Job Detail Dialog ── */}
      <Dialog open={showDetail} onClose={() => setShowDetail(false)} className="max-w-2xl">
        <DialogHeader onClose={() => setShowDetail(false)}>Chi tiết Công việc</DialogHeader>
        {selectedJob && (
          <DialogBody className="p-0 max-h-[75vh] overflow-y-auto">
            {/* Hero banner */}
            <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5 border-b">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-white dark:bg-card border shadow-sm flex items-center justify-center shrink-0">
                  <Building2 className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold leading-snug">{selectedJob.title}</h3>
                  <p className="text-muted-foreground text-sm mt-0.5">{selectedJob.company?.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${jobTypeColors[selectedJob.jobType] || 'bg-muted'}`}>
                      {jobTypeLabels[selectedJob.jobType] || selectedJob.jobType}
                    </span>
                    {selectedJob.careerPath && (
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {selectedJob.careerPath}
                      </span>
                    )}
                    {selectedJob.experienceYears > 0 && (
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-muted border">
                        {selectedJob.experienceYears} năm KN
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Key info grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border bg-emerald-500/5 p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-emerald-600/80 uppercase tracking-wide">Mức lương</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatSalary(selectedJob.salaryRange)}</p>
                  </div>
                </div>
                {selectedJob.locationText && (
                  <div className="rounded-xl border bg-blue-500/5 p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-blue-600/80 uppercase tracking-wide">Địa điểm</p>
                      <p className="text-sm font-semibold truncate">{selectedJob.locationText}</p>
                    </div>
                  </div>
                )}
                {selectedJob.deadline && (
                  <div className="rounded-xl border bg-amber-500/5 p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-amber-600/80 uppercase tracking-wide">Hạn nộp</p>
                      <p className="text-sm font-semibold">{new Date(selectedJob.deadline).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                )}
                {selectedJob.vacancies > 0 && (
                  <div className="rounded-xl border bg-violet-500/5 p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-violet-600/80 uppercase tracking-wide">Số vị trí</p>
                      <p className="text-sm font-semibold">{selectedJob.vacancies} vị trí</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Text sections */}
              {[{ label: 'Mô tả công việc', value: selectedJob.description },
              { label: 'Yêu cầu', value: selectedJob.requirements },
              { label: 'Quyền lợi', value: selectedJob.benefits }
              ].filter(s => s.value).map(s => (
                <div key={s.label}>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-primary inline-block" />
                    {s.label}
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed pl-3">{s.value}</p>
                </div>
              ))}

              {selectedJob.requiredSkills?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-primary inline-block" />
                    Kỹ năng yêu cầu
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pl-3">
                    {selectedJob.requiredSkills.map((rs, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/8 text-primary border border-primary/15">
                        <CheckCircle2 className="w-3 h-3" />
                        {rs.skill?.icon} {rs.skill?.name}
                        {rs.level && <span className="text-muted-foreground capitalize">· {rs.level}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.company && (
                <div className="rounded-xl border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-sm">Về công ty</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedJob.company.industry && `Ngành: ${selectedJob.company.industry}`}
                    {selectedJob.company.size && ` • Quy mô: ${selectedJob.company.size} NV`}
                  </p>
                  {selectedJob.company.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">{selectedJob.company.description}</p>
                  )}
                </div>
              )}
            </div>
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
          <Button size="sm" className="gap-2" onClick={openApplyDialog}>
            <Send className="w-4 h-4" /> Ứng tuyển
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ── Apply Dialog ── */}
      <Dialog open={showApply} onClose={() => setShowApply(false)} className="max-w-md">
        <DialogHeader onClose={() => setShowApply(false)}>
          Ứng tuyển: {selectedJob?.title}
        </DialogHeader>
        <DialogBody className="space-y-4">
          {cvsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : cvs.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Bạn chưa có CV nào</p>
              <p className="text-xs text-muted-foreground">Truy cập mục <strong>CV</strong> để tạo CV trước khi ứng tuyển</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Chọn CV để gửi kèm đơn ứng tuyển:</p>
              <div className="space-y-2">
                {cvs.map(cv => (
                  <label key={cv._id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedCvId === cv._id
                      ? 'border-primary bg-primary/[0.04] shadow-sm'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'}`}>
                    <input type="radio" name="cv" value={cv._id}
                      checked={selectedCvId === cv._id}
                      onChange={() => setSelectedCvId(cv._id)}
                      className="accent-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium text-sm truncate">{cv.title}</span>
                        {cv.isDefault && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0">Mặc định</span>
                        )}
                      </div>
                      {cv.headline && <p className="text-xs text-muted-foreground mt-0.5 truncate">{cv.headline}</p>}
                      <p className="text-xs text-muted-foreground">{(cv.skills || []).length} kỹ năng • {(cv.experiences || []).length} kinh nghiệm</p>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setShowApply(false)}>Hủy</Button>
          {cvs.length > 0 && (
            <Button size="sm" disabled={applying || !selectedCvId} className="gap-1.5" onClick={handleApply}>
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {applying ? 'Đang gửi...' : 'Gửi đơn ứng tuyển'}
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    </div>
  );
}

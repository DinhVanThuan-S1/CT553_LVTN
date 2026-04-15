/**
 * EmployerJobPostingsPage - Quản lý tin tuyển dụng
 * CRUD tin + gửi duyệt + xem chi tiết + bộ lọc trạng thái
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  Briefcase, Plus, Pencil, Eye, Loader2, Clock,
  CheckCircle2, XCircle, Send, Calendar, MapPin,
  DollarSign, Users, TrendingUp, ChevronRight,
  FileText, ArrowLeft, AlertTriangle, Filter, ChevronDown,
} from 'lucide-react';

// ─── Config ─────────────────────────────────────
const STATUS_CONFIG = {
  draft: { label: 'Nháp', cls: 'bg-muted text-muted-foreground border-border/40', dot: 'bg-muted-foreground/40' },
  pending: { label: 'Chờ duyệt', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20', dot: 'bg-amber-500' },
  approved: { label: 'Đã duyệt', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', dot: 'bg-emerald-500' },
  rejected: { label: 'Từ chối', cls: 'bg-red-500/10 text-red-600 border-red-500/20', dot: 'bg-red-500' },
  closed: { label: 'Đã đóng', cls: 'bg-muted text-muted-foreground border-border/40', dot: 'bg-muted-foreground/40' },
};

const JOB_TYPE_LABELS = {
  'full-time': 'Toàn thời gian', 'part-time': 'Bán thời gian',
  internship: 'Thực tập', freelance: 'Freelance', remote: 'Remote',
};

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'draft', label: 'Nháp' },
  { key: 'rejected', label: 'Từ chối' },
];

const emptyForm = {
  title: '', description: '', requirements: '', benefits: '',
  careerPath: '', jobType: 'full-time', locationText: '',
  vacancies: 1, experienceYears: 0,
  salaryRange: { min: 0, max: 0, isNegotiable: false },
  requiredSkills: [], deadline: '',
};

// Chỉ nháp / từ chối mới sửa được
const EDITABLE_STATUSES = ['draft', 'rejected'];

// ─── Field label ─────────────────────────────────
function FieldLabel({ children, required }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

// ─── Status badge ────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      {status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'pending' && <Clock className="w-3 h-3" />}
      {status === 'rejected' && <XCircle className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
}

// ─── Section divider inside dialog ───────────────
function FormSection({ icon: Icon, title, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pt-2 border-t border-border/40 first:border-0 first:pt-0">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wide">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Custom dropdown (SkillMap style) ────────────────
function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all ${
          open
            ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1'
            : 'border-input bg-background text-foreground hover:border-primary/60'
        }`}
      >
        <span className="flex-1 text-left truncate">{selected?.label ?? value}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
          open ? 'rotate-180 text-primary' : 'text-muted-foreground'
        }`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-30 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden w-full animate-fade-in">
          <div className="py-1.5">
            {options.map(({ value: v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => { onChange(v); setOpen(false); }}
                className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${
                  value === v
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground hover:bg-muted/50'
                }`}
              >
                {value === v && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                <span className={value === v ? '' : 'ml-3.5'}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmployerJobPostingsPage() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [detailJob, setDetailJob] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [allSkills, setAllSkills] = useState([]);
  const [company, setCompany] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [jobRes, skillRes, compRes] = await Promise.all([
        api.get('/employer/job-postings'),
        api.get('/skills/all'),
        api.get('/employer/company'),
      ]);
      setJobs(jobRes.data.data || []);
      setAllSkills(skillRes.data.data || []);
      setCompany(compRes.data.data);
    } catch {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredJobs = useMemo(() => {
    if (filterStatus === 'all') return jobs;
    return jobs.filter(j => j.status === filterStatus);
  }, [jobs, filterStatus]);

  const statusCounts = useMemo(() => {
    const counts = { all: jobs.length };
    jobs.forEach(j => { counts[j.status] = (counts[j.status] || 0) + 1; });
    return counts;
  }, [jobs]);

  function openCreate() {
    if (!company) { toast.error('Vui lòng thiết lập hồ sơ công ty trước'); return; }
    setEditId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  }

  function openEdit(job) {
    if (!EDITABLE_STATUSES.includes(job.status)) {
      toast.error('Chỉ sửa được tin nháp hoặc bị từ chối');
      return;
    }
    setEditId(job._id);
    setForm({
      title: job.title || '',
      description: job.description || '',
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      careerPath: job.careerPath || '',
      jobType: job.jobType || 'full-time',
      locationText: job.locationText || '',
      vacancies: job.vacancies || 1,
      experienceYears: job.experienceYears || 0,
      salaryRange: job.salaryRange || { min: 0, max: 0, isNegotiable: false },
      requiredSkills: (job.requiredSkills || []).map((rs) => ({
        skill: rs.skill?._id || rs.skill, level: rs.level || 'intermediate',
      })),
      deadline: job.deadline ? job.deadline.split('T')[0] : '',
    });
    setDetailJob(null);
    setShowForm(true);
  }

  function toggleSkill(skillId) {
    setForm((f) => {
      const exists = f.requiredSkills.findIndex((rs) => rs.skill === skillId);
      if (exists >= 0) return { ...f, requiredSkills: f.requiredSkills.filter((_, i) => i !== exists) };
      return { ...f, requiredSkills: [...f.requiredSkills, { skill: skillId, level: 'intermediate' }] };
    });
  }

  async function handleSave(e, submitForReview = false) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Tiêu đề không được trống'); return; }
    if (!form.description.trim()) { toast.error('Mô tả không được trống'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        company: company._id,
        status: submitForReview ? 'pending' : 'draft',
        deadline: form.deadline || undefined,
      };
      if (editId) {
        await api.put(`/employer/job-postings/${editId}`, payload);
        toast.success(submitForReview ? 'Đã gửi duyệt lại' : 'Đã cập nhật tin');
      } else {
        await api.post('/employer/job-postings', payload);
        toast.success(submitForReview ? 'Đã gửi tin chờ duyệt' : 'Đã lưu nháp');
      }
      setShowForm(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi');
    } finally {
      setSaving(false);
    }
  }

  // ── Loading skeleton ──────────────────────────
  if (loading) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="h-28 skeleton rounded-2xl" />
        <div className="flex gap-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 w-20 skeleton rounded-lg" />)}</div>
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
      </div>
    );
  }

  // ══════════════════════════════════════════════
  //  DETAIL VIEW
  // ══════════════════════════════════════════════
  if (detailJob) {
    const skills = detailJob.requiredSkills || [];
    const canEdit = EDITABLE_STATUSES.includes(detailJob.status);

    return (
      <div className="animate-fade-in space-y-5">
        {/* Back + actions */}
        <div className="flex items-center gap-3">
          <button onClick={() => setDetailJob(null)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          {canEdit && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEdit(detailJob)}>
              <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
            </Button>
          )}
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-teal-500/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">Chi tiết tin tuyển dụng</span>
                </div>
                <h1 className="text-xl font-bold">{detailJob.title}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{company?.name}</p>
              </div>
              <StatusBadge status={detailJob.status} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {JOB_TYPE_LABELS[detailJob.jobType]}</span>
              {detailJob.locationText && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {detailJob.locationText}</span>}
              {detailJob.experienceYears > 0 && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {detailJob.experienceYears} năm KN</span>}
              {detailJob.vacancies > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {detailJob.vacancies} vị trí</span>}
              {detailJob.deadline && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> HN: {new Date(detailJob.deadline).toLocaleDateString('vi-VN')}</span>}
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {detailJob.viewCount || 0} lượt xem</span>
            </div>
          </div>
        </div>

        {/* Rejection reason banner */}
        {detailJob.status === 'rejected' && detailJob.rejectionReason && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700">Lý do từ chối</p>
              <p className="text-sm text-red-600 mt-0.5 whitespace-pre-wrap">{detailJob.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoCard icon={DollarSign} iconCls="bg-emerald-500/10 text-emerald-600" label="Mức lương"
            value={detailJob.salaryRange?.isNegotiable ? 'Thỏa thuận' : detailJob.salaryRange?.max > 0 ? `${detailJob.salaryRange.min}–${detailJob.salaryRange.max} triệu` : '—'} />
          <InfoCard icon={Eye} iconCls="bg-primary/10 text-primary" label="Lượt xem"
            value={detailJob.viewCount || 0} />
          <InfoCard icon={Calendar} iconCls="bg-amber-500/10 text-amber-600" label="Ngày đăng"
            value={new Date(detailJob.createdAt).toLocaleDateString('vi-VN')} />
        </div>

        {/* Content sections - each with distinct color */}
        {[
          {
            label: 'Mô tả công việc',
            content: detailJob.description,
            iconCls: 'bg-primary/10 text-primary',
            borderCls: 'border-l-4 border-l-primary/40',
            headBg: 'bg-primary/5',
          },
          {
            label: 'Yêu cầu ứng viên',
            content: detailJob.requirements,
            iconCls: 'bg-amber-500/10 text-amber-600',
            borderCls: 'border-l-4 border-l-amber-400/50',
            headBg: 'bg-amber-500/5',
          },
          {
            label: 'Quyền lợi',
            content: detailJob.benefits,
            iconCls: 'bg-emerald-500/10 text-emerald-600',
            borderCls: 'border-l-4 border-l-emerald-400/50',
            headBg: 'bg-emerald-500/5',
          },
        ].filter(s => s.content).map(({ label, content, iconCls, borderCls, headBg }) => (
          <div key={label} className={`rounded-2xl border bg-card overflow-hidden ${borderCls}`}>
            <div className={`px-5 py-3 border-b ${headBg} flex items-center gap-2`}>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center ${iconCls}`}>
                <FileText className="w-3 h-3" />
              </div>
              <h3 className="text-sm font-semibold">{label}</h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{content}</p>
            </div>
          </div>
        ))}

        {/* Skills - indigo accent */}
        {skills.length > 0 && (
          <div className="rounded-2xl border bg-card overflow-hidden border-l-4 border-l-indigo-400/50">
            <div className="px-5 py-3 border-b bg-indigo-500/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3" />
                </div>
                <h3 className="text-sm font-semibold">Kỹ năng yêu cầu</h3>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600">{skills.length} kỹ năng</span>
            </div>
            <div className="px-5 py-4 flex flex-wrap gap-2">
              {skills.map((rs) => {
                const skillObj = (typeof rs.skill === 'object' && rs.skill)
                  ? rs.skill
                  : allSkills.find(s => s._id === rs.skill);
                if (!skillObj) return null;
                return (
                  <span key={rs._id || skillObj._id}
                    className="px-3 py-1.5 rounded-full bg-indigo-500/8 text-indigo-700 dark:text-indigo-400 text-xs font-medium border border-indigo-500/20">
                    {skillObj.icon} {skillObj.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════
  //  LIST VIEW
  // ══════════════════════════════════════════════
  return (
    <div className="animate-fade-in space-y-5">

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-teal-500/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Quản lý Tin Tuyển Dụng</span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{jobs.length} tin đang quản lý</p>
          </div>
          <Button onClick={openCreate} className="gap-2 shadow-md">
            <Plus className="w-4 h-4" /> Đăng tin mới
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {FILTER_TABS.map(({ key, label }) => {
          const count = statusCounts[key] || 0;
          const active = filterStatus === key;
          return (
            <button key={key} onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}>
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                active ? 'bg-white/20' : 'bg-background/80'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Job list */}
      {filteredJobs.length === 0 ? (
        <div className="rounded-2xl border bg-card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            {filterStatus !== 'all'
              ? <Filter className="w-8 h-8 text-muted-foreground/30" />
              : <Briefcase className="w-8 h-8 text-muted-foreground/30" />
            }
          </div>
          <h3 className="font-semibold text-lg mb-1">
            {filterStatus !== 'all' ? `Không có tin ${STATUS_CONFIG[filterStatus]?.label || ''}` : 'Chưa có tin tuyển dụng'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {filterStatus !== 'all' ? 'Thử chọn trạng thái khác' : 'Đăng tin đầu tiên để bắt đầu tuyển dụng'}
          </p>
          {filterStatus === 'all' && (
            <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Đăng tin ngay</Button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="divide-y divide-border/40">
            {filteredJobs.map((job) => {
              const st = STATUS_CONFIG[job.status] || STATUS_CONFIG.draft;
              const canEdit = EDITABLE_STATUSES.includes(job.status);
              return (
                <div key={job._id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors group cursor-pointer"
                  onClick={() => setDetailJob(job)}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm group-hover:text-primary transition-colors">{job.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span>{JOB_TYPE_LABELS[job.jobType] || job.jobType}</span>
                      {job.locationText && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {job.locationText}</span>}
                      <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {job.viewCount || 0}</span>
                      <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {new Date(job.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  {/* Salary */}
                  <div className="text-right shrink-0">
                    {job.salaryRange?.isNegotiable ? (
                      <p className="text-xs text-muted-foreground font-medium">Thỏa thuận</p>
                    ) : job.salaryRange?.max > 0 ? (
                      <p className="text-sm font-semibold text-emerald-600">{job.salaryRange.min}–{job.salaryRange.max}M</p>
                    ) : null}
                  </div>

                  <StatusBadge status={job.status} />

                  {canEdit ? (
                    <button onClick={(e) => { e.stopPropagation(); openEdit(job); }}
                      className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors shrink-0">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          FORM DIALOG
      ══════════════════════════════════════════ */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} className="max-w-3xl">
        <DialogHeader onClose={() => setShowForm(false)}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold">{editId ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng mới'}</div>
              <div className="text-xs text-muted-foreground font-normal">Điền đầy đủ thông tin để gửi duyệt</div>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-5 max-h-[68vh] overflow-y-auto">

          {/* Section: Thông tin chung */}
          <FormSection icon={Briefcase} title="Thông tin chung">
            <div>
              <FieldLabel required>Tiêu đề công việc</FieldLabel>
              <Input value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="VD: Frontend Developer (React)" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Loại hình</FieldLabel>
                <CustomSelect
                  value={form.jobType}
                  onChange={(v) => setForm((f) => ({ ...f, jobType: v }))}
                  options={Object.entries(JOB_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                />
              </div>
              <div>
                <FieldLabel>Hướng nghề nghiệp</FieldLabel>
                <Input value={form.careerPath}
                  onChange={(e) => setForm((f) => ({ ...f, careerPath: e.target.value }))}
                  placeholder="VD: Frontend Developer" />
              </div>
            </div>
          </FormSection>

          {/* Section: Vị trí & yêu cầu */}
          <FormSection icon={MapPin} title="Vị trí & yêu cầu">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Địa điểm</FieldLabel>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                  <Input className="pl-8" value={form.locationText}
                    onChange={(e) => setForm((f) => ({ ...f, locationText: e.target.value }))}
                    placeholder="VD: TP.HCM" />
                </div>
              </div>
              <div>
                <FieldLabel>Hạn nộp hồ sơ</FieldLabel>
                <Input type="date" value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Số lượng tuyển</FieldLabel>
                <Input type="number" min={1} value={form.vacancies}
                  onChange={(e) => setForm((f) => ({ ...f, vacancies: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <FieldLabel>Kinh nghiệm (năm)</FieldLabel>
                <Input type="number" min={0} value={form.experienceYears}
                  onChange={(e) => setForm((f) => ({ ...f, experienceYears: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
          </FormSection>

          {/* Section: Lương */}
          <FormSection icon={DollarSign} title="Mức lương">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <FieldLabel>Từ (triệu VNĐ)</FieldLabel>
                <Input type="number" placeholder="0" value={form.salaryRange.min}
                  onChange={(e) => setForm((f) => ({ ...f, salaryRange: { ...f.salaryRange, min: parseFloat(e.target.value) || 0 } }))} />
              </div>
              <span className="text-muted-foreground text-sm shrink-0 mt-5">—</span>
              <div className="flex-1">
                <FieldLabel>Đến (triệu VNĐ)</FieldLabel>
                <Input type="number" placeholder="0" value={form.salaryRange.max}
                  onChange={(e) => setForm((f) => ({ ...f, salaryRange: { ...f.salaryRange, max: parseFloat(e.target.value) || 0 } }))} />
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, salaryRange: { ...f.salaryRange, isNegotiable: !f.salaryRange.isNegotiable } }))}
                className={`mt-5 shrink-0 h-9 flex items-center gap-2 px-3.5 rounded-lg border text-xs font-semibold transition-all ${
                  form.salaryRange.isNegotiable
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background border-input text-muted-foreground hover:border-primary/60 hover:text-foreground'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  form.salaryRange.isNegotiable
                    ? 'border-white bg-white/30'
                    : 'border-muted-foreground/40'
                }`}>
                  {form.salaryRange.isNegotiable && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                Thỏa thuận
              </button>
            </div>
          </FormSection>

          {/* Section: Mô tả chi tiết */}
          <FormSection icon={FileText} title="Mô tả chi tiết">
            {[
              { key: 'description', label: 'Mô tả công việc', placeholder: 'Trách nhiệm, công việc hàng ngày...', required: true, rows: 4 },
              { key: 'requirements', label: 'Yêu cầu ứng viên', placeholder: 'Kinh nghiệm, học vấn, kỹ năng mềm...', rows: 3 },
              { key: 'benefits', label: 'Quyền lợi', placeholder: 'Lương, thưởng, bảo hiểm, du lịch...', rows: 3 },
            ].map(({ key, label, placeholder, required, rows }) => (
              <div key={key}>
                <FieldLabel required={required}>{label}</FieldLabel>
                <Textarea value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  rows={rows} placeholder={placeholder} className="resize-none" />
              </div>
            ))}
          </FormSection>

          {/* Section: Kỹ năng */}
          <FormSection icon={TrendingUp} title={`Kỹ năng yêu cầu (${form.requiredSkills.length} đã chọn)`}>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-3 rounded-xl border bg-muted/10">
              {allSkills.map((skill) => {
                const selected = form.requiredSkills.some((rs) => rs.skill === skill._id);
                return (
                  <button key={skill._id} type="button" onClick={() => toggleSkill(skill._id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                      selected
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}>
                    {skill.icon} {skill.name}
                  </button>
                );
              })}
            </div>
          </FormSection>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Hủy</Button>
          <Button type="button" variant="outline" size="sm" disabled={saving} className="gap-1.5"
            onClick={(e) => handleSave(e, false)}>
            <FileText className="w-3.5 h-3.5" /> Lưu nháp
          </Button>
          <Button type="button" size="sm" disabled={saving} className="gap-1.5 shadow-md"
            onClick={(e) => handleSave(e, true)}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Gửi duyệt
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

// ─── InfoCard helper ─────────────────────────────
function InfoCard({ icon: Icon, iconCls, label, value }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconCls}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

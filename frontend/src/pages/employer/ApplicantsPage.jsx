/**
 * ApplicantsPage - Quản lý ứng viên cho employer
 * Xem ứng viên theo tin, bộ lọc trạng thái, xem CV, cập nhật trạng thái
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Badge } from '../../components/ui/Badge';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  Users, Loader2, Briefcase, Eye, Calendar, CheckCircle2,
  XCircle, Clock, Mail, FileText, ChevronDown, TrendingUp,
  Phone, MapPin, GraduationCap, Zap, ArrowLeft, User,
} from 'lucide-react';

// ─── Config ──────────────────────────────────────
const STATUS_CONFIG = {
  pending: { label: 'Chờ xét', dot: 'bg-amber-500', cls: 'warning' },
  reviewed: { label: 'Đã xem', dot: 'bg-blue-500', cls: 'default' },
  interview_scheduled: { label: 'Hẹn PV', dot: 'bg-indigo-500', cls: 'default' },
  accepted: { label: 'Đã nhận', dot: 'bg-emerald-500', cls: 'success' },
  rejected: { label: 'Từ chối', dot: 'bg-red-500', cls: 'danger' },
  withdrawn: { label: 'Đã rút', dot: 'bg-muted-foreground', cls: 'secondary' },
};

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xét' },
  { key: 'reviewed', label: 'Đã xem' },
  { key: 'interview_scheduled', label: 'Hẹn PV' },
  { key: 'accepted', label: 'Đã nhận' },
  { key: 'rejected', label: 'Từ chối' },
];

const STATUS_OPTIONS = [
  { value: 'reviewed', label: 'Đánh dấu đã xem' },
  { value: 'interview_scheduled', label: 'Hẹn phỏng vấn' },
  { value: 'accepted', label: 'Nhận ứng viên' },
  { value: 'rejected', label: 'Từ chối' },
];

const INTERVIEW_TYPE_OPTIONS = [
  { value: 'online', label: 'Online (Video call)' },
  { value: 'offline', label: 'Tại chỗ (In-person)' },
];

// ─── Field label ─────────────────────────────────
function FieldLabel({ children, required }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

// ─── CV Detail Dialog ─────────────────────────────
function CVDetailDialog({ cvId, applicantName, open, onClose }) {
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !cvId) return;
    setLoading(true);
    api.get(`/employer/applicant-cv/${cvId}`)
      .then(({ data }) => setCv(data.data))
      .catch(() => setCv(null))
      .finally(() => setLoading(false));
  }, [open, cvId]);

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      <DialogHeader onClose={onClose}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-semibold">CV ứng viên</div>
            <div className="text-xs text-muted-foreground font-normal">{applicantName}</div>
          </div>
        </div>
      </DialogHeader>

      <DialogBody className="max-h-[70vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !cv ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Không thể tải CV</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="rounded-xl border bg-gradient-to-br from-primary/8 to-transparent p-5">
              <h2 className="text-lg font-bold">{cv.title}</h2>
              {cv.headline && (
                <p className="text-sm text-primary font-medium mt-0.5">{cv.headline}</p>
              )}
              {cv.summary && (
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed border-t border-border/40 pt-3">{cv.summary}</p>
              )}
            </div>

            {/* Skills */}
            {cv.skills?.length > 0 && (
              <div className="rounded-xl border overflow-hidden border-l-4 border-l-indigo-400/50">
                <div className="px-4 py-2.5 border-b bg-indigo-500/5 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Kỹ năng</span>
                </div>
                <div className="p-4 flex flex-wrap gap-1.5">
                  {cv.skills.map(s => (
                    <span key={s._id} className="px-2.5 py-1 rounded-full bg-indigo-500/8 text-indigo-700 dark:text-indigo-400 text-xs font-medium border border-indigo-500/20">
                      {s.icon} {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education — object, not array */}
            {cv.education?.university && (
              <CVSection icon={GraduationCap} title="Học vấn" borderColor="border-l-amber-400/50" headBg="bg-amber-500/5" iconCls="text-amber-600">
                <CVItem
                  title={cv.education.university}
                  sub={cv.education.major}
                  detail={cv.education.gpa ? `GPA: ${cv.education.gpa}` : undefined}
                  period={cv.education.graduationYear ? `Ra trường ${cv.education.graduationYear}` : undefined}
                />
              </CVSection>
            )}

            {/* Experience — field: experiences */}
            {cv.experiences?.length > 0 && (
              <CVSection icon={Briefcase} title="Kinh nghiệm" borderColor="border-l-primary/40" headBg="bg-primary/5" iconCls="text-primary">
                {cv.experiences.map((e, i) => (
                  <CVItemWithDesc key={i} title={e.position} sub={e.company}
                    period={e.isCurrent
                      ? `${e.startDate ? new Date(e.startDate).getFullYear() : ''} – Hiện tại`
                      : `${e.startDate ? new Date(e.startDate).getFullYear() : ''} – ${e.endDate ? new Date(e.endDate).getFullYear() : ''}`}
                    desc={e.description} />
                ))}
              </CVSection>
            )}

            {/* Projects */}
            {cv.projects?.length > 0 && (
              <CVSection icon={TrendingUp} title="Dự án" borderColor="border-l-emerald-400/50" headBg="bg-emerald-500/5" iconCls="text-emerald-600">
                {cv.projects.map((p, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold">{p.name}</p>
                      {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">{p.url}</a>}
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap mb-2">{p.description}</p>}
                    {p.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.technologies.map((t, ti) => (
                          <span key={ti} className="px-2 py-0.5 rounded-full bg-emerald-500/8 text-emerald-700 dark:text-emerald-400 text-[11px] border border-emerald-500/20">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CVSection>
            )}

            {/* Certifications — field: certifications */}
            {cv.certifications?.length > 0 && (
              <CVSection icon={CheckCircle2} title="Chứng chỉ" borderColor="border-l-rose-400/50" headBg="bg-rose-500/5" iconCls="text-rose-600">
                {cv.certifications.map((c, i) => (
                  <CVItem key={i} title={c.name} sub={c.issuer}
                    period={c.issueDate ? new Date(c.issueDate).getFullYear() : undefined} />
                ))}
              </CVSection>
            )}
          </div>
        )}
      </DialogBody>

      <DialogFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>Đóng</Button>
      </DialogFooter>
    </Dialog>
  );
}

function CVSection({ icon: Icon, title, borderColor, headBg, iconCls, children }) {
  return (
    <div className={`rounded-xl border overflow-hidden border-l-4 ${borderColor}`}>
      <div className={`px-4 py-2.5 border-b ${headBg} flex items-center gap-2`}>
        <Icon className={`w-3.5 h-3.5 ${iconCls}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${iconCls}`}>{title}</span>
      </div>
      <div className="divide-y divide-border/30">{children}</div>
    </div>
  );
}

function CVItem({ title, sub, detail, period }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        </div>
        {period && <span className="text-xs text-muted-foreground shrink-0">{period}</span>}
      </div>
    </div>
  );
}

function CVItemWithDesc({ title, sub, period, desc }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        {period && <span className="text-xs text-muted-foreground shrink-0">{period}</span>}
      </div>
      {desc && <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{desc}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════
export default function ApplicantsPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [appLoading, setAppLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Đọc ?tab= từ URL để tự active đúng tab khi đến từ thông báo
  useEffect(() => {
    const tab = searchParams.get('tab');
    const validTabs = FILTER_TABS.map(t => t.key);
    if (tab && validTabs.includes(tab)) {
      setFilterStatus(tab);
    }
  }, [searchParams]);

  // Action dialog
  const [showAction, setShowAction] = useState(false);
  const [actionApp, setActionApp] = useState(null);
  const [actionForm, setActionForm] = useState({ status: '', rejectionReason: '', employerNotes: '', interview: {} });
  const [submitting, setSubmitting] = useState(false);

  // CV dialog
  const [cvDialog, setCvDialog] = useState({ open: false, cvId: null, name: '' });

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/employer/job-postings');
      const approved = (data.data || []).filter((j) => j.status === 'approved');
      setJobs(approved);
      // Mặc định chọn "Tất cả"
      setSelectedJobId('');
    } catch {
      toast.error('Không thể tải tin');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const loadApplicants = useCallback(async () => {
    if (jobs.length === 0) return;
    setAppLoading(true);
    try {
      if (selectedJobId) {
        const { data } = await api.get(`/employer/job-postings/${selectedJobId}/applicants`);
        setApplicants(data.data || []);
      } else {
        const results = await Promise.all(
          jobs.map(j => api.get(`/employer/job-postings/${j._id}/applicants`).then(r => r.data.data || []))
        );
        setApplicants(results.flat());
      }
    } catch {
      setApplicants([]);
    } finally {
      setAppLoading(false);
    }
  }, [selectedJobId, jobs]);

  useEffect(() => { loadApplicants(); }, [loadApplicants]);

  const filteredApplicants = useMemo(() => {
    if (filterStatus === 'all') return applicants;
    return applicants.filter(a => a.status === filterStatus);
  }, [applicants, filterStatus]);

  const statusCounts = useMemo(() => {
    const counts = { all: applicants.length };
    applicants.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return counts;
  }, [applicants]);

  function openAction(app) {
    setActionApp(app);
    setActionForm({
      status: '', rejectionReason: '', employerNotes: '',
      interview: { date: '', time: '', type: 'online', location: '', notes: '' },
    });
    setShowAction(true);
  }

  async function handleAction(e) {
    e.preventDefault();
    if (!actionForm.status) { toast.error('Chọn trạng thái'); return; }
    setSubmitting(true);
    try {
      const payload = { status: actionForm.status };
      if (actionForm.status === 'rejected') payload.rejectionReason = actionForm.rejectionReason;
      if (actionForm.status === 'interview_scheduled') payload.interview = actionForm.interview;
      if (actionForm.employerNotes) payload.employerNotes = actionForm.employerNotes;
      await api.patch(`/employer/applications/${actionApp._id}/status`, payload);
      toast.success('Cập nhật trạng thái thành công');
      setShowAction(false);
      loadApplicants();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="h-28 skeleton rounded-2xl" />
        <div className="h-16 skeleton rounded-xl" />
        <div className="h-24 skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-teal-500/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-0.5">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Quản lý Ứng Viên</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Xem và xử lý đơn ứng tuyển theo tin tuyển dụng
          </p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border bg-card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Chưa có tin được duyệt</h3>
          <p className="text-sm text-muted-foreground">Đăng tin và chờ admin duyệt để nhận đơn ứng tuyển</p>
        </div>
      ) : (
        <>
          {/* Job selector + Status filter - same bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="min-w-[220px] max-w-xs shrink-0">
              <CustomSelect
                value={selectedJobId}
                onChange={(v) => { setSelectedJobId(v); setFilterStatus('all'); }}
                options={[
                  { value: '', label: 'Tất cả tin tuyển dụng' },
                  ...jobs.map((job) => ({ value: job._id, label: job.title })),
                ]}
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto flex-1">
              {FILTER_TABS.map(({ key, label }) => {
                const count = statusCounts[key] || 0;
                const active = filterStatus === key;
                if (key !== 'all' && count === 0) return null;
                return (
                  <button key={key} onClick={() => setFilterStatus(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}>
                    {key !== 'all' && STATUS_CONFIG[key] && (
                      <div className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[key].dot}`} />
                    )}
                    {label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-background/80'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Applicants list */}
          {appLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
            </div>
          ) : filteredApplicants.length === 0 ? (
            <div className="rounded-2xl border bg-card p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground text-sm">
                {filterStatus === 'all' ? 'Chưa có ứng viên nào cho tin này' : `Không có ứng viên nào ở trạng thái "${STATUS_CONFIG[filterStatus]?.label}"`}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b bg-muted/20 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {filteredApplicants.length} ứng viên
                </span>
              </div>
              <div className="divide-y divide-border/30">
                {filteredApplicants.map((app) => {
                  const stCfg = STATUS_CONFIG[app.status] || {};
                  return (
                    <div key={app._id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/15 transition-colors">
                      {/* Dot + Avatar */}
                      <div className={`w-2 h-2 rounded-full shrink-0 ${stCfg.dot || 'bg-muted-foreground/30'}`} />
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold shrink-0 text-sm">
                        {(app.student?.fullName || 'U')[0].toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{app.student?.fullName || 'Ứng viên'}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.student?.email}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(app.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>

                      {/* CV button */}
                      {app.cv && (
                        <button
                          onClick={() => setCvDialog({ open: true, cvId: app.cv._id || app.cv, name: app.student?.fullName })}
                          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-primary/8 border border-primary/20 shrink-0"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {app.cv?.title || 'Xem CV'}
                        </button>
                      )}

                      <Badge variant={stCfg.cls}>{stCfg.label}</Badge>

                      {!['withdrawn'].includes(app.status) && (
                        <Button size="sm" variant="outline" onClick={() => openAction(app)} className="text-xs gap-1 shrink-0">
                          Cập nhật <ChevronDown className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── CV Detail Dialog ── */}
      <CVDetailDialog
        open={cvDialog.open}
        cvId={cvDialog.cvId}
        applicantName={cvDialog.name}
        onClose={() => setCvDialog({ open: false, cvId: null, name: '' })}
      />

      {/* ── Action Dialog ── */}
      <Dialog open={showAction} onClose={() => setShowAction(false)} className="max-w-lg">
        <DialogHeader onClose={() => setShowAction(false)}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold">Cập nhật ứng viên</div>
              <div className="text-xs text-muted-foreground font-normal">{actionApp?.student?.fullName}</div>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleAction}>
          <DialogBody className="space-y-4">
            <div>
              <FieldLabel required>Trạng thái mới</FieldLabel>
              <CustomSelect
                value={actionForm.status}
                onChange={(v) => setActionForm((f) => ({ ...f, status: v }))}
                options={STATUS_OPTIONS}
                placeholder="Chọn trạng thái..."
              />
            </div>

            {actionForm.status === 'interview_scheduled' && (
              <div className="space-y-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">Thông tin phỏng vấn</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>Ngày</FieldLabel>
                    <Input type="date" value={actionForm.interview.date}
                      onChange={(e) => setActionForm((f) => ({ ...f, interview: { ...f.interview, date: e.target.value } }))} />
                  </div>
                  <div>
                    <FieldLabel>Giờ</FieldLabel>
                    <Input type="time" value={actionForm.interview.time}
                      onChange={(e) => setActionForm((f) => ({ ...f, interview: { ...f.interview, time: e.target.value } }))} />
                  </div>
                </div>
                <div>
                  <FieldLabel>Hình thức</FieldLabel>
                  <CustomSelect
                    value={actionForm.interview.type}
                    onChange={(v) => setActionForm((f) => ({ ...f, interview: { ...f.interview, type: v } }))}
                    options={INTERVIEW_TYPE_OPTIONS}
                  />
                </div>
                <div>
                  <FieldLabel>Địa điểm / Link</FieldLabel>
                  <Input value={actionForm.interview.location}
                    onChange={(e) => setActionForm((f) => ({ ...f, interview: { ...f.interview, location: e.target.value } }))}
                    placeholder="Link meeting hoặc địa chỉ" />
                </div>
              </div>
            )}

            {actionForm.status === 'rejected' && (
              <div>
                <FieldLabel>Lý do từ chối</FieldLabel>
                <Textarea value={actionForm.rejectionReason}
                  onChange={(e) => setActionForm((f) => ({ ...f, rejectionReason: e.target.value }))}
                  rows={3} placeholder="Lý do từ chối ứng viên..." />
              </div>
            )}

            <div>
              <FieldLabel>Ghi chú nội bộ</FieldLabel>
              <Textarea value={actionForm.employerNotes}
                onChange={(e) => setActionForm((f) => ({ ...f, employerNotes: e.target.value }))}
                rows={2} placeholder="Ghi chú chỉ nhà tuyển dụng thấy..." />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAction(false)}>Hủy</Button>
            <Button type="submit" size="sm" disabled={submitting || !actionForm.status} className="gap-1.5">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

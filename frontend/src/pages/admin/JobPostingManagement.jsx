/**
 * JobPostingManagement - QL Tin tuyển dụng (Admin)
 * Xem, duyệt, từ chối tin tuyển dụng của NTD
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog, DialogBody, DialogHeader, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  Search, Eye, CheckCircle2, XCircle, ClipboardList,
  ChevronLeft, ChevronRight, Building2, MapPin, Clock, Banknote,
  Briefcase, AlertTriangle, SlidersHorizontal, ChevronDown,
  X, User, Calendar, FileText, Star,
} from 'lucide-react';

const statusLabels = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', draft: 'Nháp' };
const statusStyles = {
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-400/20' },
  approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-400/20' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-400/20' },
  draft: { bg: 'bg-muted/60', text: 'text-muted-foreground', border: 'border-border' },
};

function StatusBadge({ status }) {
  const label = statusLabels[status] || status;
  const c = statusStyles[status] || statusStyles.draft;
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
      {label}
    </span>
  );
}

const jobTypeLabels = { 'full-time': 'Full-time', 'part-time': 'Part-time', internship: 'Thực tập', freelance: 'Freelance', remote: 'Remote' };

export default function JobPostingManagement() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 15 });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [detailJob, setDetailJob] = useState(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectJobId, setRejectJobId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) setShowStatusMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const { data } = await api.get('/admin/job-postings', { params });
      setJobs(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Không thể tải danh sách tin');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, filterStatus]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  async function openDetail(job) {
    try {
      const { data } = await api.get(`/jobs/${job._id}`);
      setDetailJob(data.data);
      setShowDetail(true);
    } catch {
      toast.error('Không thể tải chi tiết');
    }
  }

  async function handleApprove(jobId) {
    setProcessing(true);
    try {
      await api.patch(`/admin/job-postings/${jobId}/approve`, { approved: true });
      toast.success('Đã duyệt tin tuyển dụng');
      loadJobs();
      setShowDetail(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi');
    } finally {
      setProcessing(false);
    }
  }

  function openRejectDialog(jobId) {
    setRejectJobId(jobId);
    setRejectionReason('');
    setShowReject(true);
  }

  async function handleReject(e) {
    e.preventDefault();
    setProcessing(true);
    try {
      await api.patch(`/admin/job-postings/${rejectJobId}/approve`, {
        approved: false,
        rejectionReason,
      });
      toast.success('Đã từ chối tin tuyển dụng');
      setShowReject(false);
      loadJobs();
      setShowDetail(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi');
    } finally {
      setProcessing(false);
    }
  }

  const pendingCount = jobs.filter((j) => j.status === 'pending').length;

  return (
    <div className="animate-fade-in space-y-5">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-primary/8 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Quản Lý Tin Tuyển Dụng</span>
            </div>
            <p className="text-muted-foreground text-sm mt-1.5">
              Tổng <strong className="text-foreground">{pagination.total}</strong> Tin • Duyệt hoặc từ chối tin NTD gửi
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-400/25 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" /> {pendingCount} chờ duyệt
            </span>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Lọc
        </div>
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm tin tuyển dụng..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className="pl-9"
          />
        </div>
        {/* Trạng thái dropdown */}
        <div className="relative shrink-0" ref={statusMenuRef}>
          <button
            type="button"
            onClick={() => setShowStatusMenu(v => !v)}
            className={`h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all min-w-[175px] ${showStatusMenu
              ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1'
              : 'border-input bg-background text-foreground hover:border-primary/60'}`}
          >
            <span className="flex-1 text-left truncate">
              {filterStatus === '' ? 'Tất cả trạng thái' : statusLabels[filterStatus] || filterStatus}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${showStatusMenu ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
          </button>
          {showStatusMenu && (
            <div className="absolute left-0 top-full mt-1.5 z-30 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden w-52 animate-fade-in">
              <div className="py-1.5">
                {[{ value: '', label: 'Tất cả trạng thái' }, ...Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v }))].map(({ value, label }) => (
                  <button key={value} type="button"
                    onClick={() => { setFilterStatus(value); setPagination((p) => ({ ...p, page: 1 })); setShowStatusMenu(false); }}
                    className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${filterStatus === value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted/50'}`}
                  >
                    {filterStatus === value && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    <span className={filterStatus === value ? '' : 'ml-3.5'}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Vị Trí</th>
                <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Công Ty</th>
                <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-24">Loại</th>
                <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-28">Lương</th>
                <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-30">Trạng Thái</th>
                <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-26">Ngày Tạo</th>
                <th className="text-right px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 skeleton rounded-lg shrink-0" />
                        <div className="h-4 w-36 skeleton rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><div className="h-4 w-28 skeleton rounded" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-4 w-16 skeleton rounded mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-4 w-20 skeleton rounded mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-5 w-20 skeleton rounded-full mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-4 w-16 skeleton rounded mx-auto" /></td>
                    <td className="px-4 py-3.5"><div className="h-7 w-20 skeleton rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Briefcase className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Không có tin tuyển dụng nào</p>
                    <p className="text-xs text-muted-foreground mt-1">Thử thay đổi bộ lọc</p>
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job._id}
                    className={`border-b hover:bg-muted/20 transition-colors group ${job.status === 'pending' ? 'bg-amber-500/[0.03]' : ''}`}>
                    {/* Vị trí */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${job.status === 'pending' ? 'bg-amber-500/10 group-hover:bg-amber-500/20' : 'bg-primary/8 group-hover:bg-primary/15'
                          }`}>
                          <Briefcase className={`w-3.5 h-3.5 ${job.status === 'pending' ? 'text-amber-600' : 'text-primary'}`} />
                        </div>
                        <span className="font-medium truncate max-w-[200px] group-hover:text-primary transition-colors">{job.title}</span>
                      </div>
                    </td>
                    {/* Công ty */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs truncate max-w-[120px]">{job.company?.name || 'N/A'}</span>
                      </div>
                    </td>
                    {/* Loại */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-xs font-medium text-muted-foreground">{jobTypeLabels[job.jobType] || job.jobType}</span>
                    </td>
                    {/* Lương */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-xs text-muted-foreground">
                        {job.salaryRange?.min && job.salaryRange?.max
                          ? `${job.salaryRange.min}-${job.salaryRange.max}M`
                          : 'Thương lượng'}
                      </span>
                    </td>
                    {/* Trạng thái */}
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={job.status} />
                    </td>
                    {/* Ngày tạo */}
                    <td className="px-4 py-3.5 text-center text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(job)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary" title="Xem chi tiết">
                          <Eye className="w-4 h-4" />
                        </button>
                        {job.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(job._id)} disabled={processing}
                              className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 transition-colors" title="Duyệt">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => openRejectDialog(job._id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors" title="Từ chối">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/10">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">{pagination.total}</strong> tin tuyển dụng • Trang {pagination.page}/{pagination.pages}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs px-2 font-medium">{pagination.page}</span>
              <Button variant="ghost" size="sm" disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onClose={() => setShowDetail(false)} className="max-w-2xl">
        {/* Gradient header — status-aware color */}
        {detailJob && (
          <div className={`relative overflow-hidden rounded-t-xl border-b px-6 py-5 ${detailJob.status === 'pending'
              ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent'
              : detailJob.status === 'approved'
                ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent'
                : detailJob.status === 'rejected'
                  ? 'bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent'
                  : 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent'
            }`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${detailJob.status === 'pending' ? 'bg-amber-500/15 border-amber-400/20 text-amber-600' :
                    detailJob.status === 'approved' ? 'bg-emerald-500/15 border-emerald-400/20 text-emerald-600' :
                      detailJob.status === 'rejected' ? 'bg-red-500/15 border-red-400/20 text-red-600' :
                        'bg-primary/15 border-primary/10 text-primary'
                  }`}>
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground leading-tight">{detailJob.title}</h2>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <StatusBadge status={detailJob.status} />
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {detailJob.company?.name}
                    </span>
                    {detailJob.location && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {detailJob.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)}
                className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors self-start">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Meta bar in header */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/40">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold text-emerald-700">
                  {detailJob.salaryRange?.min && detailJob.salaryRange?.max
                    ? `${detailJob.salaryRange.min}–${detailJob.salaryRange.max}M VNĐ`
                    : 'Thương lượng'}
                </span>
              </span>
              {detailJob.jobType && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {detailJob.jobType}
                </span>
              )}
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-auto">
                <Calendar className="w-3 h-3" />
                {new Date(detailJob.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        )}

        {detailJob && (
          <DialogBody className="max-h-[62vh] overflow-y-auto px-6 py-5 space-y-5">

            {/* Mô tả công việc */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Mô tả công việc</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed pl-1">
                {detailJob.description || 'Chưa có mô tả'}
              </p>
            </div>

            {/* Yêu cầu */}
            {detailJob.requirements && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">Yêu cầu</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed pl-1">{detailJob.requirements}</p>
              </div>
            )}

            {/* Kỹ năng */}
            {detailJob.requiredSkills?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">Kỹ năng yêu cầu</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{detailJob.requiredSkills.length}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="flex flex-wrap gap-1.5 pl-1">
                  {detailJob.requiredSkills.map((rs, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-primary/8 text-primary px-2.5 py-1 rounded-full border border-primary/15">
                      {rs.skill?.name || 'N/A'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Lý do từ chối */}
            {detailJob.rejectionReason && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/5 border border-red-400/20">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-red-600 uppercase tracking-widest mb-1">Lý do từ chối</p>
                  <p className="text-sm text-red-700">{detailJob.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Meta footer: Đăng bởi */}
            <div className="flex items-center gap-2.5 pt-3 border-t">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Đăng bởi: <span className="font-semibold text-foreground">{detailJob.employer?.fullName}</span>
                  <span className="text-muted-foreground"> ({detailJob.employer?.email})</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(detailJob.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

          </DialogBody>
        )}

        <DialogFooter className="border-t bg-muted/20 rounded-b-xl px-6 py-4">
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
          {detailJob?.status === 'pending' && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                onClick={() => { setShowDetail(false); openRejectDialog(detailJob._id); }}>
                <XCircle className="w-3.5 h-3.5" /> Từ chối
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => handleApprove(detailJob._id)} disabled={processing}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt tin
              </Button>
            </div>
          )}
        </DialogFooter>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showReject} onClose={() => setShowReject(false)}>
        <DialogHeader onClose={() => setShowReject(false)}>Từ chối tin tuyển dụng</DialogHeader>
        <form onSubmit={handleReject}>
          <DialogBody className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-400/15">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Vui lòng nhập lý do từ chối. Nội dung sẽ được gửi đến nhà tuyển dụng.
              </p>
            </div>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="Nhập lý do từ chối..."
            />
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowReject(false)}>Hủy</Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" size="sm" disabled={processing}>
              {processing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

/**
 * JobPostingManagement - QL Tin tuyển dụng (Admin)
 * Xem, duyệt, từ chối tin tuyển dụng của NTD
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  Search, Eye, CheckCircle2, XCircle, ClipboardList,
  ChevronLeft, ChevronRight, Building2, MapPin, Clock, Banknote,
  Briefcase, AlertTriangle,
} from 'lucide-react';

const statusLabels = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', draft: 'Nháp' };
const statusColors = { pending: 'warning', approved: 'success', rejected: 'danger', draft: 'secondary' };
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
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Tin Tuyển Dụng</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tổng {pagination.total} tin • Duyệt / Từ chối tin NTD gửi
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="warning" className="text-sm px-3 py-1 gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> {pendingCount} chờ duyệt
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm tin tuyển dụng..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className="pl-9"
          />
        </div>
        <Select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
          className="w-44"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vị trí</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Công ty</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Loại</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Lương</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Trạng thái</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ngày tạo</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 w-16 skeleton" /></td>
                    ))}
                  </tr>
                ))
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Không có tin tuyển dụng nào
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job._id}
                    className={`border-b hover:bg-muted/20 transition-colors ${job.status === 'pending' ? 'bg-amber-500/[0.03]' : ''
                      }`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium truncate max-w-[200px]">{job.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs truncate max-w-[120px]">{job.company?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-muted-foreground">
                        {jobTypeLabels[job.jobType] || job.jobType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-muted-foreground">
                        {job.salaryRange?.min && job.salaryRange?.max
                          ? `${job.salaryRange.min}-${job.salaryRange.max}M`
                          : 'Thương lượng'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={statusColors[job.status]}>{statusLabels[job.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(job)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Eye className="w-4 h-4" />
                        </button>
                        {job.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(job._id)} disabled={processing}
                              className="p-1.5 rounded-md hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 transition-colors">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => openRejectDialog(job._id)}
                              className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors">
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
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Trang {pagination.page}/{pagination.pages} • Tổng {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
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
        <DialogHeader onClose={() => setShowDetail(false)}>Chi tiết Tin tuyển dụng</DialogHeader>
        {detailJob && (
          <DialogBody className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{detailJob.title}</h3>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <Badge variant={statusColors[detailJob.status]}>{statusLabels[detailJob.status]}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> {detailJob.company?.name}
                </span>
                {detailJob.location && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {detailJob.location}
                  </span>
                )}
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5" />
                  {detailJob.salaryRange?.min && detailJob.salaryRange?.max
                    ? `${detailJob.salaryRange.min}-${detailJob.salaryRange.max}M VNĐ`
                    : 'Thương lượng'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-1">Mô tả công việc</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{detailJob.description || 'Chưa có mô tả'}</p>
            </div>

            {detailJob.requirements && (
              <div>
                <h4 className="font-medium text-sm mb-1">Yêu cầu</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{detailJob.requirements}</p>
              </div>
            )}

            {detailJob.requiredSkills?.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-1">Kỹ năng yêu cầu</h4>
                <div className="flex flex-wrap gap-2">
                  {detailJob.requiredSkills.map((rs, i) => (
                    <Badge key={i} variant="secondary">{rs.skill?.name || 'N/A'}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground pt-2 border-t">
              <p>Đăng bởi: {detailJob.employer?.fullName} ({detailJob.employer?.email})</p>
              <p>Ngày tạo: {new Date(detailJob.createdAt).toLocaleString('vi-VN')}</p>
              {detailJob.rejectionReason && (
                <p className="text-red-500 mt-1">Lý do từ chối: {detailJob.rejectionReason}</p>
              )}
            </div>
          </DialogBody>
        )}
        <DialogFooter>
          {detailJob?.status === 'pending' && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => { setShowDetail(false); openRejectDialog(detailJob._id); }}>
                <XCircle className="w-4 h-4 mr-1" /> Từ chối
              </Button>
              <Button size="sm" onClick={() => handleApprove(detailJob._id)} disabled={processing}>
                <CheckCircle2 className="w-4 h-4 mr-1" /> Duyệt tin
              </Button>
            </div>
          )}
          {detailJob?.status !== 'pending' && (
            <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
          )}
        </DialogFooter>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showReject} onClose={() => setShowReject(false)}>
        <DialogHeader onClose={() => setShowReject(false)}>Từ chối tin tuyển dụng</DialogHeader>
        <form onSubmit={handleReject}>
          <DialogBody className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Vui lòng nhập lý do từ chối (không bắt buộc):
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="Nhập lý do..."
            />
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowReject(false)}>Hủy</Button>
            <Button type="submit" variant="danger" size="sm" disabled={processing}>
              {processing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

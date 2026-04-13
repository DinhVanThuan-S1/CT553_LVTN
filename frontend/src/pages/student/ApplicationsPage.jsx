/**
 * ApplicationsPage - Đơn ứng tuyển của sinh viên
 * Danh sách đơn + trạng thái + rút đơn
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import {
  ClipboardList, Loader2, Eye, Building2, Calendar,
  Briefcase, MapPin, XCircle, Clock, CheckCircle2,
  AlertTriangle, Users,
} from 'lucide-react';

const statusLabels = {
  pending: 'Chờ xét duyệt',
  reviewed: 'Đã xem',
  interview_scheduled: 'Hẹn phỏng vấn',
  accepted: 'Được nhận',
  rejected: 'Từ chối',
  withdrawn: 'Đã rút',
};
const statusColors = {
  pending: 'warning',
  reviewed: 'default',
  interview_scheduled: 'default',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'secondary',
};
const statusIcons = {
  pending: Clock,
  reviewed: Eye,
  interview_scheduled: Calendar,
  accepted: CheckCircle2,
  rejected: XCircle,
  withdrawn: AlertTriangle,
};

export default function ApplicationsPage() {
  const toast = useToast();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/student/applications');
      setApps(data.data);
    } catch {
      toast.error('Không thể tải đơn ứng tuyển');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openDetail(app) {
    setDetailLoading(true);
    setShowDetail(true);
    try {
      const { data } = await api.get(`/student/applications/${app._id}`);
      setDetail(data.data);
    } catch {
      toast.error('Không thể tải chi tiết');
      setShowDetail(false);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleWithdraw(appId) {
    setConfirmState({
      title: 'Rút đơn ứng tuyển',
      message: 'Bạn có chắc muốn rút đơn ứng tuyển này?',
      confirmLabel: 'Rút đơn',
      variant: 'warning',
      icon: XCircle,
      onConfirm: async () => {
        setWithdrawing(true);
        try {
          await api.patch(`/student/applications/${appId}/withdraw`);
          toast.success('Đã rút đơn ứng tuyển');
          setShowDetail(false);
          load();
        } catch (error) {
          toast.error(error.response?.data?.message || 'Có lỗi');
        } finally {
          setWithdrawing(false);
        }
      },
    });
  }

  const pending = apps.filter((a) => a.status === 'pending').length;
  const interviews = apps.filter((a) => a.status === 'interview_scheduled').length;

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Đơn Ứng Tuyển</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {apps.length} đơn • {pending > 0 ? `${pending} chờ xét` : 'không có đơn chờ'}
          </p>
        </div>
        <div className="flex gap-2">
          {pending > 0 && <Badge variant="warning" className="gap-1"><Clock className="w-3 h-3" /> {pending} chờ</Badge>}
          {interviews > 0 && <Badge variant="success" className="gap-1"><Calendar className="w-3 h-3" /> {interviews} phỏng vấn</Badge>}
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <ClipboardList className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-1">Chưa ứng tuyển</h3>
          <p className="text-sm text-muted-foreground">Tìm công việc phù hợp và gửi đơn ứng tuyển</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const Icon = statusIcons[app.status] || Clock;
            return (
              <div key={app._id}
                className={`rounded-xl border bg-card p-4 card-hover ${app.status === 'interview_scheduled' ? 'border-primary/30' : ''
                  }`}>
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${app.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500'
                      : app.status === 'rejected' ? 'bg-red-500/10 text-red-500'
                        : app.status === 'interview_scheduled' ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                    }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{app.jobPosting?.title || 'Công việc'}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {app.jobPosting?.company?.name || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                      {app.cv?.title && (
                        <span className="flex items-center gap-1">CV: {app.cv.title}</span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <Badge variant={statusColors[app.status]} className="shrink-0">
                    {statusLabels[app.status]}
                  </Badge>

                  {/* Actions */}
                  <button onClick={() => openDetail(app)}
                    className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Interview info */}
                {app.status === 'interview_scheduled' && app.interview && (
                  <div className="mt-3 p-3 rounded-lg bg-primary/[0.03] border border-primary/10 text-sm">
                    <p className="font-medium text-primary">📅 Lịch phỏng vấn</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {app.interview.date && new Date(app.interview.date).toLocaleDateString('vi-VN')}
                      {app.interview.time && ` lúc ${app.interview.time}`}
                      {app.interview.type && ` • ${app.interview.type === 'online' ? 'Online' : 'Tại chỗ'}`}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetail} onClose={() => setShowDetail(false)} className="max-w-2xl">
        <DialogHeader onClose={() => setShowDetail(false)}>Chi tiết đơn ứng tuyển</DialogHeader>
        {detailLoading ? (
          <DialogBody className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </DialogBody>
        ) : detail ? (
          <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{detail.jobPosting?.title}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> {detail.jobPosting?.company?.name}
                </p>
              </div>
              <Badge variant={statusColors[detail.status]} className="text-sm">
                {statusLabels[detail.status]}
              </Badge>
            </div>

            {/* Timeline */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>📨 Ứng tuyển: {new Date(detail.createdAt).toLocaleString('vi-VN')}</p>
              {detail.reviewedAt && <p>👀 Đã xem: {new Date(detail.reviewedAt).toLocaleString('vi-VN')}</p>}
              {detail.interviewScheduledAt && <p>📅 Hẹn PV: {new Date(detail.interviewScheduledAt).toLocaleString('vi-VN')}</p>}
              {detail.respondedAt && <p>📋 Phản hồi: {new Date(detail.respondedAt).toLocaleString('vi-VN')}</p>}
            </div>

            {detail.interview && detail.status === 'interview_scheduled' && (
              <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
                <h4 className="font-medium text-sm mb-1">Thông tin phỏng vấn</h4>
                <p className="text-sm">
                  {detail.interview.date && new Date(detail.interview.date).toLocaleDateString('vi-VN')}
                  {detail.interview.time && ` lúc ${detail.interview.time}`}
                </p>
                {detail.interview.location && <p className="text-xs text-muted-foreground">{detail.interview.location}</p>}
                {detail.interview.notes && <p className="text-xs text-muted-foreground mt-1">{detail.interview.notes}</p>}
              </div>
            )}

            {detail.rejectionReason && (
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                <p className="text-sm text-red-600">Lý do từ chối: {detail.rejectionReason}</p>
              </div>
            )}

            {detail.employerNotes && (
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Ghi chú NTD: {detail.employerNotes}</p>
              </div>
            )}

            {/* Required skills */}
            {detail.jobPosting?.requiredSkills?.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Kỹ năng yêu cầu</h4>
                <div className="flex flex-wrap gap-1.5">
                  {detail.jobPosting.requiredSkills.map((rs, i) => (
                    <Badge key={i} variant="secondary">{rs.skill?.icon} {rs.skill?.name}</Badge>
                  ))}
                </div>
              </div>
            )}
          </DialogBody>
        ) : null}
        <DialogFooter>
          {detail && ['pending', 'reviewed', 'interview_scheduled'].includes(detail.status) && (
            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => handleWithdraw(detail._id)} disabled={withdrawing}>
              <XCircle className="w-4 h-4 mr-1" /> {withdrawing ? 'Đang rút...' : 'Rút đơn'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
        </DialogFooter>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}

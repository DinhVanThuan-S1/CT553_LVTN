/**
 * ApplicationsPage - Đơn ứng tuyển của sinh viên
 * Danh sách đơn + trạng thái + rút đơn
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import {
  ClipboardList, Loader2, Eye, Building2, Calendar,
  XCircle, Clock, CheckCircle2, AlertTriangle, Send,
  MapPin, FileText, ChevronRight,
} from 'lucide-react';

const statusConfig = {
  pending: { label: 'Chờ xét duyệt', icon: Clock, color: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-300/40' },
  reviewed: { label: 'Đã xem', icon: Eye, color: 'blue', bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-300/40' },
  interview_scheduled: { label: 'Hẹn phỏng vấn', icon: Calendar, color: 'primary', bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  accepted: { label: 'Được nhận', icon: CheckCircle2, color: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-300/40' },
  rejected: { label: 'Từ chối', icon: XCircle, color: 'red', bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-300/40' },
  withdrawn: { label: 'Đã rút', icon: AlertTriangle, color: 'slate', bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-300/50' },
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
  const [statusFilter, setStatusFilter] = useState('all');

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
    setDetail(null);
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

  const pending = apps.filter(a => a.status === 'pending').length;
  const interviews = apps.filter(a => a.status === 'interview_scheduled').length;
  const accepted = apps.filter(a => a.status === 'accepted').length;

  // Client-side status filter
  const filtered = statusFilter === 'all' ? apps : apps.filter(a => a.status === statusFilter);

  // Only show tabs for statuses that have data
  const activeTabs = [
    { key: 'all', label: 'Tất cả', count: apps.length },
    ...Object.entries(statusConfig)
      .filter(([status]) => apps.some(a => a.status === status))
      .map(([status, cfg]) => ({ key: status, label: cfg.label, count: apps.filter(a => a.status === status).length })),
  ];

  if (loading) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="h-32 skeleton rounded-2xl" />
        {[1, 2, 3].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl from-amber-500/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Đơn Ứng Tuyển</span>
            </div>
            {/* <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Đơn Ứng Tuyển</h1> */}
            <p className="text-muted-foreground text-sm mt-1.5">{apps.length} đơn đã gửi</p>
          </div>
          {/* Stat pills — clickable to filter */}
          <div className="flex flex-wrap gap-2">
            {pending > 0 && (
              <button onClick={() => setStatusFilter(f => f === 'pending' ? 'all' : 'pending')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${statusFilter === 'pending' ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-amber-500/10 border-amber-300/40 text-amber-700 hover:bg-amber-500/20'}`}>
                <Clock className="w-3.5 h-3.5" /> {pending} chờ xét
              </button>
            )}
            {interviews > 0 && (
              <button onClick={() => setStatusFilter(f => f === 'interview_scheduled' ? 'all' : 'interview_scheduled')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${statusFilter === 'interview_scheduled' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'}`}>
                <Calendar className="w-3.5 h-3.5" /> {interviews} phỏng vấn
              </button>
            )}
            {accepted > 0 && (
              <button onClick={() => setStatusFilter(f => f === 'accepted' ? 'all' : 'accepted')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${statusFilter === 'accepted' ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-emerald-500/10 border-emerald-300/40 text-emerald-700 hover:bg-emerald-500/20'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> {accepted} được nhận
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Status Filter Tabs ── */}
      {apps.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {activeTabs.map(({ key, label, count }) => {
            const cfg = statusConfig[key];
            const isActive = statusFilter === key;
            return (
              <button key={key} onClick={() => setStatusFilter(key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50'
                  }`}>
                {cfg && <cfg.icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : cfg.text}`} />}
                {label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'
                  }`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Application List ── */}
      {apps.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Chưa ứng tuyển</h3>
          <p className="text-sm text-muted-foreground">Tìm công việc phù hợp và gửi đơn ứng tuyển</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center">
          <ClipboardList className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Không có đơn nào với trạng thái này</p>
          <button onClick={() => setStatusFilter('all')} className="mt-2 text-xs text-primary hover:underline">Xem tất cả</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(app => {
            const cfg = statusConfig[app.status] || statusConfig.pending;
            const Icon = cfg.icon;
            const isInterview = app.status === 'interview_scheduled';
            return (
              <div key={app._id}
                className={`group rounded-xl border bg-card transition-all duration-200 hover:shadow-md overflow-hidden border-l-4 ${isInterview ? 'border-primary/30' : 'hover:border-primary/20'} ${app.status === 'accepted' ? 'border-l-emerald-400'
                    : app.status === 'rejected' ? 'border-l-red-400'
                      : app.status === 'interview_scheduled' ? 'border-l-primary'
                        : app.status === 'reviewed' ? 'border-l-blue-400'
                          : app.status === 'withdrawn' ? 'border-l-slate-400'
                            : 'border-l-amber-400/70'
                  }`}>

                <div className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Status icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <Icon className={`w-5 h-5 ${cfg.text}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {app.jobPosting?.title || 'Công việc'}
                      </h3>
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {app.jobPosting?.company?.name || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        {app.cv?.title && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {app.cv.title}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {cfg.label}
                    </span>

                    {/* Detail btn */}
                    <button onClick={() => openDetail(app)}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Interview banner */}
                  {isInterview && app.interview && (
                    <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-primary/[0.04] border border-primary/15 text-sm">
                      <Calendar className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <span className="font-medium text-primary">Lịch phỏng vấn: </span>
                        <span className="text-muted-foreground text-xs">
                          {app.interview.date && new Date(app.interview.date).toLocaleDateString('vi-VN')}
                          {app.interview.time && ` lúc ${app.interview.time}`}
                          {app.interview.type && ` · ${app.interview.type === 'online' ? 'Online' : 'Tại chỗ'}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail Dialog ── */}
      <Dialog open={showDetail} onClose={() => setShowDetail(false)} className="max-w-xl">
        <DialogHeader onClose={() => setShowDetail(false)}>Chi tiết đơn ứng tuyển</DialogHeader>

        {detailLoading ? (
          <DialogBody className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </DialogBody>
        ) : detail ? (
          <DialogBody className="p-0 max-h-[75vh] overflow-y-auto">
            {/* Hero */}
            {(() => {
              const cfg = statusConfig[detail.status] || statusConfig.pending;
              return (
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5 border-b">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-card border shadow-sm flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold leading-snug">{detail.jobPosting?.title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" /> {detail.jobPosting?.company?.name}
                        </p>
                        {detail.jobPosting?.locationText && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {detail.jobPosting.locationText}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="p-6 space-y-5">
              {/* Timeline */}
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-primary inline-block" />
                  Tiến trình
                </h4>
                <div className="space-y-2 pl-3">
                  {[
                    { icon: Send, label: 'Ứng tuyển', date: detail.createdAt },
                    { icon: Eye, label: 'Đã xem', date: detail.reviewedAt },
                    { icon: Calendar, label: 'Hẹn phỏng vấn', date: detail.interviewScheduledAt },
                    { icon: ClipboardList, label: 'Phản hồi', date: detail.respondedAt },
                  ].filter(t => t.date).map((t, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <t.icon className="w-3 h-3 text-primary" />
                      </div>
                      <span className="font-medium">{t.label}</span>
                      <span className="text-muted-foreground ml-auto">{new Date(t.date).toLocaleString('vi-VN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interview info */}
              {detail.interview && detail.status === 'interview_scheduled' && (
                <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
                  <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Thông tin phỏng vấn
                  </h4>
                  <div className="space-y-1 text-sm">
                    {detail.interview.date && (
                      <p>{new Date(detail.interview.date).toLocaleDateString('vi-VN')}
                        {detail.interview.time && ` lúc ${detail.interview.time}`}
                        {detail.interview.type && ` · ${detail.interview.type === 'online' ? 'Online' : 'Tại chỗ'}`}
                      </p>
                    )}
                    {detail.interview.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {detail.interview.location}
                      </p>
                    )}
                    {detail.interview.notes && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{detail.interview.notes}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Rejection reason */}
              {detail.rejectionReason && (
                <div className="rounded-xl border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/40 p-4">
                  <h4 className="font-semibold text-sm text-red-600 mb-1 flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Lý do từ chối
                  </h4>
                  <p className="text-sm text-red-600/80">{detail.rejectionReason}</p>
                </div>
              )}

              {/* Employer notes */}
              {detail.employerNotes && (
                <div className="rounded-xl border bg-muted/20 p-4">
                  <h4 className="font-semibold text-sm mb-1">Ghi chú từ nhà tuyển dụng</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{detail.employerNotes}</p>
                </div>
              )}

              {/* CV used */}
              {detail.cv && (
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/10">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">CV đã gửi</p>
                    <p className="text-sm font-medium">{detail.cv.title}</p>
                  </div>
                </div>
              )}

              {/* Required skills */}
              {detail.jobPosting?.requiredSkills?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-primary inline-block" />
                    Kỹ năng yêu cầu
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pl-3">
                    {detail.jobPosting.requiredSkills.map((rs, i) => (
                      <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/8 text-primary border border-primary/15">
                        {rs.skill?.icon} {rs.skill?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogBody>
        ) : null}

        <DialogFooter>
          {detail && ['pending', 'reviewed', 'interview_scheduled'].includes(detail.status) && (
            <Button variant="outline" size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5"
              onClick={() => handleWithdraw(detail._id)} disabled={withdrawing}>
              <XCircle className="w-4 h-4" />
              {withdrawing ? 'Đang rút...' : 'Rút đơn'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}

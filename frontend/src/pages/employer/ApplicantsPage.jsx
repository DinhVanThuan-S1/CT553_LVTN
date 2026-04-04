/**
 * ApplicantsPage - Quản lý ứng viên cho employer
 * Xem ứng viên theo tin, cập nhật trạng thái, hẹn phỏng vấn
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  Users, Loader2, Briefcase, Eye, Calendar, CheckCircle2,
  XCircle, Clock, Mail, FileText, ChevronDown,
} from 'lucide-react';

const statusLabels = {
  pending: 'Chờ xét', reviewed: 'Đã xem', interview_scheduled: 'Hẹn PV',
  accepted: 'Nhận', rejected: 'Từ chối', withdrawn: 'Đã rút',
};
const statusColors = {
  pending: 'warning', reviewed: 'default', interview_scheduled: 'default',
  accepted: 'success', rejected: 'danger', withdrawn: 'secondary',
};

export default function ApplicantsPage() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [appLoading, setAppLoading] = useState(false);
  const [showAction, setShowAction] = useState(false);
  const [actionApp, setActionApp] = useState(null);
  const [actionForm, setActionForm] = useState({ status: '', rejectionReason: '', employerNotes: '', interview: {} });
  const [submitting, setSubmitting] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/employer/job-postings');
      const approved = (data.data || []).filter((j) => j.status === 'approved');
      setJobs(approved);
      if (approved.length > 0) {
        setSelectedJobId(approved[0]._id);
      }
    } catch {
      toast.error('Không thể tải tin');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  useEffect(() => {
    if (selectedJobId) loadApplicants();
  }, [selectedJobId]);

  async function loadApplicants() {
    setAppLoading(true);
    try {
      const { data } = await api.get(`/employer/job-postings/${selectedJobId}/applicants`);
      setApplicants(data.data || []);
    } catch {
      setApplicants([]);
    } finally {
      setAppLoading(false);
    }
  }

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
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ứng Viên</h1>
        <p className="text-muted-foreground text-sm mt-1">Quản lý đơn ứng tuyển theo tin</p>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <Users className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-1">Chưa có tin tuyển dụng nào được duyệt</h3>
          <p className="text-sm text-muted-foreground">Đăng tin và chờ admin duyệt để nhận đơn ứng tuyển</p>
        </div>
      ) : (
        <>
          {/* Job selector */}
          <div className="rounded-xl border bg-card p-4">
            <label className="text-sm font-medium mb-1.5 block">Chọn tin tuyển dụng</label>
            <Select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>{job.title}</option>
              ))}
            </Select>
          </div>

          {/* Applicants list */}
          {appLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : applicants.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Chưa có ứng viên nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{applicants.length} ứng viên</p>
              {applicants.map((app) => (
                <div key={app._id} className="rounded-xl border bg-card p-4 flex items-center gap-4 card-hover">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                    {(app.student?.fullName || 'U')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{app.student?.fullName || 'Ứng viên'}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {app.student?.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {app.cv?.title || 'CV'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <Badge variant={statusColors[app.status]}>{statusLabels[app.status]}</Badge>

                  {/* Action button */}
                  {!['withdrawn'].includes(app.status) && (
                    <Button size="sm" variant="outline" onClick={() => openAction(app)} className="text-xs gap-1">
                      Cập nhật <ChevronDown className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Action Dialog */}
      <Dialog open={showAction} onClose={() => setShowAction(false)} className="max-w-lg">
        <DialogHeader onClose={() => setShowAction(false)}>
          Cập nhật: {actionApp?.student?.fullName}
        </DialogHeader>
        <form onSubmit={handleAction}>
          <DialogBody className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Trạng thái</label>
              <Select value={actionForm.status}
                onChange={(e) => setActionForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="">Chọn trạng thái</option>
                <option value="reviewed">Đã xem</option>
                <option value="interview_scheduled">Hẹn phỏng vấn</option>
                <option value="accepted">Nhận</option>
                <option value="rejected">Từ chối</option>
              </Select>
            </div>

            {actionForm.status === 'interview_scheduled' && (
              <div className="space-y-2 p-3 rounded-lg border bg-muted/10">
                <h4 className="text-sm font-medium">Thông tin phỏng vấn</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={actionForm.interview.date}
                    onChange={(e) => setActionForm((f) => ({
                      ...f, interview: { ...f.interview, date: e.target.value }
                    }))} />
                  <Input type="time" value={actionForm.interview.time}
                    onChange={(e) => setActionForm((f) => ({
                      ...f, interview: { ...f.interview, time: e.target.value }
                    }))} />
                </div>
                <Select value={actionForm.interview.type}
                  onChange={(e) => setActionForm((f) => ({
                    ...f, interview: { ...f.interview, type: e.target.value }
                  }))}>
                  <option value="online">Online</option>
                  <option value="offline">Tại chỗ</option>
                </Select>
                <Input value={actionForm.interview.location}
                  onChange={(e) => setActionForm((f) => ({
                    ...f, interview: { ...f.interview, location: e.target.value }
                  }))}
                  placeholder="Link meeting hoặc địa chỉ" />
              </div>
            )}

            {actionForm.status === 'rejected' && (
              <div>
                <label className="text-sm font-medium mb-1 block">Lý do từ chối</label>
                <Textarea value={actionForm.rejectionReason}
                  onChange={(e) => setActionForm((f) => ({ ...f, rejectionReason: e.target.value }))}
                  rows={2} placeholder="Lý do..." />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">Ghi chú</label>
              <Textarea value={actionForm.employerNotes}
                onChange={(e) => setActionForm((f) => ({ ...f, employerNotes: e.target.value }))}
                rows={2} placeholder="Ghi chú nội bộ..." />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAction(false)}>Hủy</Button>
            <Button type="submit" size="sm" disabled={submitting || !actionForm.status}>
              {submitting ? 'Đang lưu...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

/**
 * EmployerDashboard - Tổng quan cho NTD
 * Thống kê nhanh: tin đăng, ứng viên, phỏng vấn
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import {
  Briefcase, Users, Building2, Clock, CheckCircle2,
  Loader2, Eye, Calendar, FileText, TrendingUp, Plus,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function EmployerDashboard() {
  const toast = useToast();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [compRes, jobRes] = await Promise.all([
        api.get('/employer/company'),
        api.get('/employer/job-postings'),
      ]);
      setCompany(compRes.data.data);
      setJobs(jobRes.data.data || []);
    } catch {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  const totalJobs = jobs.length;
  const approvedJobs = jobs.filter((j) => j.status === 'approved').length;
  const pendingJobs = jobs.filter((j) => j.status === 'pending').length;
  const draftJobs = jobs.filter((j) => j.status === 'draft').length;

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
          <h1 className="text-2xl font-bold">Tổng quan</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {company ? company.name : 'Chưa thiết lập hồ sơ công ty'}
          </p>
        </div>
        <Link to="/employer/job-postings">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Đăng tin tuyển dụng
          </Button>
        </Link>
      </div>

      {/* Alert if no company */}
      {!company && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-700">Chưa thiết lập hồ sơ công ty</p>
            <p className="text-xs text-amber-600">Vui lòng thiết lập hồ sơ công ty trước khi đăng tin tuyển dụng</p>
          </div>
          <Link to="/employer/company">
            <Button variant="outline" size="sm">Thiết lập ngay</Button>
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Briefcase className="w-5 h-5 text-primary" />} value={totalJobs} label="Tin đã đăng" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} value={approvedJobs} label="Đã duyệt" />
        <StatCard icon={<Clock className="w-5 h-5 text-amber-500" />} value={pendingJobs} label="Chờ duyệt" />
        <StatCard icon={<FileText className="w-5 h-5 text-blue-500" />} value={draftJobs} label="Nháp" />
      </div>

      {/* Recent Jobs */}
      <div>
        <h2 className="font-semibold text-lg mb-3">Tin tuyển dụng gần đây</h2>
        {jobs.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <Briefcase className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Chưa có tin tuyển dụng nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.slice(0, 5).map((job) => (
              <div key={job._id} className="rounded-xl border bg-card p-4 flex items-center gap-4 card-hover">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{job.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{job.jobType}</span>
                    {job.locationText && <span>{job.locationText}</span>}
                    <span>{new Date(job.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                <Badge variant={
                  job.status === 'approved' ? 'success' :
                  job.status === 'pending' ? 'warning' :
                  job.status === 'rejected' ? 'danger' : 'secondary'
                }>
                  {job.status === 'approved' ? 'Đã duyệt' :
                   job.status === 'pending' ? 'Chờ duyệt' :
                   job.status === 'rejected' ? 'Từ chối' :
                   job.status === 'draft' ? 'Nháp' : job.status}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {job.viewCount || 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

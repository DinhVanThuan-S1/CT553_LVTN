/**
 * EmployerDashboard - Tổng quan cho NTD
 * Thống kê nhanh: tin đăng, ứng viên, chờ duyệt, nháp
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import {
  Briefcase, Building2, Clock, CheckCircle2,
  Loader2, Eye, FileText, Plus, AlertTriangle,
  MapPin, Calendar, TrendingUp, ArrowRight, XCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

const STATUS_CONFIG = {
  approved: { label: 'Đã duyệt', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', dot: 'bg-emerald-500' },
  pending: { label: 'Chờ duyệt', cls: 'bg-amber-500/10  text-amber-600  border-amber-500/20', dot: 'bg-amber-500' },
  rejected: { label: 'Từ chối', cls: 'bg-red-500/10    text-red-600    border-red-500/20', dot: 'bg-red-500' },
  draft: { label: 'Nháp', cls: 'bg-muted         text-muted-foreground border-border/40', dot: 'bg-muted-foreground/40' },
};

const JOB_TYPE_LABELS = {
  'full-time': 'Full-time', 'part-time': 'Part-time',
  internship: 'Thực tập', freelance: 'Freelance', remote: 'Remote',
};

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
  const totalViews = jobs.reduce((sum, j) => sum + (j.viewCount || 0), 0);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-5">
        <div className="h-32 skeleton rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl from-teal-500/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Tổng Quan</span>
            </div>
            {/* <h1 className="text-2xl font-bold tracking-tight">Tổng Quan</h1> */}
            <p className="text-sm text-muted-foreground mt-0.5">
              {company ? company.name : 'Chưa thiết lập hồ sơ công ty'}
            </p>
          </div>
          <Link to="/employer/job-postings">
            <Button className="gap-2 shadow-md shadow-emerald-500/15">
              <Plus className="w-4 h-4" /> Đăng tin tuyển dụng
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Alert: no company ── */}
      {!company && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-700">Chưa thiết lập hồ sơ công ty</p>
            <p className="text-xs text-amber-600 mt-0.5">Vui lòng thiết lập hồ sơ công ty trước khi đăng tin tuyển dụng.</p>
          </div>
          <Link to="/employer/company">
            <Button variant="outline" size="sm" className="shrink-0 border-amber-500/30 text-amber-700 hover:bg-amber-500/10">
              Thiết lập ngay
            </Button>
          </Link>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={Briefcase} value={totalJobs} label="Tin đã đăng"
          iconCls="bg-primary/10 text-primary" valueCls="text-primary"
        />
        <StatCard
          icon={CheckCircle2} value={approvedJobs} label="Đã duyệt"
          iconCls="bg-emerald-500/10 text-emerald-600" valueCls="text-emerald-600"
        />
        <StatCard
          icon={Clock} value={pendingJobs} label="Chờ duyệt"
          iconCls="bg-amber-500/10 text-amber-600" valueCls="text-amber-600"
        />
        <StatCard
          icon={FileText} value={draftJobs} label="Nháp"
          iconCls="bg-sky-500/10 text-sky-600" valueCls=""
        />
      </div>

      {/* ── Extra stat: Total views ── */}
      {totalViews > 0 && (
        <div className="rounded-xl border bg-card px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Eye className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <span className="text-sm font-semibold">{totalViews}</span>
            <span className="text-sm text-muted-foreground"> lượt xem tổng cộng từ tất cả tin tuyển dụng</span>
          </div>
        </div>
      )}

      {/* ── Recent Jobs ── */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/20">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold">Tin tuyển dụng gần đây</h2>
            <p className="text-xs text-muted-foreground">{totalJobs} tin đã đăng</p>
          </div>
          <Link to="/employer/job-postings">
            <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">Chưa có tin tuyển dụng</p>
            <p className="text-xs text-muted-foreground mb-4">Bắt đầu đăng tin để tìm kiếm ứng viên phù hợp</p>
            <Link to="/employer/job-postings">
              <Button size="sm" className="gap-2"><Plus className="w-3.5 h-3.5" /> Đăng tin ngay</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {jobs.slice(0, 6).map((job) => {
              const st = STATUS_CONFIG[job.status] || STATUS_CONFIG.draft;
              return (
                <Link
                  key={job._id}
                  to="/employer/job-postings"
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors group"
                >
                  {/* Status dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm group-hover:text-primary transition-colors">{job.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span className="capitalize">{JOB_TYPE_LABELS[job.jobType] || job.jobType}</span>
                      {job.locationText && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" /> {job.locationText}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(job.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${st.cls}`}>
                    {job.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                    {job.status === 'pending' && <Clock className="w-3 h-3" />}
                    {job.status === 'rejected' && <XCircle className="w-3 h-3" />}
                    {st.label}
                  </span>

                  {/* Views */}
                  <span className="shrink-0 text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {job.viewCount || 0}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Company Profile prompt ── */}
      {company && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/20">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold">Hồ sơ công ty</h2>
              <p className="text-xs text-muted-foreground">{company.name}</p>
            </div>
            <Link to="/employer/company">
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
                Chỉnh sửa <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <CompanyInfo label="Ngành nghề" value={company.industry || '—'} />
            <CompanyInfo label="Quy mô" value={company.size ? `${company.size} nhân viên` : '—'} />
            <CompanyInfo label="Địa điểm" value={company.addresses?.[0]?.city || company.addresses?.[0]?.fullAddress || '—'} />
            <CompanyInfo label="Website" value={company.website || '—'} isLink={!!company.website} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, value, label, iconCls, valueCls }) {
  return (
    <div className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow group">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${iconCls}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <p className={`text-2xl font-bold ${valueCls}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function CompanyInfo({ label, value, isLink }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      {isLink ? (
        <a href={value} target="_blank" rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:underline truncate block">
          {value.replace(/^https?:\/\//, '')}
        </a>
      ) : (
        <p className="text-sm font-medium truncate">{value}</p>
      )}
    </div>
  );
}

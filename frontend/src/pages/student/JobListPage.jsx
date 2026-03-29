/**
 * JobListPage - Danh sách công việc
 * Browse jobs, search, filter
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  Search, Briefcase, MapPin, DollarSign, Clock, Eye, Heart,
  ChevronLeft, ChevronRight, Building2, Target,
} from 'lucide-react';

const jobTypeLabels = {
  'full-time': 'Toàn thời gian', 'part-time': 'Bán thời gian',
  'internship': 'Thực tập', 'freelance': 'Freelance', 'remote': 'Remote',
};

export default function JobListPage() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [favorites, setFavorites] = useState({});

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 12 };
      if (search) params.search = search;
      if (jobType) params.jobType = jobType;
      const { data } = await api.get('/jobs', { params });
      setJobs(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Không thể tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, jobType]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

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
    try {
      const { data } = await api.post('/student/favorites/toggle', {
        type: 'job', itemId: jobId,
      });
      setFavorites((prev) => ({ ...prev, [jobId]: data.added }));
      toast.success(data.message);
    } catch {
      toast.error('Có lỗi');
    }
  }

  function formatSalary(range) {
    if (!range || (!range.min && !range.max)) return 'Thỏa thuận';
    if (range.isNegotiable) return 'Thỏa thuận';
    return `${range.min} - ${range.max} triệu`;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Danh sách Công việc</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {pagination.total} công việc đang tuyển
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm công việc, hướng nghề nghiệp..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className="pl-9"
          />
        </div>
        <Select
          value={jobType}
          onChange={(e) => { setJobType(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
          className="w-40"
        >
          <option value="">Tất cả loại</option>
          {Object.entries(jobTypeLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>

      {/* Job Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <div className="h-5 w-40 skeleton mb-3" />
              <div className="h-4 w-56 skeleton mb-2" />
              <div className="h-3 w-32 skeleton" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Chưa có công việc nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div key={job._id} className="rounded-xl border bg-card p-5 card-hover group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      {job.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{job.company?.name || ''}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFavorite(job._id)}
                  className={`p-1 ${favorites[job._id] ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                >
                  <Heart className={`w-4 h-4 ${favorites[job._id] ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary">{jobTypeLabels[job.jobType]}</Badge>
                {job.careerPath && <Badge variant="default">{job.careerPath}</Badge>}
              </div>

              <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{formatSalary(job.salaryRange)}</span>
                </div>
                {job.locationText && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{job.locationText}</span>
                  </div>
                )}
                {job.deadline && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Hạn: {new Date(job.deadline).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={() => viewDetail(job)} className="w-full gap-2">
                <Eye className="w-4 h-4" /> Xem chi tiết
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={pagination.page <= 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {pagination.page}/{pagination.pages}
          </span>
          <Button variant="ghost" size="sm" disabled={pagination.page >= pagination.pages}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetail} onClose={() => setShowDetail(false)} className="max-w-2xl">
        <DialogHeader onClose={() => setShowDetail(false)}>
          Chi tiết Công việc
        </DialogHeader>
        {selectedJob && (
          <DialogBody className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">{selectedJob.title}</h3>
              <p className="text-muted-foreground mt-1">{selectedJob.company?.name}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{jobTypeLabels[selectedJob.jobType]}</Badge>
              <Badge variant="default">{selectedJob.careerPath}</Badge>
              <Badge variant="outline">{formatSalary(selectedJob.salaryRange)}</Badge>
            </div>

            {selectedJob.description && (
              <div>
                <h4 className="font-medium mb-1">Mô tả công việc</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
              </div>
            )}

            {selectedJob.requirements && (
              <div>
                <h4 className="font-medium mb-1">Yêu cầu</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.requirements}</p>
              </div>
            )}

            {selectedJob.benefits && (
              <div>
                <h4 className="font-medium mb-1">Quyền lợi</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.benefits}</p>
              </div>
            )}

            {selectedJob.requiredSkills?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Kỹ năng yêu cầu</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.requiredSkills.map((rs, i) => (
                    <Badge key={i} variant="default">
                      {rs.skill?.icon} {rs.skill?.name} ({rs.level})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
          <Button size="sm" className="gap-2">Ứng tuyển</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

/**
 * EmployerJobPostingsPage - Quản lý tin tuyển dụng
 * CRUD tin + gửi duyệt
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
  Briefcase, Plus, Pencil, Eye, Loader2, Clock,
  CheckCircle2, XCircle, Send, Calendar, MapPin, Users,
} from 'lucide-react';

const statusLabels = {
  draft: 'Nháp', pending: 'Chờ duyệt', approved: 'Đã duyệt',
  rejected: 'Từ chối', closed: 'Đã đóng',
};
const statusColors = {
  draft: 'secondary', pending: 'warning', approved: 'success',
  rejected: 'danger', closed: 'default',
};
const jobTypeLabels = {
  'full-time': 'Toàn thời gian', 'part-time': 'Bán thời gian',
  internship: 'Thực tập', freelance: 'Freelance', remote: 'Remote',
};

const emptyForm = {
  title: '', description: '', requirements: '', benefits: '',
  careerPath: '', jobType: 'full-time', locationText: '',
  vacancies: 1, experienceYears: 0,
  salaryRange: { min: 0, max: 0, isNegotiable: false },
  requiredSkills: [],
  deadline: '',
};

export default function EmployerJobPostingsPage() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [allSkills, setAllSkills] = useState([]);
  const [company, setCompany] = useState(null);

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

  function openCreate() {
    if (!company) {
      toast.error('Vui lòng thiết lập hồ sơ công ty trước');
      return;
    }
    setEditId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  }

  function openEdit(job) {
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
    setShowForm(true);
  }

  function toggleSkill(skillId) {
    setForm((f) => {
      const exists = f.requiredSkills.findIndex((rs) => rs.skill === skillId);
      if (exists >= 0) {
        return { ...f, requiredSkills: f.requiredSkills.filter((_, i) => i !== exists) };
      }
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
        toast.success('Cập nhật tin thành công');
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
          <h1 className="text-2xl font-bold">Tin tuyển dụng</h1>
          <p className="text-muted-foreground text-sm mt-1">{jobs.length} tin</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Đăng tin mới
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-1">Chưa có tin tuyển dụng</h3>
          <p className="text-sm text-muted-foreground mb-4">Đăng tin đầu tiên để bắt đầu tuyển dụng</p>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Đăng tin</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job._id} className="rounded-xl border bg-card p-4 flex items-center gap-4 card-hover">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{job.title}</h3>
                  <Badge variant={statusColors[job.status]} className="shrink-0">
                    {statusLabels[job.status]}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> {jobTypeLabels[job.jobType]}
                  </span>
                  {job.locationText && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {job.locationText}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {job.viewCount || 0} lượt xem
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(job.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
              {/* Salary */}
              <div className="text-right shrink-0">
                {job.salaryRange?.isNegotiable ? (
                  <p className="text-xs text-muted-foreground">Thỏa thuận</p>
                ) : job.salaryRange?.max > 0 ? (
                  <p className="text-sm font-medium">{job.salaryRange.min}-{job.salaryRange.max}M</p>
                ) : null}
              </div>
              {/* Edit button */}
              {['draft', 'rejected'].includes(job.status) && (
                <button onClick={() => openEdit(job)}
                  className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} className="max-w-3xl">
        <DialogHeader onClose={() => setShowForm(false)}>
          {editId ? 'Chỉnh sửa tin' : 'Đăng tin tuyển dụng mới'}
        </DialogHeader>
        <form onSubmit={(e) => handleSave(e, false)}>
          <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1 block">Tiêu đề *</label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Frontend Developer (React)" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Loại hình</label>
                <Select value={form.jobType} onChange={(e) => setForm((f) => ({ ...f, jobType: e.target.value }))}>
                  {Object.entries(jobTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Hướng nghề nghiệp</label>
                <Input value={form.careerPath} onChange={(e) => setForm((f) => ({ ...f, careerPath: e.target.value }))}
                  placeholder="VD: Frontend Developer" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Địa điểm</label>
                <Input value={form.locationText} onChange={(e) => setForm((f) => ({ ...f, locationText: e.target.value }))}
                  placeholder="VD: TP.HCM" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Số lượng tuyển</label>
                <Input type="number" value={form.vacancies}
                  onChange={(e) => setForm((f) => ({ ...f, vacancies: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Kinh nghiệm (năm)</label>
                <Input type="number" value={form.experienceYears}
                  onChange={(e) => setForm((f) => ({ ...f, experienceYears: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Hạn nộp</label>
                <Input type="date" value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>

            {/* Salary */}
            <div>
              <label className="text-sm font-medium mb-1 block">Mức lương (triệu VNĐ/tháng)</label>
              <div className="flex items-center gap-2">
                <Input type="number" placeholder="Từ" value={form.salaryRange.min}
                  onChange={(e) => setForm((f) => ({
                    ...f, salaryRange: { ...f.salaryRange, min: parseFloat(e.target.value) || 0 }
                  }))} />
                <span className="text-muted-foreground">—</span>
                <Input type="number" placeholder="Đến" value={form.salaryRange.max}
                  onChange={(e) => setForm((f) => ({
                    ...f, salaryRange: { ...f.salaryRange, max: parseFloat(e.target.value) || 0 }
                  }))} />
                <label className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                  <input type="checkbox" checked={form.salaryRange.isNegotiable}
                    onChange={(e) => setForm((f) => ({
                      ...f, salaryRange: { ...f.salaryRange, isNegotiable: e.target.checked }
                    }))} />
                  Thỏa thuận
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Mô tả công việc *</label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4} placeholder="Mô tả chi tiết công việc..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Yêu cầu ứng viên</label>
              <Textarea value={form.requirements} onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                rows={3} placeholder="Yêu cầu kinh nghiệm, học vấn..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Quyền lợi</label>
              <Textarea value={form.benefits} onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value }))}
                rows={3} placeholder="Lương, thưởng, bảo hiểm..." />
            </div>

            {/* Skills */}
            <div>
              <label className="text-sm font-medium mb-1 block">Kỹ năng yêu cầu ({form.requiredSkills.length})</label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-lg border bg-muted/10">
                {allSkills.map((skill) => {
                  const selected = form.requiredSkills.some((rs) => rs.skill === skill._id);
                  return (
                    <button key={skill._id} type="button" onClick={() => toggleSkill(skill._id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        selected ? 'bg-primary text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}>
                      {skill.icon} {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button type="submit" variant="outline" size="sm" disabled={saving}>
              Lưu nháp
            </Button>
            <Button type="button" size="sm" disabled={saving} className="gap-1"
              onClick={(e) => handleSave(e, true)}>
              <Send className="w-3.5 h-3.5" /> Gửi duyệt
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

/**
 * CVPage - Quản lý CV sinh viên
 * Tạo, sửa, xóa CV + chọn mặc định
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  FileText, Plus, Pencil, Trash2, Star, Loader2, Eye,
  Briefcase, GraduationCap, Award, FolderOpen, X, CheckCircle2,
  Route, User, Shield,
} from 'lucide-react';

const emptyCV = {
  title: '', headline: '', summary: '',
  skills: [],
  experiences: [],
  projects: [],
  certifications: [],
  education: { university: 'Trường Đại học Cần Thơ', major: '', gpa: 0, graduationYear: new Date().getFullYear() + 1 },
};

export default function CVPage() {
  const toast = useToast();
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailCV, setDetailCV] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...emptyCV });
  const [saving, setSaving] = useState(false);
  const [allSkills, setAllSkills] = useState([]);
  const [cvSkills, setCvSkills] = useState({ verified: [], unverified: [], roadmap: [], academic: [] });
  const [completedSkills, setCompletedSkills] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cvRes, skillRes, completedRes, cvSkillsRes] = await Promise.all([
        api.get('/student/cvs'),
        api.get('/skills/all'),
        api.get('/student/completed-skills'),
        api.get('/student/skills/for-cv'),
      ]);
      setCvs(cvRes.data.data);
      setAllSkills(skillRes.data.data);
      setCompletedSkills((completedRes.data.data || []).map(s => s._id));
      setCvSkills(cvSkillsRes.data.data || { verified: [], unverified: [], roadmap: [], academic: [] });
    } catch {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyCV });
    setShowForm(true);
  }

  function openEdit(cv) {
    setEditId(cv._id);
    setForm({
      title: cv.title || '',
      headline: cv.headline || '',
      summary: cv.summary || '',
      skills: (cv.skills || []).map((s) => s._id || s),
      experiences: cv.experiences || [],
      projects: cv.projects || [],
      certifications: cv.certifications || [],
      education: cv.education || emptyCV.education,
    });
    setShowForm(true);
  }

  async function openDetail(cv) {
    try {
      const { data } = await api.get(`/student/cvs/${cv._id}`);
      setDetailCV(data.data);
      setShowDetail(true);
    } catch {
      toast.error('Không thể tải CV');
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Tên CV không được trống'); return; }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/student/cvs/${editId}`, form);
        toast.success('Cập nhật CV thành công');
      } else {
        await api.post('/student/cvs', form);
        toast.success('Tạo CV thành công');
      }
      setShowForm(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cvId) {
    if (!confirm('Xóa CV này?')) return;
    try {
      await api.delete(`/student/cvs/${cvId}`);
      toast.success('Đã xóa CV');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi');
    }
  }

  async function handleSetDefault(cvId) {
    try {
      await api.patch(`/student/cvs/${cvId}/default`);
      toast.success('Đã đặt CV mặc định');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi');
    }
  }

  // Experience management
  function addExperience() {
    setForm((f) => ({
      ...f,
      experiences: [...f.experiences, { company: '', position: '', startDate: '', endDate: '', isCurrent: false, description: '' }],
    }));
  }
  function removeExperience(i) {
    setForm((f) => ({ ...f, experiences: f.experiences.filter((_, idx) => idx !== i) }));
  }
  function updateExperience(i, field, value) {
    setForm((f) => ({
      ...f,
      experiences: f.experiences.map((exp, idx) => idx === i ? { ...exp, [field]: value } : exp),
    }));
  }

  // Project management
  function addProject() {
    setForm((f) => ({
      ...f,
      projects: [...f.projects, { name: '', description: '', technologies: [], url: '' }],
    }));
  }
  function removeProject(i) {
    setForm((f) => ({ ...f, projects: f.projects.filter((_, idx) => idx !== i) }));
  }
  function updateProject(i, field, value) {
    setForm((f) => ({
      ...f,
      projects: f.projects.map((p, idx) => idx === i ? { ...p, [field]: value } : p),
    }));
  }

  function toggleSkill(skillId) {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skillId)
        ? f.skills.filter((s) => s !== skillId)
        : [...f.skills, skillId],
    }));
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
          <h1 className="text-2xl font-bold">CV Của Tôi</h1>
          <p className="text-muted-foreground text-sm mt-1">{cvs.length} CV • ứng tuyển công việc với CV phù hợp</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Tạo CV mới
        </Button>
      </div>

      {cvs.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <FileText className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-1">Chưa có CV nào</h3>
          <p className="text-sm text-muted-foreground mb-4">Tạo CV đầu tiên để bắt đầu ứng tuyển</p>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Tạo CV
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cvs.map((cv) => (
            <div key={cv._id} className="rounded-xl border bg-card p-5 card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">{cv.title}</h3>
                </div>
                {cv.isDefault && <Badge variant="success" className="text-[10px]">Mặc định</Badge>}
              </div>
              {cv.headline && <p className="text-sm text-muted-foreground mb-2">{cv.headline}</p>}
              <div className="flex flex-wrap gap-1 mb-3">
                {(cv.skills || []).slice(0, 4).map((s) => {
                  const isRoadmap = cvSkills.roadmap.some(v => (v.skill?._id || v.skill) === s._id);
                  const isAcademic = cvSkills.academic.some(v => (v.skill?._id || v.skill) === s._id);
                  const isVerified = isRoadmap || isAcademic;
                  return (
                    <Badge key={s._id}
                      variant={isVerified ? 'default' : 'secondary'}
                      className={`text-[10px] ${
                        isRoadmap ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                        : isAcademic ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                        : ''
                      }`}>
                      {isRoadmap && <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />}
                      {isAcademic && <GraduationCap className="w-2.5 h-2.5 mr-0.5" />}
                      {s.icon} {s.name}
                    </Badge>
                  );
                })}
                {(cv.skills || []).length > 4 && (
                  <Badge variant="secondary" className="text-[10px]">+{cv.skills.length - 4}</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                {cv.experiences?.length || 0} kinh nghiệm • {cv.projects?.length || 0} dự án
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openDetail(cv)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => openEdit(cv)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Pencil className="w-4 h-4" />
                </button>
                {!cv.isDefault && (
                  <button onClick={() => handleSetDefault(cv._id)}
                    className="p-1.5 rounded-md hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 transition-colors"
                    title="Đặt mặc định">
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <div className="flex-1" />
                <button onClick={() => handleDelete(cv._id)}
                  className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetail} onClose={() => setShowDetail(false)} className="max-w-2xl">
        <DialogHeader onClose={() => setShowDetail(false)}>
          {detailCV?.title}
          {detailCV?.isDefault && <Badge variant="success" className="ml-2 text-[10px]">Mặc định</Badge>}
        </DialogHeader>
        {detailCV && (
          <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
            {detailCV.headline && <p className="text-sm font-medium">{detailCV.headline}</p>}
            {detailCV.summary && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Giới thiệu</h4>
                <p className="text-sm">{detailCV.summary}</p>
              </div>
            )}
            {detailCV.skills?.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-3">
                  Kỹ năng
                  <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Lộ trình (100%)
                  </span>
                  <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                    <GraduationCap className="w-3 h-3" /> Học phần (điểm cao)
                  </span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {detailCV.skills.map((s) => {
                    const isRoadmap = cvSkills.roadmap.some(v => (v.skill?._id || v.skill) === s._id);
                    const isAcademic = cvSkills.academic.some(v => (v.skill?._id || v.skill) === s._id);
                    const isVerified = isRoadmap || isAcademic;
                    return (
                      <Badge key={s._id}
                        variant={isVerified ? 'default' : 'secondary'}
                        className={`${
                          isRoadmap ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/40'
                          : isAcademic ? 'bg-amber-500/15 text-amber-700 border border-amber-500/40'
                          : ''
                        }`}>
                        {isRoadmap && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {isAcademic && <GraduationCap className="w-3 h-3 mr-1" />}
                        {s.icon} {s.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
            {detailCV.education && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" /> Học vấn
                </h4>
                <p className="text-sm">{detailCV.education.university}</p>
                <p className="text-xs text-muted-foreground">
                  {detailCV.education.major} {detailCV.education.gpa > 0 && `• GPA: ${detailCV.education.gpa}`}
                </p>
              </div>
            )}
            {detailCV.experiences?.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" /> Kinh nghiệm
                </h4>
                {detailCV.experiences.map((exp, i) => (
                  <div key={i} className="border-l-2 border-primary/20 pl-3 mb-2">
                    <p className="text-sm font-medium">{exp.position}</p>
                    <p className="text-xs text-muted-foreground">{exp.company}</p>
                    {exp.description && <p className="text-xs mt-1">{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}
            {detailCV.projects?.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <FolderOpen className="w-3.5 h-3.5" /> Dự án
                </h4>
                {detailCV.projects.map((proj, i) => (
                  <div key={i} className="border-l-2 border-primary/20 pl-3 mb-2">
                    <p className="text-sm font-medium">{proj.name}</p>
                    {proj.description && <p className="text-xs">{proj.description}</p>}
                    {proj.technologies?.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {proj.technologies.map((t, j) => (
                          <Badge key={j} variant="secondary" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
        </DialogFooter>
      </Dialog>

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} className="max-w-3xl">
        <DialogHeader onClose={() => setShowForm(false)}>
          {editId ? 'Chỉnh sửa CV' : 'Tạo CV mới'}
        </DialogHeader>
        <form onSubmit={handleSave}>
          <DialogBody className="space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Tên CV *</label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="VD: CV Frontend Developer" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tiêu đề nghề nghiệp</label>
                <Input value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                  placeholder="VD: Frontend Developer" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Giới thiệu bản thân</label>
              <Textarea value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                rows={3} placeholder="Tóm tắt kinh nghiệm, mục tiêu nghề nghiệp..." />
            </div>

            {/* Education */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <GraduationCap className="w-4 h-4" /> Học vấn
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Input value={form.education.university}
                  onChange={(e) => setForm((f) => ({ ...f, education: { ...f.education, university: e.target.value } }))}
                  placeholder="Trường" className="col-span-2" />
                <Input value={form.education.major}
                  onChange={(e) => setForm((f) => ({ ...f, education: { ...f.education, major: e.target.value } }))}
                  placeholder="Ngành" />
                <Input type="number" step="0.01" value={form.education.gpa || ''}
                  onChange={(e) => setForm((f) => ({ ...f, education: { ...f.education, gpa: parseFloat(e.target.value) || 0 } }))}
                  placeholder="GPA" />
              </div>
            </div>

            {/* Skills picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Kỹ năng ({form.skills.length} đã chọn)</h4>
                <div className="flex gap-1.5">
                  {cvSkills.verified.length > 0 && (
                    <Button type="button" variant="outline" size="sm" className="text-xs gap-1"
                      onClick={() => {
                        const newSkills = new Set(form.skills);
                        cvSkills.verified.forEach(v => {
                          const id = v.skill?._id || v.skill;
                          if (id) newSkills.add(id);
                        });
                        setForm(f => ({ ...f, skills: [...newSkills] }));
                        toast.success(`Đã thêm ${cvSkills.verified.length} kỹ năng xác thực`);
                      }}>
                      <Shield className="w-3 h-3" /> Thêm KN xác thực
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 rounded-lg border bg-muted/10">
                {allSkills.map((skill) => {
                  const isRoadmap = cvSkills.roadmap.some(v => (v.skill?._id || v.skill) === skill._id);
                  const isAcademic = cvSkills.academic.some(v => (v.skill?._id || v.skill) === skill._id);
                  const isSelf = cvSkills.unverified.some(v => (v.skill?._id || v.skill) === skill._id);
                  const isSelected = form.skills.includes(skill._id);
                  return (
                    <button key={skill._id} type="button" onClick={() => toggleSkill(skill._id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${isSelected
                        ? 'bg-primary text-white'
                        : isRoadmap
                          ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 hover:bg-emerald-500/20'
                          : isAcademic
                            ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30 hover:bg-amber-500/20'
                            : isSelf
                              ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20'
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}>
                      {skill.icon} {skill.name}
                      {isRoadmap && !isSelected && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      {isAcademic && !isSelected && <GraduationCap className="w-3 h-3 text-amber-500" />}
                      {isSelf && !isSelected && <User className="w-3 h-3 text-blue-500" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Lộ trình (100%)
                </p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <GraduationCap className="w-3 h-3 text-amber-500" /> Học phần (điểm cao)
                </p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <User className="w-3 h-3 text-blue-500" /> Tự khai báo
                </p>
              </div>
            </div>

            {/* Experiences */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Briefcase className="w-4 h-4" /> Kinh nghiệm ({form.experiences.length})
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={addExperience} className="text-xs gap-1">
                  <Plus className="w-3 h-3" /> Thêm
                </Button>
              </div>
              {form.experiences.map((exp, i) => (
                <div key={i} className="border rounded-lg p-3 mb-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Kinh nghiệm #{i + 1}</span>
                    <button type="button" onClick={() => removeExperience(i)} className="text-red-400 hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={exp.position} onChange={(e) => updateExperience(i, 'position', e.target.value)}
                      placeholder="Vị trí" />
                    <Input value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)}
                      placeholder="Công ty" />
                  </div>
                  <Textarea value={exp.description} onChange={(e) => updateExperience(i, 'description', e.target.value)}
                    rows={2} placeholder="Mô tả công việc..." />
                </div>
              ))}
            </div>

            {/* Projects */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <FolderOpen className="w-4 h-4" /> Dự án ({form.projects.length})
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={addProject} className="text-xs gap-1">
                  <Plus className="w-3 h-3" /> Thêm
                </Button>
              </div>
              {form.projects.map((proj, i) => (
                <div key={i} className="border rounded-lg p-3 mb-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Dự án #{i + 1}</span>
                    <button type="button" onClick={() => removeProject(i)} className="text-red-400 hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Input value={proj.name} onChange={(e) => updateProject(i, 'name', e.target.value)}
                    placeholder="Tên dự án" />
                  <Textarea value={proj.description} onChange={(e) => updateProject(i, 'description', e.target.value)}
                    rows={2} placeholder="Mô tả dự án..." />
                  <Input value={(proj.technologies || []).join(', ')}
                    onChange={(e) => updateProject(i, 'technologies', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
                    placeholder="Công nghệ (cách nhau bằng dấu phẩy)" />
                </div>
              ))}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Đang lưu...' : editId ? 'Cập nhật' : 'Tạo CV'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

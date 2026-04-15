/**
 * CVPage - Quản lý CV sinh viên
 * Tạo, sửa, xóa CV + chọn mặc định
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import {
  FileText, Plus, Pencil, Trash2, Star, Loader2, Eye,
  Briefcase, GraduationCap, FolderOpen, X, CheckCircle2,
  User, Shield, Sparkles, BookOpen,
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
  const [confirmState, setConfirmState] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [cvSkills, setCvSkills] = useState({ verified: [], unverified: [], roadmap: [], academic: [] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cvRes, skillRes, cvSkillsRes] = await Promise.all([
        api.get('/student/cvs'),
        api.get('/skills/all'),
        api.get('/student/skills/for-cv'),
      ]);
      setCvs(cvRes.data.data);
      setAllSkills(skillRes.data.data);
      setCvSkills(cvSkillsRes.data.data || { verified: [], unverified: [], roadmap: [], academic: [] });
    } catch {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditId(null); setForm({ ...emptyCV }); setShowForm(true); }

  function openEdit(cv) {
    setEditId(cv._id);
    setForm({
      title: cv.title || '', headline: cv.headline || '', summary: cv.summary || '',
      skills: (cv.skills || []).map(s => s._id || s),
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
    } catch { toast.error('Không thể tải CV'); }
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
    } finally { setSaving(false); }
  }

  function handleDelete(cvId) {
    setConfirmState({
      title: 'Xóa CV', message: 'Bạn có chắc muốn xóa CV này?',
      confirmLabel: 'Xóa', variant: 'danger',
      onConfirm: async () => {
        try { await api.delete(`/student/cvs/${cvId}`); toast.success('Đã xóa CV'); load(); }
        catch (error) { toast.error(error.response?.data?.message || 'Có lỗi'); }
      },
    });
  }

  async function handleSetDefault(cvId) {
    try { await api.patch(`/student/cvs/${cvId}/default`); toast.success('Đã đặt CV mặc định'); load(); }
    catch (error) { toast.error(error.response?.data?.message || 'Có lỗi'); }
  }

  function addExperience() {
    setForm(f => ({ ...f, experiences: [...f.experiences, { company: '', position: '', startDate: '', endDate: '', isCurrent: false, description: '' }] }));
  }
  function removeExperience(i) { setForm(f => ({ ...f, experiences: f.experiences.filter((_, idx) => idx !== i) })); }
  function updateExperience(i, field, value) {
    setForm(f => ({ ...f, experiences: f.experiences.map((exp, idx) => idx === i ? { ...exp, [field]: value } : exp) }));
  }

  function addProject() {
    setForm(f => ({ ...f, projects: [...f.projects, { name: '', description: '', technologies: [], url: '' }] }));
  }
  function removeProject(i) { setForm(f => ({ ...f, projects: f.projects.filter((_, idx) => idx !== i) })); }
  function updateProject(i, field, value) {
    setForm(f => ({ ...f, projects: f.projects.map((p, idx) => idx === i ? { ...p, [field]: value } : p) }));
  }

  function toggleSkill(skillId) {
    setForm(f => ({ ...f, skills: f.skills.includes(skillId) ? f.skills.filter(s => s !== skillId) : [...f.skills, skillId] }));
  }

  // Helper: get skill badge style
  function getSkillStyle(skillId, selected) {
    if (selected) return 'bg-primary text-white shadow-sm';
    const isRoadmap = cvSkills.roadmap.some(v => (v.skill?._id || v.skill) === skillId);
    const isAcademic = cvSkills.academic.some(v => (v.skill?._id || v.skill) === skillId);
    const isSelf = cvSkills.unverified.some(v => (v.skill?._id || v.skill) === skillId);
    if (isRoadmap) return 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 hover:bg-emerald-500/20';
    if (isAcademic) return 'bg-amber-500/10 text-amber-700 border border-amber-500/30 hover:bg-amber-500/20';
    if (isSelf) return 'bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20';
    return 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent';
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="h-32 skeleton rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 skeleton rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl from-sky-500/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">My CV</span>
            </div>
            {/* <h1 className="text-2xl md:text-3xl font-bold tracking-tight">CV Của Tôi</h1> */}
            <p className="text-muted-foreground text-sm mt-1.5">
              {cvs.length} CV - Hãy chọn CV phù hợp để ứng tuyển
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 shadow-md">
            <Plus className="w-4 h-4" /> Tạo CV mới
          </Button>
        </div>
      </div>

      {/* ── CV Cards ── */}
      {cvs.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Chưa có CV nào</h3>
          <p className="text-sm text-muted-foreground mb-4">Tạo CV đầu tiên để bắt đầu ứng tuyển</p>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Tạo CV</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cvs.map(cv => {
            const skillCount = cv.skills?.length || 0;
            const verifiedCount = (cv.skills || []).filter(s =>
              cvSkills.roadmap.some(v => (v.skill?._id || v.skill) === s._id) ||
              cvSkills.academic.some(v => (v.skill?._id || v.skill) === s._id)
            ).length;
            return (
              <div key={cv._id} className="group relative rounded-xl border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden">
                {/* accent strip */}
                <div className={`h-1 ${cv.isDefault ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-primary/60 to-sky-500/40'}`} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-sm leading-snug truncate group-hover:text-primary transition-colors">{cv.title}</h3>
                          {cv.isDefault && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-400/30 shrink-0">Mặc định</span>
                          )}
                        </div>
                        {cv.headline && <p className="text-xs text-muted-foreground truncate mt-0.5">{cv.headline}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Skill preview pills */}
                  {skillCount > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(cv.skills || []).slice(0, 4).map(s => {
                        const isRoadmap = cvSkills.roadmap.some(v => (v.skill?._id || v.skill) === s._id);
                        const isAcademic = cvSkills.academic.some(v => (v.skill?._id || v.skill) === s._id);
                        return (
                          <span key={s._id} className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${isRoadmap ? 'bg-emerald-500/10 text-emerald-700 border-emerald-400/30'
                            : isAcademic ? 'bg-amber-500/10 text-amber-700 border-amber-400/30'
                              : 'bg-muted text-muted-foreground border-transparent'
                            }`}>
                            {isRoadmap && <CheckCircle2 className="w-2.5 h-2.5" />}
                            {isAcademic && <GraduationCap className="w-2.5 h-2.5" />}
                            {s.icon} {s.name}
                          </span>
                        );
                      })}
                      {skillCount > 4 && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">+{skillCount - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> {cv.experiences?.length || 0} KN
                    </span>
                    <span className="flex items-center gap-1">
                      <FolderOpen className="w-3 h-3" /> {cv.projects?.length || 0} dự án
                    </span>
                    {verifiedCount > 0 && (
                      <span className="flex items-center gap-1 text-emerald-600 ml-auto">
                        <CheckCircle2 className="w-3 h-3" /> {verifiedCount} xác thực
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-3 border-t border-border/50">
                    <button onClick={() => openDetail(cv)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                      <Eye className="w-3.5 h-3.5" /> Xem
                    </button>
                    <button onClick={() => openEdit(cv)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                      <Pencil className="w-3.5 h-3.5" /> Sửa
                    </button>
                    {!cv.isDefault && (
                      <button onClick={() => handleSetDefault(cv._id)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
                        title="Đặt mặc định">
                        <Star className="w-3.5 h-3.5" /> Mặc định
                      </button>
                    )}
                    <div className="flex-1" />
                    <button onClick={() => handleDelete(cv._id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail Dialog ── */}
      <Dialog open={showDetail} onClose={() => setShowDetail(false)} className="max-w-2xl">
        <DialogHeader onClose={() => setShowDetail(false)}>
          {detailCV?.title}
          {detailCV?.isDefault && (
            <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-400/30">Mặc định</span>
          )}
        </DialogHeader>
        {detailCV && (
          <DialogBody className="p-0 max-h-[75vh] overflow-y-auto">
            {/* Hero */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5 border-b">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-card border shadow-sm flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold">{detailCV.title}</p>
                  {detailCV.headline && <p className="text-sm text-muted-foreground">{detailCV.headline}</p>}
                </div>
              </div>
              {detailCV.summary && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{detailCV.summary}</p>}
            </div>

            <div className="p-6 space-y-5">
              {/* Skills */}
              {detailCV.skills?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-primary inline-block" />
                    Kỹ năng
                    <span className="ml-auto text-[10px] font-normal text-muted-foreground flex items-center gap-2">
                      <span className="flex items-center gap-0.5 text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Lộ trình</span>
                      <span className="flex items-center gap-0.5 text-amber-600"><GraduationCap className="w-3 h-3" /> Học phần</span>
                    </span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pl-3">
                    {detailCV.skills.map(s => {
                      const isRoadmap = cvSkills.roadmap.some(v => (v.skill?._id || v.skill) === s._id);
                      const isAcademic = cvSkills.academic.some(v => (v.skill?._id || v.skill) === s._id);
                      return (
                        <span key={s._id} className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${isRoadmap ? 'bg-emerald-500/10 text-emerald-700 border-emerald-400/30'
                          : isAcademic ? 'bg-amber-500/10 text-amber-700 border-amber-400/30'
                            : 'bg-muted text-muted-foreground border-transparent'
                          }`}>
                          {isRoadmap && <CheckCircle2 className="w-3 h-3" />}
                          {isAcademic && <GraduationCap className="w-3 h-3" />}
                          {s.icon} {s.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Education */}
              {detailCV.education && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-primary inline-block" />
                    Học vấn
                  </h4>
                  <div className="pl-3 border-l-2 border-primary/20">
                    <p className="text-sm font-medium">{detailCV.education.university}</p>
                    <p className="text-xs text-muted-foreground">
                      {detailCV.education.major}
                      {detailCV.education.gpa > 0 && ` · GPA: ${detailCV.education.gpa}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Experiences */}
              {detailCV.experiences?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-primary inline-block" />
                    Kinh nghiệm
                  </h4>
                  <div className="pl-3 space-y-3">
                    {detailCV.experiences.map((exp, i) => (
                      <div key={i} className="border-l-2 border-primary/20 pl-3">
                        <p className="text-sm font-medium">{exp.position}</p>
                        <p className="text-xs text-muted-foreground">{exp.company}</p>
                        {exp.description && <p className="text-xs mt-1 text-muted-foreground leading-relaxed">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {detailCV.projects?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-primary inline-block" />
                    Dự án
                  </h4>
                  <div className="pl-3 space-y-3">
                    {detailCV.projects.map((proj, i) => (
                      <div key={i} className="border-l-2 border-primary/20 pl-3">
                        <p className="text-sm font-medium">{proj.name}</p>
                        {proj.description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{proj.description}</p>}
                        {proj.technologies?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {proj.technologies.map((t, j) => (
                              <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
          <Button size="sm" className="gap-1.5" onClick={() => { setShowDetail(false); openEdit(detailCV); }}>
            <Pencil className="w-4 h-4" /> Chỉnh sửa
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ── Create/Edit Form Dialog ── */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} className="max-w-3xl">
        <DialogHeader onClose={() => setShowForm(false)}>
          {editId ? 'Chỉnh sửa CV' : 'Tạo CV mới'}
        </DialogHeader>
        <form onSubmit={handleSave}>
          <DialogBody className="space-y-6 max-h-[72vh] overflow-y-auto">

            {/* ── Thông tin cơ bản ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-sm">Thông tin cơ bản</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Tên CV *</label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="VD: CV Frontend Developer" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Tiêu đề nghề nghiệp</label>
                  <Input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
                    placeholder="VD: Frontend Developer" />
                </div>
              </div>
              <div className="pl-6">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Giới thiệu bản thân</label>
                <Textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                  rows={3} placeholder="Tóm tắt kinh nghiệm, mục tiêu nghề nghiệp..." />
              </div>
            </div>

            <div className="border-t border-border/50" />

            {/* ── Học vấn ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-500" />
                <h4 className="font-semibold text-sm">Học vấn</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-6">
                <Input value={form.education.university}
                  onChange={e => setForm(f => ({ ...f, education: { ...f.education, university: e.target.value } }))}
                  placeholder="Trường" className="col-span-2" />
                <Input value={form.education.major}
                  onChange={e => setForm(f => ({ ...f, education: { ...f.education, major: e.target.value } }))}
                  placeholder="Ngành" />
                <Input type="number" step="0.01" value={form.education.gpa || ''}
                  onChange={e => setForm(f => ({ ...f, education: { ...f.education, gpa: parseFloat(e.target.value) || 0 } }))}
                  placeholder="GPA" />
              </div>
            </div>

            <div className="border-t border-border/50" />

            {/* ── Kỹ năng ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">Kỹ năng <span className="text-muted-foreground font-normal">({form.skills.length} đã chọn)</span></h4>
                </div>
                {cvSkills.verified.length > 0 && (
                  <Button type="button" variant="outline" size="sm" className="text-xs gap-1.5"
                    onClick={() => {
                      const newSkills = new Set(form.skills);
                      cvSkills.verified.forEach(v => { const id = v.skill?._id || v.skill; if (id) newSkills.add(id); });
                      setForm(f => ({ ...f, skills: [...newSkills] }));
                      toast.success(`Đã thêm ${cvSkills.verified.length} kỹ năng xác thực`);
                    }}>
                    <Shield className="w-3 h-3" /> Thêm KN xác thực
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-3 rounded-xl border bg-muted/10">
                {allSkills.map(skill => {
                  const isSelected = form.skills.includes(skill._id);
                  const isRoadmap = cvSkills.roadmap.some(v => (v.skill?._id || v.skill) === skill._id);
                  const isAcademic = cvSkills.academic.some(v => (v.skill?._id || v.skill) === skill._id);
                  const isSelf = cvSkills.unverified.some(v => (v.skill?._id || v.skill) === skill._id);
                  return (
                    <button key={skill._id} type="button" onClick={() => toggleSkill(skill._id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${getSkillStyle(skill._id, isSelected)}`}>
                      {skill.icon} {skill.name}
                      {!isSelected && isRoadmap && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      {!isSelected && isAcademic && <GraduationCap className="w-3 h-3 text-amber-500" />}
                      {!isSelected && isSelf && <User className="w-3 h-3 text-blue-500" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Lộ trình (100%)</span>
                <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3 text-amber-500" /> Học phần (điểm cao)</span>
                <span className="flex items-center gap-1"><User className="w-3 h-3 text-blue-500" /> Tự khai báo</span>
              </div>
            </div>

            <div className="border-t border-border/50" />

            {/* ── Kinh nghiệm ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  <h4 className="font-semibold text-sm">Kinh nghiệm <span className="text-muted-foreground font-normal">({form.experiences.length})</span></h4>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addExperience} className="text-xs gap-1">
                  <Plus className="w-3 h-3" /> Thêm
                </Button>
              </div>
              {form.experiences.map((exp, i) => (
                <div key={i} className="rounded-xl border bg-muted/10 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Kinh nghiệm #{i + 1}</span>
                    <button type="button" onClick={() => removeExperience(i)}
                      className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={exp.position} onChange={e => updateExperience(i, 'position', e.target.value)} placeholder="Vị trí" />
                    <Input value={exp.company} onChange={e => updateExperience(i, 'company', e.target.value)} placeholder="Công ty" />
                  </div>
                  <Textarea value={exp.description} onChange={e => updateExperience(i, 'description', e.target.value)}
                    rows={2} placeholder="Mô tả công việc..." />
                </div>
              ))}
            </div>

            <div className="border-t border-border/50" />

            {/* ── Dự án ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-violet-500" />
                  <h4 className="font-semibold text-sm">Dự án <span className="text-muted-foreground font-normal">({form.projects.length})</span></h4>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addProject} className="text-xs gap-1">
                  <Plus className="w-3 h-3" /> Thêm
                </Button>
              </div>
              {form.projects.map((proj, i) => (
                <div key={i} className="rounded-xl border bg-muted/10 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Dự án #{i + 1}</span>
                    <button type="button" onClick={() => removeProject(i)}
                      className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Input value={proj.name} onChange={e => updateProject(i, 'name', e.target.value)} placeholder="Tên dự án" />
                  <Textarea value={proj.description} onChange={e => updateProject(i, 'description', e.target.value)}
                    rows={2} placeholder="Mô tả dự án..." />
                  <Input value={(proj.technologies || []).join(', ')}
                    onChange={e => updateProject(i, 'technologies', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                    placeholder="Công nghệ (cách nhau bằng dấu phẩy)" />
                </div>
              ))}
            </div>

          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button type="submit" size="sm" disabled={saving} className="gap-1.5 min-w-[100px]">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : editId ? 'Cập nhật' : 'Tạo CV'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}

/**
 * RoadmapManagement - QL Lộ trình mẫu (Admin)
 * CRUD lộ trình mẫu, chọn kỹ năng, gắn công việc liên quan
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  Search, Plus, Pencil, Trash2, Eye, Route,
  ChevronLeft, ChevronRight, Clock, Users, Star,
  GripVertical, X, ArrowUp, ArrowDown, SlidersHorizontal, ChevronDown,
} from 'lucide-react';

const difficultyLabels = { beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' };
const difficultyColors = {
  beginner: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-400/20' },
  intermediate: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-400/20' },
  advanced: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-400/20' },
};
const levelLabels = { beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' };

function DifficultyBadge({ difficulty }) {
  const label = difficultyLabels[difficulty] || difficulty;
  const c = difficultyColors[difficulty] || difficultyColors.intermediate;
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
      {label}
    </span>
  );
}

const initialForm = {
  title: '', description: '', careerPath: '', thumbnail: '',
  estimatedMonths: 6, difficulty: 'intermediate', skills: [],
};

export default function RoadmapManagement() {
  const toast = useToast();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 15 });
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailRoadmap, setDetailRoadmap] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [showDiffMenu, setShowDiffMenu] = useState(false);
  const diffMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (diffMenuRef.current && !diffMenuRef.current.contains(e.target)) setShowDiffMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadRoadmaps = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (filterDifficulty) params.difficulty = filterDifficulty;
      const { data } = await api.get('/roadmaps', { params });
      setRoadmaps(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Không thể tải danh sách lộ trình');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, filterDifficulty]);

  useEffect(() => { loadRoadmaps(); }, [loadRoadmaps]);

  async function loadAllSkills() {
    if (allSkills.length > 0) return;
    try {
      const { data } = await api.get('/skills', { params: { limit: 200 } });
      setAllSkills(data.data);
    } catch { }
  }

  async function openDetail(roadmap) {
    try {
      const { data } = await api.get(`/roadmaps/${roadmap._id}`);
      setDetailRoadmap(data.data);
      setShowDetail(true);
    } catch {
      toast.error('Không thể tải chi tiết');
    }
  }

  function openCreate() {
    loadAllSkills();
    setFormData(initialForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(roadmap) {
    loadAllSkills();
    setFormData({
      title: roadmap.title,
      description: roadmap.description || '',
      careerPath: roadmap.careerPath,
      thumbnail: roadmap.thumbnail || '',
      estimatedMonths: roadmap.estimatedMonths || 6,
      difficulty: roadmap.difficulty || 'intermediate',
      skills: (roadmap.skills || []).map((s) => ({
        skill: s.skill?._id || s.skill,
        skillName: s.skill?.name || '',
        order: s.order,
        estimatedHours: s.estimatedHours || 20,
        targetLevel: s.targetLevel || 'intermediate',
      })),
    });
    setEditingId(roadmap._id);
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        estimatedMonths: Number(formData.estimatedMonths),
        skills: formData.skills.map((s, i) => ({
          skill: s.skill,
          order: i + 1,
          estimatedHours: Number(s.estimatedHours),
          targetLevel: s.targetLevel,
        })),
      };
      if (editingId) {
        await api.put(`/roadmaps/${editingId}`, payload);
        toast.success('Cập nhật lộ trình thành công');
      } else {
        await api.post('/roadmaps', payload);
        toast.success('Tạo lộ trình thành công');
      }
      setShowForm(false);
      loadRoadmaps();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(rm) {
    setConfirmState({
      title: 'Xóa lộ trình',
      message: `Bạn có chắc muốn xóa lộ trình “${rm.title}”?`,
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        await api.delete(`/roadmaps/${rm._id}`);
        toast.success('Đã xóa lộ trình');
        loadRoadmaps();
      },
    });
  }

  // Skill management in form
  function addSkillToForm(skillId) {
    if (formData.skills.some((s) => s.skill === skillId)) return;
    const skill = allSkills.find((s) => s._id === skillId);
    if (!skill) return;
    setFormData((f) => ({
      ...f,
      skills: [...f.skills, {
        skill: skill._id,
        skillName: skill.name,
        order: f.skills.length + 1,
        estimatedHours: skill.estimatedHours || 20,
        targetLevel: 'intermediate',
      }],
    }));
  }

  function removeSkillFromForm(index) {
    setFormData((f) => ({ ...f, skills: f.skills.filter((_, i) => i !== index) }));
  }

  function moveSkill(index, direction) {
    const newSkills = [...formData.skills];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newSkills.length) return;
    [newSkills[index], newSkills[newIndex]] = [newSkills[newIndex], newSkills[index]];
    setFormData((f) => ({ ...f, skills: newSkills }));
  }

  function updateSkillInForm(index, field, value) {
    setFormData((f) => ({
      ...f,
      skills: f.skills.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }));
  }

  const totalHours = formData.skills.reduce((sum, s) => sum + Number(s.estimatedHours || 0), 0);

  return (
    <div className="animate-fade-in space-y-5">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-primary/8 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Route className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Quản Lý Lộ Trình Mẫu</span>
            </div>
            <p className="text-muted-foreground text-sm mt-1.5">
              Tổng <strong className="text-foreground">{pagination.total}</strong> lộ trình đào tạo
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Thêm lộ trình
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Lọc
        </div>
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm lộ trình..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className="pl-9"
          />
        </div>
        {/* Mức độ dropdown */}
        <div className="relative shrink-0" ref={diffMenuRef}>
          <button
            type="button"
            onClick={() => setShowDiffMenu(v => !v)}
            className={`h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all min-w-[160px] ${showDiffMenu
              ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1'
              : 'border-input bg-background text-foreground hover:border-primary/60'}`}
          >
            <span className="flex-1 text-left truncate">
              {filterDifficulty === '' ? 'Tất cả mức độ' : difficultyLabels[filterDifficulty] || filterDifficulty}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${showDiffMenu ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
          </button>
          {showDiffMenu && (
            <div className="absolute left-0 top-full mt-1.5 z-30 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden w-48 animate-fade-in">
              <div className="py-1.5">
                {[{ value: '', label: 'Tất cả mức độ' }, ...Object.entries(difficultyLabels).map(([k, v]) => ({ value: k, label: v }))].map(({ value, label }) => (
                  <button key={value} type="button"
                    onClick={() => { setFilterDifficulty(value); setPagination((p) => ({ ...p, page: 1 })); setShowDiffMenu(false); }}
                    className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${filterDifficulty === value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted/50'}`}
                  >
                    {filterDifficulty === value && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    <span className={filterDifficulty === value ? '' : 'ml-3.5'}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Lộ Trình</th>
                <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Hướng Nghề</th>
                <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-28">Mức Độ</th>
                <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-24">Kỹ Năng</th>
                <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-26">Thời Gian</th>
                <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-22">Đánh Giá</th>
                <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-22">Đăng Ký</th>
                <th className="text-right px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 skeleton rounded-lg shrink-0" />
                        <div className="h-4 w-36 skeleton rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><div className="h-4 w-28 skeleton rounded" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-5 w-20 skeleton rounded-full mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-6 w-7 skeleton rounded-full mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-4 w-16 skeleton rounded mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-4 w-10 skeleton rounded mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-4 w-8 skeleton rounded mx-auto" /></td>
                    <td className="px-4 py-3.5"><div className="h-7 w-20 skeleton rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : roadmaps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Route className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Chưa có lộ trình nào</p>
                    <p className="text-xs text-muted-foreground mt-1">Thử thay đổi bộ lọc hoặc thêm lộ trình mới</p>
                  </td>
                </tr>
              ) : (
                roadmaps.map((rm) => (
                  <tr key={rm._id} className="border-b hover:bg-muted/20 transition-colors group">
                    {/* Lộ trình */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                          <Route className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="font-medium group-hover:text-primary transition-colors">{rm.title}</span>
                      </div>
                    </td>
                    {/* Hướng nghề */}
                    <td className="px-4 py-3.5 text-muted-foreground text-sm">{rm.careerPath}</td>
                    {/* Mức độ */}
                    <td className="px-4 py-3.5 text-center">
                      <DifficultyBadge difficulty={rm.difficulty} />
                    </td>
                    {/* Kỹ năng */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/8 text-primary text-xs font-bold">
                        {rm.skills?.length || 0}
                      </span>
                    </td>
                    {/* Thời gian */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />{rm.estimatedMonths} tháng
                      </span>
                    </td>
                    {/* Đánh giá */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-medium">{rm.averageRating?.toFixed(1) || '0.0'}</span>
                      </span>
                    </td>
                    {/* Đăng ký */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />{rm.enrollmentCount || 0}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(rm)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary" title="Xem chi tiết">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(rm)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Chỉnh sửa">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(rm)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/10">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">{pagination.total}</strong> lộ trình • Trang {pagination.page}/{pagination.pages}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs px-2 font-medium">{pagination.page}</span>
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
        <DialogHeader onClose={() => setShowDetail(false)}>Chi tiết Lộ trình</DialogHeader>
        {detailRoadmap && (
          <DialogBody className="space-y-5">
            {/* Hero card */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/20">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Route className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg leading-snug">{detailRoadmap.title}</h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <DifficultyBadge difficulty={detailRoadmap.difficulty} />
                  <span className="text-xs text-muted-foreground">{detailRoadmap.careerPath}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {detailRoadmap.estimatedMonths} tháng
                  </span>
                </div>
                {detailRoadmap.description && (
                  <p className="text-sm text-muted-foreground mt-2">{detailRoadmap.description}</p>
                )}
              </div>
            </div>
            {/* Skills */}
            <div>
              <h4 className="font-semibold text-sm mb-2.5">Kỹ năng ({detailRoadmap.skills?.length || 0})</h4>
              <div className="space-y-2">
                {(detailRoadmap.skills || [])
                  .sort((a, b) => a.order - b.order)
                  .map((s, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border bg-card/50 p-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{s.order}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{s.skill?.name || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground ml-2">{s.estimatedHours}h</span>
                      </div>
                      <DifficultyBadge difficulty={s.targetLevel} />
                    </div>
                  ))}
                {(!detailRoadmap.skills || detailRoadmap.skills.length === 0) && (
                  <p className="text-sm text-muted-foreground py-4 text-center">Chưa có kỹ năng</p>
                )}
              </div>
            </div>
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
        </DialogFooter>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} className="max-w-3xl">
        <DialogHeader onClose={() => setShowForm(false)}>
          {editingId ? 'Chỉnh sửa lộ trình' : 'Thêm lộ trình mới'}
        </DialogHeader>
        <form onSubmit={handleSave}>
          <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tên lộ trình *</label>
              <Input value={formData.title} required
                onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                placeholder="VD: Frontend Developer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Hướng nghề nghiệp *</label>
                <Input value={formData.careerPath} required
                  onChange={(e) => setFormData((f) => ({ ...f, careerPath: e.target.value }))}
                  placeholder="VD: Frontend Developer" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Thời gian (tháng)</label>
                  <Input type="number" min={1} max={36} value={formData.estimatedMonths}
                    onChange={(e) => setFormData((f) => ({ ...f, estimatedMonths: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Mức độ</label>
                  <Select value={formData.difficulty}
                    onChange={(e) => setFormData((f) => ({ ...f, difficulty: e.target.value }))}>
                    {Object.entries(difficultyLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Mô tả</label>
              <Textarea value={formData.description} rows={2}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))} />
            </div>

            {/* Skills section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">
                  Kỹ năng trong lộ trình ({formData.skills.length}) — Tổng {totalHours}h
                </h4>
              </div>

              {/* Add skill */}
              <Select
                value=""
                onChange={(e) => { if (e.target.value) addSkillToForm(e.target.value); }}
                className="mb-3"
              >
                <option value="">+ Thêm kỹ năng...</option>
                {allSkills
                  .filter((s) => !formData.skills.some((fs) => fs.skill === s._id))
                  .map((s) => (
                    <option key={s._id} value={s._id}>{s.icon} {s.name} ({s.estimatedHours}h)</option>
                  ))}
              </Select>

              {/* Skill list */}
              <div className="space-y-2">
                {formData.skills.map((s, i) => (
                  <div key={s.skill} className="flex items-center gap-2 rounded-lg border p-2.5 bg-muted/5">
                    <span className="text-xs font-bold text-primary w-5 text-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">
                        {s.skillName || allSkills.find((sk) => sk._id === s.skill)?.name || s.skill}
                      </span>
                    </div>
                    <Input type="number" min={1} className="w-16 text-center text-xs" value={s.estimatedHours}
                      onChange={(e) => updateSkillInForm(i, 'estimatedHours', e.target.value)} />
                    <span className="text-xs text-muted-foreground">h</span>
                    <Select className="w-24 text-xs" value={s.targetLevel}
                      onChange={(e) => updateSkillInForm(i, 'targetLevel', e.target.value)}>
                      {Object.entries(levelLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </Select>
                    <div className="flex flex-col gap-0.5">
                      <button type="button" onClick={() => moveSkill(i, -1)} disabled={i === 0}
                        className="p-0.5 rounded hover:bg-muted disabled:opacity-20">
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={() => moveSkill(i, 1)} disabled={i === formData.skills.length - 1}
                        className="p-0.5 rounded hover:bg-muted disabled:opacity-20">
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                    <button type="button" onClick={() => removeSkillFromForm(i)}
                      className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {formData.skills.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Chọn kỹ năng từ dropdown phía trên
                  </p>
                )}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
      <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}

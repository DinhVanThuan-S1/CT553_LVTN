/**
 * RoadmapManagement - QL Lộ trình mẫu (Admin)
 * CRUD lộ trình mẫu, chọn kỹ năng, gắn công việc liên quan
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  Search, Plus, Pencil, Trash2, Eye, Route,
  ChevronLeft, ChevronRight, Clock, Users, Star,
  GripVertical, X, ArrowUp, ArrowDown, SlidersHorizontal, ChevronDown, Check, ArrowUpDown,
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
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');
  const diffMenuRef = useRef(null);
  const sortMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (diffMenuRef.current && !diffMenuRef.current.contains(e.target)) setShowDiffMenu(false);
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) setShowSortMenu(false);
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
      params.sort = sortOrder === 'desc' ? '-createdAt' : 'createdAt';
      const { data } = await api.get('/roadmaps', { params });
      setRoadmaps(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Không thể tải danh sách lộ trình');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, filterDifficulty, sortOrder]);

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

        {/* Sort dropdown */}
        <div className="relative shrink-0" ref={sortMenuRef}>
          <button
            type="button"
            onClick={() => { setShowSortMenu(v => !v); setShowDiffMenu(false); }}
            className={`h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all min-w-[148px] ${showSortMenu ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1' : 'border-input bg-background text-foreground hover:border-primary/60'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-left">{sortOrder === 'desc' ? 'Mới nhất' : 'Cũ nhất'}</span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${showSortMenu ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-full mt-1.5 z-30 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden w-40 animate-fade-in">
              <div className="py-1.5">
                {[{ value: 'desc', label: 'Mới nhất' }, { value: 'asc', label: 'Cũ nhất' }].map(({ value, label }) => (
                  <button key={value} type="button" onClick={() => { setSortOrder(value); setShowSortMenu(false); setPagination(p => ({ ...p, page: 1 })); }}
                    className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${sortOrder === value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted/50'}`}>
                    {sortOrder === value && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    <span className={sortOrder === value ? '' : 'ml-3.5'}>{label}</span>
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
        {/* Gradient header */}
        {detailRoadmap && (
          <div className="relative overflow-hidden rounded-t-xl border-b bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 border border-primary/10">
                  <Route className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground leading-tight">{detailRoadmap.title}</h2>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <DifficultyBadge difficulty={detailRoadmap.difficulty} />
                    <span className="text-[11px] text-muted-foreground">{detailRoadmap.careerPath}</span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {detailRoadmap.estimatedMonths} tháng
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)}
                className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {detailRoadmap.description && (
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{detailRoadmap.description}</p>
            )}
          </div>
        )}
        {detailRoadmap && (
          <DialogBody className="max-h-[60vh] overflow-y-auto px-6 py-5">
            {/* Skills section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Route className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
                  Kỹ năng
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {detailRoadmap.skills?.length || 0}
                </span>
                <div className="flex-1 h-px bg-border" />
                {/* Total hours */}
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Tổng {(detailRoadmap.skills || []).reduce((sum, s) => sum + (s.estimatedHours || 0), 0)}h
                </span>
              </div>
              <div className="space-y-2">
                {(detailRoadmap.skills || [])
                  .sort((a, b) => a.order - b.order)
                  .map((s, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-3 border-l-4 border-l-primary/30 hover:shadow-sm transition-shadow">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                        {s.order}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm">{s.skill?.name || 'N/A'}</span>
                        <span className="text-[11px] text-muted-foreground ml-2 flex-shrink-0">
                          <Clock className="w-2.5 h-2.5 inline mr-0.5" />{s.estimatedHours}h
                        </span>
                      </div>
                      <DifficultyBadge difficulty={s.targetLevel} />
                    </div>
                  ))}
                {(!detailRoadmap.skills || detailRoadmap.skills.length === 0) && (
                  <div className="text-center py-8">
                    <Route className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Chưa có kỹ năng nào</p>
                  </div>
                )}
              </div>
            </div>
          </DialogBody>
        )}
        <DialogFooter className="border-t bg-muted/20 rounded-b-xl px-6 py-4">
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
          {detailRoadmap && (
            <Button size="sm" className="gap-2" onClick={() => { setShowDetail(false); openEdit(detailRoadmap); }}>
              <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
            </Button>
          )}
        </DialogFooter>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} className="max-w-3xl">
        {/* Gradient header */}
        <div className="relative overflow-hidden rounded-t-xl border-b bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                editingId ? 'bg-amber-500/15 text-amber-600' : 'bg-primary/15 text-primary'
              }`}>
                {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground leading-tight">
                  {editingId ? 'Chỉnh sửa lộ trình' : 'Thêm lộ trình mới'}
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {editingId ? 'Cập nhật thông tin lộ trình đào tạo' : 'Tạo lộ trình đào tạo mới cho hệ thống'}
                </p>
              </div>
            </div>
            <button onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <DialogBody className="space-y-5 max-h-[68vh] overflow-y-auto px-6 py-5">

            {/* Section: Thông tin cơ bản */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Route className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Thông tin cơ bản</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Tên lộ trình */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Tên lộ trình <span className="text-red-500">*</span>
                </label>
                <Input value={formData.title} required
                  onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Frontend Developer"
                  className="h-9" />
              </div>

              {/* Hướng nghề + Thời gian + Mức độ */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Hướng nghề nghiệp <span className="text-red-500">*</span>
                  </label>
                  <Input value={formData.careerPath} required
                    onChange={(e) => setFormData((f) => ({ ...f, careerPath: e.target.value }))}
                    placeholder="VD: Frontend Developer"
                    className="h-9" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Thời gian (tháng)</label>
                  <Input type="number" min={1} max={36} value={formData.estimatedMonths}
                    onChange={(e) => setFormData((f) => ({ ...f, estimatedMonths: e.target.value }))}
                    className="h-9" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Mức độ</label>
                  <CustomSelect
                    value={formData.difficulty}
                    onChange={v => setFormData(f => ({ ...f, difficulty: v }))}
                    options={[
                      { value: 'beginner',     label: 'Cơ bản',    color: 'bg-emerald-500' },
                      { value: 'intermediate', label: 'Trung bình', color: 'bg-amber-400' },
                      { value: 'advanced',     label: 'Nâng cao',  color: 'bg-red-500' },
                    ]}
                  />
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Mô tả</label>
                <Textarea value={formData.description} rows={2}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả ngắn về lộ trình..." />
              </div>
            </div>

            {/* Section: Kỹ năng trong lộ trình */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <GripVertical className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">Kỹ năng trong lộ trình</span>
                {formData.skills.length > 0 && (
                  <span className="text-[10px] text-white bg-amber-500 px-1.5 py-0.5 rounded-full">{formData.skills.length}</span>
                )}
                <div className="flex-1 h-px bg-border" />
                {totalHours > 0 && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" /> Tổng {totalHours}h
                  </span>
                )}
              </div>

              {/* Skill picker dropdown */}
              <CustomSelect
                value=""
                onChange={v => { if (v) addSkillToForm(v); }}
                placeholder="+ Thêm kỹ năng..."
                options={allSkills
                  .filter(s => !formData.skills.some(fs => fs.skill === s._id))
                  .map(s => ({ value: s._id, label: `${s.icon || ''} ${s.name} (${s.estimatedHours}h)` }))}
              />

              {/* Skill list */}
              <div className="space-y-2">
                {formData.skills.map((s, i) => (
                  <div key={s.skill} className="flex items-center gap-2.5 rounded-xl border p-3 bg-muted/10 hover:bg-muted/20 transition-colors group">
                    {/* Order number */}
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {/* Skill name */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold truncate block">
                        {s.skillName || allSkills.find(sk => sk._id === s.skill)?.name || s.skill}
                      </span>
                    </div>
                    {/* Hours */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Input type="number" min={1}
                        className="w-14 text-center text-xs h-7 px-1"
                        value={s.estimatedHours}
                        onChange={e => updateSkillInForm(i, 'estimatedHours', e.target.value)} />
                      <span className="text-xs text-muted-foreground">h</span>
                    </div>
                    {/* Target level */}
                    <CustomSelect
                      className="w-36 shrink-0"
                      value={s.targetLevel}
                      onChange={v => updateSkillInForm(i, 'targetLevel', v)}
                      options={[
                        { value: 'beginner',     label: 'Cơ bản',    color: 'bg-emerald-500' },
                        { value: 'intermediate', label: 'Trung bình', color: 'bg-amber-400' },
                        { value: 'advanced',     label: 'Nâng cao',  color: 'bg-red-500' },
                      ]}
                    />
                    {/* Move up/down */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button type="button" onClick={() => moveSkill(i, -1)} disabled={i === 0}
                        className="p-0.5 rounded hover:bg-muted disabled:opacity-20 transition-opacity">
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={() => moveSkill(i, 1)} disabled={i === formData.skills.length - 1}
                        className="p-0.5 rounded hover:bg-muted disabled:opacity-20 transition-opacity">
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Remove */}
                    <button type="button" onClick={() => removeSkillFromForm(i)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {formData.skills.length === 0 && (
                  <div className="text-center py-8 rounded-xl border border-dashed border-border/60">
                    <GripVertical className="w-7 h-7 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Chọn kỹ năng từ dropdown phía trên</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">Có thể sắp xếp lại thứ tự sau khi thêm</p>
                  </div>
                )}
              </div>
            </div>

          </DialogBody>
          <DialogFooter className="border-t bg-muted/20 rounded-b-xl px-6 py-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button type="submit" size="sm" disabled={saving} className="gap-2 min-w-24">
              {saving ? (
                <><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
              ) : editingId ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
      <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}

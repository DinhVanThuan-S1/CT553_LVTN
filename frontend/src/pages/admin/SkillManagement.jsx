/**
 * SkillManagement - QL Kỹ năng
 * CRUD kỹ năng với resources, exercises, test questions
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
  Search, Plus, Pencil, Trash2, Target, Eye,
  ChevronLeft, ChevronRight, BookOpen, Dumbbell, HelpCircle, Clock,
  FileText, X, SlidersHorizontal, ChevronDown, Link, Check,
} from 'lucide-react';

const RESOURCE_TYPE_ICONS = { content: FileText, exercise: Dumbbell, test: HelpCircle };
const RESOURCE_TYPE_LABELS = { content: 'Nội dung', exercise: 'Bài tập', test: 'Bài test' };

const categoryLabels = {
  programming: 'Ngôn ngữ lập trình',
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Cơ sở dữ liệu',
  devops: 'DevOps & Tools',
  mobile: 'Mobile',
  ai_ml: 'AI/ML',
  software_engineering: 'Kỹ thuật phần mềm',
  soft_skills: 'Kỹ năng mềm',
  networking: 'Mạng & Bảo mật',
  game_development: 'Phát triển Game',
  testing: 'Testing & QA',
  embedded: 'Hệ thống nhúng',
  other: 'Khác',
};

const categoryColors = {
  programming: { bg: 'bg-sky-500/10', text: 'text-sky-600', border: 'border-sky-400/20' },
  frontend: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-400/20' },
  backend: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-400/20' },
  database: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-400/20' },
  devops: { bg: 'bg-violet-500/10', text: 'text-violet-600', border: 'border-violet-400/20' },
  mobile: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  ai_ml: { bg: 'bg-pink-500/10', text: 'text-pink-600', border: 'border-pink-400/20' },
  software_engineering: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-400/20' },
  soft_skills: { bg: 'bg-teal-500/10', text: 'text-teal-600', border: 'border-teal-400/20' },
  networking: { bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-400/20' },
  game_development: { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-400/20' },
  testing: { bg: 'bg-cyan-500/10', text: 'text-cyan-600', border: 'border-cyan-400/20' },
  embedded: { bg: 'bg-lime-500/10', text: 'text-lime-600', border: 'border-lime-400/20' },
  other: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
};

function CategoryBadge({ category }) {
  const label = categoryLabels[category] || category;
  const c = categoryColors[category] || categoryColors.other;
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
      {label}
    </span>
  );
}

const initialForm = {
  name: '', category: 'programming', description: '', icon: '📘', estimatedHours: 20,
  linkedResources: [],
};

export default function SkillManagement() {
  const toast = useToast();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 15 });
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailSkill, setDetailSkill] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [allResources, setAllResources] = useState([]);
  const [resourceSearch, setResourceSearch] = useState('');
  const [showCatMenu, setShowCatMenu] = useState(false);
  const catMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (catMenuRef.current && !catMenuRef.current.contains(e.target)) setShowCatMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      const { data } = await api.get('/skills', { params });
      setSkills(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Không thể tải danh sách kỹ năng');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, filterCategory]);

  useEffect(() => { loadSkills(); }, [loadSkills]);

  async function openDetail(skill) {
    try {
      const { data } = await api.get(`/skills/${skill._id}`);
      setDetailSkill(data.data);
      setShowDetail(true);
    } catch {
      toast.error('Không thể tải chi tiết');
    }
  }

  async function loadResources() {
    if (allResources.length > 0) return;
    try {
      const { data } = await api.get('/admin/resources/all');
      setAllResources(data.data || []);
    } catch { /* silent */ }
  }

  function openCreate() {
    setFormData(initialForm);
    setEditingId(null);
    setResourceSearch('');
    loadResources();
    setShowForm(true);
  }

  async function openEdit(skill) {
    // Lấy chi tiết skill để có linkedResources đầy đủ
    try {
      const { data } = await api.get(`/skills/${skill._id}`);
      const s = data.data;
      setFormData({
        name: s.name,
        category: s.category,
        description: s.description || '',
        icon: s.icon || '📘',
        estimatedHours: s.estimatedHours || 20,
        linkedResources: (s.linkedResources || []).map(r => r._id || r),
      });
    } catch {
      setFormData({
        name: skill.name,
        category: skill.category,
        description: skill.description || '',
        icon: skill.icon || '📘',
        estimatedHours: skill.estimatedHours || 20,
        linkedResources: [],
      });
    }
    setEditingId(skill._id);
    setResourceSearch('');
    loadResources();
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        estimatedHours: Number(formData.estimatedHours),
      };
      if (editingId) {
        await api.put(`/skills/${editingId}`, payload);
        toast.success('Cập nhật kỹ năng thành công');
      } else {
        await api.post('/skills', payload);
        toast.success('Tạo kỹ năng thành công');
      }
      setShowForm(false);
      loadSkills();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  }

  // Toggle resource trong form
  function toggleResource(resourceId) {
    setFormData(f => ({
      ...f,
      linkedResources: f.linkedResources.includes(resourceId)
        ? f.linkedResources.filter(id => id !== resourceId)
        : [...f.linkedResources, resourceId],
    }));
  }

  // Resources đã lọc theo search
  const filteredResources = resourceSearch
    ? allResources.filter(r =>
      r.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      (RESOURCE_TYPE_LABELS[r.type] || '').includes(resourceSearch)
    )
    : allResources;

  function handleDelete(skill) {
    setConfirmState({
      title: 'Xóa kỹ năng',
      message: `Bạn có chắc muốn xóa kỹ năng “${skill.name}”?`,
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        await api.delete(`/skills/${skill._id}`);
        toast.success('Đã xóa kỹ năng');
        loadSkills();
      },
    });
  }

  return (
    <div className="animate-fade-in space-y-5">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-primary/8 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Quản Lý Kỹ Năng</span>
            </div>
            <p className="text-muted-foreground text-sm mt-1.5">
              Tổng <strong className="text-foreground">{pagination.total}</strong> kỹ năng trong hệ thống
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Thêm kỹ năng
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
            placeholder="Tìm tên kỹ năng..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className="pl-9"
          />
        </div>

        {/* Nhóm dropdown */}
        <div className="relative shrink-0" ref={catMenuRef}>
          <button
            type="button"
            onClick={() => setShowCatMenu(v => !v)}
            className={`h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all min-w-[180px] ${showCatMenu
                ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1'
                : 'border-input bg-background text-foreground hover:border-primary/60'
              }`}
          >
            <span className="flex-1 text-left truncate">
              {filterCategory === '' ? 'Tất cả nhóm' : categoryLabels[filterCategory] || filterCategory}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${showCatMenu ? 'rotate-180 text-primary' : 'text-muted-foreground'
              }`} />
          </button>
          {showCatMenu && (
            <div className="absolute left-0 top-full mt-1.5 z-30 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden w-56 animate-fade-in">
              <div className="py-1.5 max-h-72 overflow-y-auto">
                {[{ value: '', label: 'Tất cả nhóm' }, ...Object.entries(categoryLabels).map(([k, v]) => ({ value: k, label: v }))].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFilterCategory(value);
                      setPagination((p) => ({ ...p, page: 1 }));
                      setShowCatMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${filterCategory === value
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground hover:bg-muted/50'
                      }`}
                  >
                    {filterCategory === value && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    <span className={filterCategory === value ? '' : 'ml-3.5'}>{label}</span>
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
                <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Kỹ Năng</th>
                <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-40">Nhóm</th>
                <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-24">Giờ Học</th>
                <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-26">Nội Dung</th>
                <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-24">Bài Tập</th>
                <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-24">Câu Hỏi</th>
                <th className="text-right px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg skeleton shrink-0" />
                        <div className="h-4 w-32 skeleton rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><div className="h-5 w-24 skeleton rounded-full" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-4 w-10 skeleton rounded mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-5 w-8 skeleton rounded-full mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-5 w-8 skeleton rounded-full mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-5 w-8 skeleton rounded-full mx-auto" /></td>
                    <td className="px-4 py-3.5"><div className="h-7 w-20 skeleton rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : skills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Target className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Không có kỹ năng nào</p>
                    <p className="text-xs text-muted-foreground mt-1">Thử thay đổi bộ lọc</p>
                  </td>
                </tr>
              ) : (
                skills.map((skill) => {
                  const contentCount = (skill.linkedResources || []).filter(r => r.type === 'content').length;
                  const exerciseCount = (skill.linkedResources || []).filter(r => r.type === 'exercise').length;
                  const testCount = (skill.linkedResources || []).filter(r => r.type === 'test').length;
                  return (
                    <tr key={skill._id} className="border-b hover:bg-muted/20 transition-colors group">
                      {/* Kỹ năng */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 text-base group-hover:bg-primary/15 transition-colors">
                            {skill.icon}
                          </div>
                          <span className="font-medium group-hover:text-primary transition-colors">{skill.name}</span>
                        </div>
                      </td>
                      {/* Nhóm */}
                      <td className="px-4 py-3.5">
                        <CategoryBadge category={skill.category} />
                      </td>
                      {/* Giờ học */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3" />{skill.estimatedHours}h
                        </span>
                      </td>
                      {/* Nội dung */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${contentCount > 0 ? 'bg-sky-500/10 text-sky-600' : 'text-muted-foreground/40'
                          }`}>{contentCount}</span>
                      </td>
                      {/* Bài tập */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${exerciseCount > 0 ? 'bg-amber-500/10 text-amber-600' : 'text-muted-foreground/40'
                          }`}>{exerciseCount}</span>
                      </td>
                      {/* Câu hỏi */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${testCount > 0 ? 'bg-red-500/10 text-red-600' : 'text-muted-foreground/40'
                          }`}>{testCount}</span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openDetail(skill)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary" title="Xem chi tiết">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(skill)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Chỉnh sửa">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(skill)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/10">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">{pagination.total}</strong> kỹ năng • Trang {pagination.page}/{pagination.pages}
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
        {detailSkill && (
          <div className="relative overflow-hidden rounded-t-xl border-b bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-2xl shrink-0 border border-primary/10">
                  {detailSkill.icon}
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground leading-tight">{detailSkill.name}</h2>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <CategoryBadge category={detailSkill.category} />
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {detailSkill.estimatedHours}h
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)}
                className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {detailSkill.description && (
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{detailSkill.description}</p>
            )}
          </div>
        )}
        {detailSkill && (
          <DialogBody className="space-y-4 max-h-[60vh] overflow-y-auto px-6 py-5">
            {(() => {
              const linked = detailSkill.linkedResources || [];
              const contents = linked.filter(r => r.type === 'content');
              const exercises = linked.filter(r => r.type === 'exercise');
              const tests = linked.filter(r => r.type === 'test');

              const ResourceCard = ({ res, accent, badgeLabel }) => (
                <div className={`rounded-xl border bg-card p-3.5 space-y-1.5 hover:shadow-sm transition-shadow border-l-4 ${accent}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm leading-snug">{res.title}</span>
                    {badgeLabel && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0 border">
                        {badgeLabel}
                      </span>
                    )}
                  </div>
                  {res.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{res.description}</p>
                  )}
                  {res.url && (
                    <a href={res.url} target="_blank" rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5">
                      <Link className="w-3 h-3" />{res.url}
                    </a>
                  )}
                </div>
              );

              const Section = ({ icon: Icon, label, count, children, accentClass }) => (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${accentClass}`} />
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${accentClass}`}>{label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{count}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  {children}
                </div>
              );

              return (
                <>
                  <Section icon={BookOpen} label="Nội dung" count={contents.length} accentClass="text-sky-600">
                    {contents.length > 0 ? (
                      <div className="space-y-2">
                        {contents.map(res => (
                          <ResourceCard key={res._id} res={res}
                            accent="border-l-sky-400"
                            badgeLabel={res.category}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground py-2 pl-1">Chưa có tài nguyên nội dung</p>
                    )}
                  </Section>

                  <Section icon={Dumbbell} label="Bài Tập" count={exercises.length} accentClass="text-amber-600">
                    {exercises.length > 0 ? (
                      <div className="space-y-2">
                        {exercises.map(ex => (
                          <ResourceCard key={ex._id} res={ex}
                            accent="border-l-amber-400"
                            badgeLabel={ex.difficulty}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground py-2 pl-1">Chưa có bài tập</p>
                    )}
                  </Section>

                  <Section icon={HelpCircle} label="Bài Test" count={tests.length} accentClass="text-red-600">
                    {tests.length > 0 ? (
                      <div className="space-y-2">
                        {tests.map(t => (
                          <div key={t._id} className="rounded-xl border border-l-4 border-l-red-400 bg-card p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm">{t.title}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-400/20 font-semibold">
                                {t.testQuestions?.length || 0} câu
                              </span>
                            </div>
                            {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                            {(t.testQuestions || []).map((q, i) => (
                              <div key={q._id || i} className="mt-1 p-2.5 rounded-lg bg-muted/30 text-xs space-y-1.5">
                                <p className="font-semibold text-foreground">Câu {i + 1}: {q.question}</p>
                                <div className="space-y-1">
                                  {q.options?.map((opt, j) => (
                                    <p key={j} className={`flex items-center gap-1.5 ${
                                      opt.isCorrect ? 'text-emerald-600 font-medium' : 'text-muted-foreground'
                                    }`}>
                                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] shrink-0 ${
                                        opt.isCorrect ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-border'
                                      }`}>{opt.isCorrect ? '✓' : ''}</span>
                                      {opt.text}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground py-2 pl-1">Chưa có bài test</p>
                    )}
                  </Section>
                </>
              );
            })()}
          </DialogBody>
        )}
        <DialogFooter className="border-t bg-muted/20 rounded-b-xl px-6 py-4">
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
          {detailSkill && (
            <Button size="sm" className="gap-2" onClick={() => { setShowDetail(false); openEdit(detailSkill); }}>
              <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
            </Button>
          )}
        </DialogFooter>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)}>
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
                  {editingId ? 'Chỉnh sửa kỹ năng' : 'Thêm kỹ năng mới'}
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {editingId ? 'Cập nhật thông tin kỹ năng trong hệ thống' : 'Tạo kỹ năng học tập mới'}
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
          <DialogBody className="space-y-5 max-h-[65vh] overflow-y-auto px-6 py-5">

            {/* Section: Thông tin cơ bản */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Thông tin cơ bản</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Icon preview + Tên */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Icon</label>
                  <div className="relative">
                    <Input
                      value={formData.icon}
                      onChange={(e) => setFormData((f) => ({ ...f, icon: e.target.value }))}
                      className="text-center text-xl h-9 pr-1"
                    />
                    {/* Preview */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg border border-primary/10 shadow-sm">
                      {formData.icon}
                    </div>
                  </div>
                </div>
                <div className="col-span-3">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Tên kỹ năng <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.name} required
                    onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                    placeholder="VD: React.js"
                    className="h-9"
                  />
                </div>
              </div>

              {/* Nhóm + Giờ học */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Nhóm <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={formData.category}
                    onChange={v => setFormData(f => ({ ...f, category: v }))}
                    options={Object.entries(categoryLabels).map(([k, v]) => ({ value: k, label: v }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Giờ học ước tính</label>
                  <Input
                    type="number" min={1}
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData((f) => ({ ...f, estimatedHours: e.target.value }))}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Mô tả</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả ngắn gọn về kỹ năng..."
                  rows={2}
                />
              </div>
            </div>

            {/* Section: Tài nguyên liên kết */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">Tài nguyên liên kết</span>
                {formData.linkedResources.length > 0 && (
                  <span className="text-[10px] text-white bg-primary px-1.5 py-0.5 rounded-full">
                    {formData.linkedResources.length}
                  </span>
                )}
                <div className="flex-1 h-px bg-border" />
                <a href="/admin/resources" target="_blank"
                  className="text-[11px] text-primary hover:underline shrink-0 font-medium">+ Thêm tài nguyên mới</a>
              </div>

              {/* Search resources */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Tìm tài nguyên..."
                  value={resourceSearch}
                  onChange={e => setResourceSearch(e.target.value)}
                  className="pl-9 h-8 text-xs"
                />
              </div>

              {/* Resource list */}
              <div className="max-h-44 overflow-y-auto border rounded-xl bg-muted/20 divide-y divide-border/50">
                {filteredResources.length === 0 ? (
                  <div className="text-center py-6">
                    <BookOpen className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1.5" />
                    <p className="text-xs text-muted-foreground">
                      {allResources.length === 0 ? 'Chưa có tài nguyên. Tạo từ trang Quản lý Tài nguyên.' : 'Không tìm thấy'}
                    </p>
                  </div>
                ) : filteredResources.map(resource => {
                  const TypeIcon = RESOURCE_TYPE_ICONS[resource.type] || FileText;
                  const selected = formData.linkedResources.includes(resource._id);
                  const typeColor = resource.type === 'exercise' ? 'text-amber-500'
                    : resource.type === 'test' ? 'text-red-500' : 'text-sky-500';
                  return (
                    <button
                      key={resource._id}
                      type="button"
                      onClick={() => toggleResource(resource._id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                        selected ? 'bg-primary/8 text-primary' : 'hover:bg-background'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 text-[9px] font-bold transition-colors ${
                        selected ? 'border-primary bg-primary text-white' : 'border-border'
                      }`}>
                        {selected && <Check className="w-2.5 h-2.5" />}
                      </span>
                      <TypeIcon className={`w-3.5 h-3.5 flex-shrink-0 ${typeColor}`} />
                      <span className="text-xs flex-1 truncate">{resource.title}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                        resource.type === 'exercise' ? 'bg-amber-500/10 text-amber-600'
                          : resource.type === 'test' ? 'bg-red-500/10 text-red-600'
                          : 'bg-sky-500/10 text-sky-600'
                      }`}>
                        {RESOURCE_TYPE_LABELS[resource.type]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected tags */}
              {formData.linkedResources.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.linkedResources.map(rid => {
                    const r = allResources.find(x => x._id === rid);
                    if (!r) return null;
                    const TypeIcon = RESOURCE_TYPE_ICONS[r.type] || FileText;
                    return (
                      <span key={rid} className="flex items-center gap-1.5 text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20 font-medium">
                        <TypeIcon className="w-3 h-3" />
                        {r.title}
                        <button type="button" onClick={() => toggleResource(rid)}
                          className="hover:text-red-500 transition-colors ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
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

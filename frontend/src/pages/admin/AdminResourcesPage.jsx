/**
 * AdminResourcesPage — Quản lý Tài nguyên học tập
 * Real API: /api/admin/resources
 * Mỗi tài nguyên có type: content | exercise | test
 * Có thể thuộc nhiều kỹ năng
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import {
  Plus, Search, BookOpen, Video, Globe, Wrench, BookMarked,
  Edit3, Trash2, ExternalLink, Star, Dumbbell,
  HelpCircle, FileText, ChevronLeft, ChevronRight, X, CheckCircle2,
  Library,
} from 'lucide-react';

// ─── Config ──────────────────────────────────────────────
const TYPE_CONFIG = {
  content: { label: 'Nội Dung', icon: FileText, color: 'default' },
  exercise: { label: 'Bài Tập', icon: Dumbbell, color: 'warning' },
  test: { label: 'Bài Test', icon: HelpCircle, color: 'danger' },
};

const CATEGORY_CONFIG = {
  video: { label: 'Video', icon: Video, color: 'danger' },
  article: { label: 'Bài viết', icon: BookOpen, color: 'default' },
  course: { label: 'Khóa học', icon: BookMarked, color: 'success' },
  tool: { label: 'Công cụ', icon: Wrench, color: 'warning' },
  documentation: { label: 'Tài liệu', icon: Globe, color: 'secondary' },
  book: { label: 'Sách', icon: BookOpen, color: 'secondary' },
};

const DIFFICULTY_LABELS = {
  beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao',
};

const EMPTY_FORM = {
  title: '', description: '', type: 'content', category: 'article',
  url: '', content: '', difficulty: 'beginner', estimatedMinutes: 30,
  skills: [], tags: '', isFeatured: false,
  testQuestions: [],
};

// ─── Main component ──────────────────────────────────────
export default function AdminResourcesPage() {
  const toast = useToast();

  // State
  const [resources, setResources] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 18 });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [stats, setStats] = useState({ total: 0, byType: [] });

  // Dialog state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  // ─── Load data ──
  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (filterType) params.type = filterType;
      const { data } = await api.get('/admin/resources', { params });
      setResources(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Không thể tải danh sách tài nguyên');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, filterType]);

  const loadStats = async () => {
    try {
      const { data } = await api.get('/admin/resources/stats');
      setStats(data.data);
    } catch { /* silent */ }
  };

  const loadSkills = async () => {
    try {
      const { data } = await api.get('/skills', { params: { limit: 200 } });
      setSkills(data.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => { loadResources(); }, [loadResources]);
  useEffect(() => { loadStats(); loadSkills(); }, []);

  // ─── Form helpers ──
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = async (resource) => {
    try {
      const { data: detail } = await api.get(`/admin/resources/${resource._id}`);
      const r = detail.data;
      setEditingId(r._id);
      setForm({
        title: r.title,
        description: r.description || '',
        type: r.type,
        category: r.category || 'article',
        url: r.url || '',
        content: r.content || '',
        difficulty: r.difficulty || 'beginner',
        estimatedMinutes: r.estimatedMinutes || 30,
        skills: (r.skills || []).map(s => s._id || s),
        tags: (r.tags || []).join(', '),
        isFeatured: r.isFeatured || false,
        testQuestions: (r.testQuestions || []).map(q => ({
          question: q.question || '',
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'medium',
          options: (q.options || []).map(o => ({ text: o.text || '', isCorrect: !!o.isCorrect })),
        })),
      });
    } catch {
      setEditingId(resource._id);
      setForm({
        title: resource.title,
        description: resource.description || '',
        type: resource.type,
        category: resource.category || 'article',
        url: resource.url || '',
        content: resource.content || '',
        difficulty: resource.difficulty || 'beginner',
        estimatedMinutes: resource.estimatedMinutes || 30,
        skills: (resource.skills || []).map(s => s._id || s),
        tags: (resource.tags || []).join(', '),
        isFeatured: resource.isFeatured || false,
        testQuestions: [],
      });
    }
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Tên tài nguyên là bắt buộc'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        estimatedMinutes: Number(form.estimatedMinutes),
      };
      if (editingId) {
        await api.put(`/admin/resources/${editingId}`, payload);
        toast.success('Cập nhật tài nguyên thành công');
      } else {
        await api.post('/admin/resources', payload);
        toast.success('Tạo tài nguyên thành công');
      }
      setShowForm(false);
      loadResources();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (resource) => {
    setConfirmState({
      title: 'Xóa tài nguyên',
      message: `Bạn có chắc muốn xóa "${resource.title}"? Tài nguyên sẽ bị xóa khỏi tất cả kỹ năng liên kết.`,
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        await api.delete(`/admin/resources/${resource._id}`);
        toast.success('Đã xóa tài nguyên');
        loadResources();
        loadStats();
      },
    });
  };

  // ─── Skill picker trong form ──
  const toggleSkill = (skillId) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skillId)
        ? f.skills.filter(id => id !== skillId)
        : [...f.skills, skillId],
    }));
  };

  const totalForType = (type) => stats.byType?.find(b => b._id === type)?.count || 0;

  return (
    <div className="animate-fade-in space-y-5">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-primary/8 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Library className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Quản Lý Tài Nguyên</span>
            </div>
            <p className="text-muted-foreground text-sm mt-1.5">
              Tổng <strong className="text-foreground">{stats.total}</strong> tài nguyên học tập
            </p>
          </div>
          <Button className="gap-2 shrink-0" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Thêm tài nguyên
          </Button>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Tổng', value: stats.total, icon: BookOpen,
            from: 'from-primary/15', to: 'to-primary/5', border: 'border-primary/20', text: 'text-primary', ghost: 'text-primary/15',
          },
          {
            label: 'Nội Dung', value: totalForType('content'), icon: FileText,
            from: 'from-sky-500/15', to: 'to-sky-500/5', border: 'border-sky-500/20', text: 'text-sky-600', ghost: 'text-sky-500/15',
          },
          {
            label: 'Bài Tập', value: totalForType('exercise'), icon: Dumbbell,
            from: 'from-amber-500/15', to: 'to-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-600', ghost: 'text-amber-500/15',
          },
          {
            label: 'Bài Test', value: totalForType('test'), icon: HelpCircle,
            from: 'from-red-500/15', to: 'to-red-500/5', border: 'border-red-500/20', text: 'text-red-600', ghost: 'text-red-500/15',
          },
        ].map(({ label, value, icon: Icon, from, to, border, text, ghost }) => (
          <div key={label} className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${from} ${to} ${border} p-4`}>
            <Icon className={`w-10 h-10 ${ghost} absolute -bottom-1 -right-1`} />
            <p className={`text-[11px] font-medium ${text} mb-1.5`}>{label}</p>
            <p className={`text-3xl font-bold ${text}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Type filter tabs + Search ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {[{ key: '', label: 'Tất Cả' }, ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setFilterType(key); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
              {key && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  filterType === key ? 'bg-white/20' : 'bg-background/80'
                }`}>
                  {key === 'content' ? totalForType('content') : key === 'exercise' ? totalForType('exercise') : totalForType('test')}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-all"
            placeholder="Tìm theo tên, mô tả, tag..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          />
        </div>
      </div>

      {/* ── Resource Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 skeleton rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 skeleton rounded" />
                  <div className="flex gap-2">
                    <div className="h-4 w-16 skeleton rounded-full" />
                    <div className="h-4 w-10 skeleton rounded-full" />
                  </div>
                </div>
              </div>
              <div className="h-8 skeleton rounded" />
              <div className="flex gap-1.5">
                <div className="h-5 w-16 skeleton rounded-full" />
                <div className="h-5 w-14 skeleton rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Không tìm thấy tài nguyên nào</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Thử thay đổi bộ lọc hoặc tạo mới</p>
          <Button variant="outline" size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Thêm tài nguyên đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map(r => (
            <ResourceCard
              key={r._id}
              resource={r}
              onEdit={() => openEdit(r)}
              onDelete={() => handleDelete(r)}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">{pagination.total}</strong> tài nguyên • Trang {pagination.page}/{pagination.pages}
          </p>
          <div className="flex gap-1 items-center">
            <Button variant="ghost" size="sm" disabled={pagination.page <= 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs px-2 font-medium">{pagination.page}</span>
            <Button variant="ghost" size="sm" disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Form Dialog ─── */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} className="max-w-2xl">
        {/* Gradient dialog header */}
        <div className="relative overflow-hidden rounded-t-xl border-b bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                editingId ? 'bg-amber-500/15 text-amber-600' : 'bg-primary/15 text-primary'
              }`}>
                {editingId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground leading-tight">
                  {editingId ? 'Chỉnh sửa tài nguyên' : 'Thêm tài nguyên mới'}
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {editingId ? 'Cập nhật thông tin tài nguyên học tập' : 'Tạo tài nguyên học tập mới cho hệ thống'}
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

            {/* ── Section: Thông tin cơ bản ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Thông tin cơ bản</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Tên tài nguyên */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Tên tài nguyên <span className="text-red-500">*</span>
                </label>
                <Input value={form.title} required
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Introduction to React Hooks"
                  className="h-9" />
              </div>

              {/* Loại + Độ khó + Thời lượng */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Loại <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={form.type}
                    onChange={v => setForm(f => ({ ...f, type: v }))}
                    options={[
                      { value: 'content',  label: 'Nội dung', icon: <FileText className="w-3.5 h-3.5 text-sky-500" /> },
                      { value: 'exercise', label: 'Bài tập',  icon: <Dumbbell className="w-3.5 h-3.5 text-amber-500" /> },
                      { value: 'test',     label: 'Bài test', icon: <HelpCircle className="w-3.5 h-3.5 text-red-500" /> },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Độ khó</label>
                  <CustomSelect
                    value={form.difficulty}
                    onChange={v => setForm(f => ({ ...f, difficulty: v }))}
                    options={[
                      { value: 'beginner',     label: 'Cơ bản',    color: 'bg-emerald-500' },
                      { value: 'intermediate', label: 'Trung bình', color: 'bg-amber-400' },
                      { value: 'advanced',     label: 'Nâng cao',  color: 'bg-red-500' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Thời lượng (phút)</label>
                  <Input type="number" min={1} value={form.estimatedMinutes}
                    onChange={e => setForm(f => ({ ...f, estimatedMinutes: e.target.value }))}
                    className="h-9" />
                </div>
              </div>

              {/* Định dạng — chỉ khi type=content */}
              {form.type === 'content' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Định dạng</label>
                    <CustomSelect
                      value={form.category}
                      onChange={v => setForm(f => ({ ...f, category: v }))}
                      options={Object.entries(CATEGORY_CONFIG).map(([k, v]) => ({
                        value: k,
                        label: v.label,
                        icon: <v.icon className="w-3.5 h-3.5 text-muted-foreground" />,
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">URL (nếu có)</label>
                    <Input value={form.url}
                      onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                      placeholder="https://..."
                      className="h-9" />
                  </div>
                </div>
              )}

              {/* URL cho exercise */}
              {form.type === 'exercise' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">URL bài tập (nếu có)</label>
                  <Input value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="https://github.com/..."
                    className="h-9" />
                </div>
              )}

              {/* Mô tả */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Mô tả</label>
                <Textarea value={form.description} rows={2}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả ngắn gọn về tài nguyên..." />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Tags</label>
                <Input value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="JavaScript, React, Hooks..."
                  className="h-9" />
                <p className="text-[11px] text-muted-foreground mt-1">Phân cách bằng dấu phẩy</p>
              </div>
            </div>

            {/* ── Section: Nội dung ── (exercise / content) */}
            {(form.type === 'exercise' || form.type === 'content') && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">
                    {form.type === 'exercise' ? 'Hướng dẫn bài tập' : 'Nội dung chi tiết'}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <Textarea value={form.content} rows={4}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder={form.type === 'exercise'
                    ? 'Mô tả yêu cầu bài tập, các bước thực hiện...'
                    : 'Nội dung bài viết hoặc ghi chú (Markdown)...'} />
              </div>
            )}

            {/* \u2500\u2500 Section: C\u00e2u h\u1ecfi Test \u2500\u2500 */}
            {form.type === 'test' && (
              <div className="space-y-3">
                {/* Section header */}
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-red-500/15 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-3 h-3 text-red-500" />
                  </div>
                  <span className="text-[11px] font-bold text-red-600 uppercase tracking-widest">
                    Câu hỏi test
                  </span>
                  {form.testQuestions.length > 0 && (
                    <span className="text-[10px] font-semibold text-white bg-red-500 px-1.5 py-0.5 rounded-full">
                      {form.testQuestions.length}
                    </span>
                  )}
                  <div className="flex-1 h-px bg-border" />
                  <button
                    type="button"
                    className="flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full border border-primary/20 hover:border-primary/30 transition-all shrink-0"
                    onClick={() => setForm(f => ({
                      ...f,
                      testQuestions: [...f.testQuestions, {
                        question: '', explanation: '', difficulty: 'medium',
                        options: [
                          { text: '', isCorrect: true },
                          { text: '', isCorrect: false },
                          { text: '', isCorrect: false },
                          { text: '', isCorrect: false },
                        ],
                      }],
                    }))}
                  >
                    <Plus className="w-3 h-3" /> Thêm câu hỏi
                  </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-0.5">
                  {form.testQuestions.map((q, qi) => (
                    <div key={qi} className="rounded-xl border overflow-hidden shadow-sm">
                      {/* Question card header */}
                      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-primary/8 to-transparent border-b">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                            {qi + 1}
                          </span>
                          <span className="text-[11px] font-semibold text-foreground">Câu hỏi</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm(f => ({
                            ...f, testQuestions: f.testQuestions.filter((_, i) => i !== qi),
                          }))}
                          className="text-[11px] font-medium text-muted-foreground/60 hover:text-red-500 transition-colors flex items-center gap-0.5"
                        >
                          <X className="w-3 h-3" /> Xóa
                        </button>
                      </div>

                      {/* Question body */}
                      <div className="p-3 space-y-3 bg-card">
                        {/* Question text */}
                        <Input
                          value={q.question}
                          placeholder="Nội dung câu hỏi..."
                          className="h-9 text-sm"
                          onChange={e => setForm(f => {
                            const qs = [...f.testQuestions];
                            qs[qi] = { ...qs[qi], question: e.target.value };
                            return { ...f, testQuestions: qs };
                          })}
                        />

                        {/* Options */}
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Lựa chọn — bấm ○ để đánh dấu đáp án đúng
                          </p>
                          {q.options.map((opt, oi) => (
                            <div
                              key={oi}
                              className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                opt.isCorrect
                                  ? 'border-emerald-400/40 bg-emerald-500/[0.06]'
                                  : 'border-border/60 hover:border-border hover:bg-muted/20'
                              }`}
                            >
                              {/* Radio toggle */}
                              <button
                                type="button"
                                onClick={() => setForm(f => {
                                  const qs = [...f.testQuestions];
                                  qs[qi] = {
                                    ...qs[qi],
                                    options: qs[qi].options.map((o, j) => ({ ...o, isCorrect: j === oi })),
                                  };
                                  return { ...f, testQuestions: qs };
                                })}
                                className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                                  opt.isCorrect
                                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                                    : 'border-border/60 hover:border-emerald-400'
                                }`}
                              >
                                {opt.isCorrect && <CheckCircle2 className="w-3 h-3" />}
                              </button>

                              {/* Option input */}
                              <input
                                type="text"
                                value={opt.text}
                                placeholder={`Lựa chọn ${oi + 1}`}
                                onChange={e => setForm(f => {
                                  const qs = [...f.testQuestions];
                                  const opts = [...qs[qi].options];
                                  opts[oi] = { ...opts[oi], text: e.target.value };
                                  qs[qi] = { ...qs[qi], options: opts };
                                  return { ...f, testQuestions: qs };
                                })}
                                className={`flex-1 text-xs bg-transparent border-0 outline-none placeholder:text-muted-foreground/50 ${
                                  opt.isCorrect ? 'font-semibold text-emerald-700' : ''
                                }`}
                              />

                              {/* Remove option */}
                              {q.options.length > 2 && (
                                <button
                                  type="button"
                                  className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                                  onClick={() => setForm(f => {
                                    const qs = [...f.testQuestions];
                                    qs[qi] = { ...qs[qi], options: qs[qi].options.filter((_, j) => j !== oi) };
                                    return { ...f, testQuestions: qs };
                                  })}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}

                          {/* Add option */}
                          {q.options.length < 6 && (
                            <button
                              type="button"
                              className="text-[11px] font-medium text-primary/70 hover:text-primary hover:underline flex items-center gap-1 ml-1 transition-colors"
                              onClick={() => setForm(f => {
                                const qs = [...f.testQuestions];
                                qs[qi] = { ...qs[qi], options: [...qs[qi].options, { text: '', isCorrect: false }] };
                                return { ...f, testQuestions: qs };
                              })}
                            >
                              <Plus className="w-3 h-3" /> Thêm lựa chọn
                            </button>
                          )}
                        </div>

                        {/* Explanation */}
                        <div className="rounded-lg bg-amber-500/[0.05] border border-amber-400/20 px-3 py-2 space-y-1.5">
                          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">
                            Giải thích đáp án (tùy chọn)
                          </p>
                          <input
                            type="text"
                            value={q.explanation}
                            placeholder="Giải thích tại sao đáp án này là đúng..."
                            onChange={e => setForm(f => {
                              const qs = [...f.testQuestions];
                              qs[qi] = { ...qs[qi], explanation: e.target.value };
                              return { ...f, testQuestions: qs };
                            })}
                            className="w-full text-xs bg-transparent border-0 outline-none placeholder:text-muted-foreground/40"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Empty state */}
                  {form.testQuestions.length === 0 && (
                    <div className="rounded-xl border border-dashed border-red-300/40 bg-red-500/[0.03] p-6 text-center">
                      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                        <HelpCircle className="w-5 h-5 text-red-400" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">Chưa có câu hỏi nào</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">Nhấn "Thêm câu hỏi" để bắt đầu</p>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* ── Section: Kỹ năng liên kết ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">Kỹ năng liên kết</span>
                {form.skills.length > 0 && (
                  <span className="text-[10px] text-white bg-primary px-1.5 py-0.5 rounded-full">
                    {form.skills.length}
                  </span>
                )}
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="max-h-36 overflow-y-auto border rounded-xl p-2 space-y-0.5 bg-muted/20">
                {skills.map(skill => {
                  const selected = form.skills.includes(skill._id);
                  return (
                    <button key={skill._id} type="button" onClick={() => toggleSkill(skill._id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left ${
                        selected
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-background text-foreground'
                      }`}>
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 text-[9px] font-bold transition-colors ${
                        selected ? 'border-primary bg-primary text-white' : 'border-border'
                      }`}>
                        {selected && '✓'}
                      </span>
                      <span className="text-base leading-none">{skill.icon}</span>
                      <span className="text-xs">{skill.name}</span>
                    </button>
                  );
                })}
                {skills.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Chưa có kỹ năng nào trong hệ thống</p>
                )}
              </div>
            </div>

            {/* ── Nổi bật toggle ── */}
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, isFeatured: !f.isFeatured }))}
              className={`w-full flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-200 text-left ${
                form.isFeatured
                  ? 'bg-amber-500/8 border-amber-400/40 shadow-sm shadow-amber-500/10'
                  : 'bg-muted/20 border-border hover:bg-muted/40 hover:border-border/80'
              }`}
            >
              {/* Custom toggle switch */}
              <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${
                form.isFeatured ? 'bg-amber-500' : 'bg-muted-foreground/30'
              }`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
                  form.isFeatured ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'
                }`} />
              </div>
              {/* Icon + text */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold flex items-center gap-1.5 ${
                  form.isFeatured ? 'text-amber-700' : 'text-foreground'
                }`}>
                  <Star className={`w-3.5 h-3.5 transition-all ${
                    form.isFeatured ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'
                  }`} />
                  Đánh dấu nổi bật
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Hiển thị ưu tiên trên đầu danh sách tài nguyên
                </p>
              </div>
              {/* Badge trạng thái */}
              {form.isFeatured && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-400/30 shrink-0">
                  Đang bật
                </span>
              )}
            </button>

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

// ─── Resource Card ─────────
// Type-specific icon background colors
const TYPE_ICON_BG = {
  content: 'bg-sky-500/10 text-sky-600',
  exercise: 'bg-amber-500/10 text-amber-600',
  test: 'bg-red-500/10 text-red-600',
};

function ResourceCard({ resource: r, onEdit, onDelete }) {
  const typeConf = TYPE_CONFIG[r.type] || TYPE_CONFIG.content;
  const TypeIcon = typeConf.icon;
  const skillCount = r.skills?.length || 0;
  const iconBg = TYPE_ICON_BG[r.type] || TYPE_ICON_BG.content;

  const borderColor = r.type === 'exercise' ? 'border-l-amber-400'
    : r.type === 'test' ? 'border-l-red-400'
    : 'border-l-sky-400';

  return (
    <div className={`rounded-xl border bg-card overflow-hidden group hover:shadow-md transition-all duration-200 border-l-4 ${borderColor}`}>
      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{r.title}</p>
                {r.isFeatured && <Star className="w-3.5 h-3.5 text-amber-500 fill-current flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  r.type === 'content' ? 'bg-sky-500/10 text-sky-600 border-sky-400/20'
                  : r.type === 'exercise' ? 'bg-amber-500/10 text-amber-600 border-amber-400/20'
                  : 'bg-red-500/10 text-red-600 border-red-400/20'
                }`}>{typeConf.label}</span>
                <span className="text-[10px] text-muted-foreground">{r.estimatedMinutes}ph</span>
                <span className="text-[10px] text-muted-foreground">{DIFFICULTY_LABELS[r.difficulty]}</span>
              </div>
            </div>
          </div>
          {r.url && (
            <a href={r.url} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete}
            className="p-1.5 rounded hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

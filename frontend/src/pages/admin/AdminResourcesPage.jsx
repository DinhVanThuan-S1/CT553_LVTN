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
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import {
  Plus, Search, BookOpen, Video, Globe, Wrench, BookMarked,
  Edit3, Trash2, ExternalLink, Star, Dumbbell,
  HelpCircle, FileText, ChevronLeft, ChevronRight, X,
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
        <DialogHeader onClose={() => setShowForm(false)}>
          {editingId ? 'Chỉnh sửa tài nguyên' : 'Thêm tài nguyên mới'}
        </DialogHeader>
        <form onSubmit={handleSave}>
          <DialogBody className="space-y-4 max-h-[72vh] overflow-y-auto">
            {/* Tên + loại */}
            <div>
              <label className="text-sm font-medium block mb-1.5">Tên tài nguyên *</label>
              <Input value={form.title} required
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="VD: Introduction to React Hooks" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1.5">Loại *</label>
                <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="content">📄 Nội dung</option>
                  <option value="exercise">💪 Bài tập</option>
                  <option value="test">📝 Bài test</option>
                </Select>
              </div>
              {form.type === 'content' && (
                <div>
                  <label className="text-sm font-medium block mb-1.5">Định dạng</label>
                  <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </Select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium block mb-1.5">Độ khó</label>
                <Select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                  <option value="beginner">Cơ bản</option>
                  <option value="intermediate">Trung bình</option>
                  <option value="advanced">Nâng cao</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Thời lượng (phút)</label>
                <Input type="number" min={1} value={form.estimatedMinutes}
                  onChange={e => setForm(f => ({ ...f, estimatedMinutes: e.target.value }))} />
              </div>
            </div>

            {/* URL nếu là content */}
            {form.type === 'content' && (
              <div>
                <label className="text-sm font-medium block mb-1.5">URL (nếu có)</label>
                <Input value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://..." />
              </div>
            )}

            {/* Mô tả */}
            <div>
              <label className="text-sm font-medium block mb-1.5">Mô tả</label>
              <Textarea value={form.description} rows={2}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả ngắn gọn..." />
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium block mb-1.5">Tags (phân cách bằng dấu phẩy)</label>
              <Input value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="JavaScript, React, Hooks..." />
            </div>

            {/* Nội dung chi tiết — cho exercise */}
            {(form.type === 'exercise' || form.type === 'content') && (
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  {form.type === 'exercise' ? 'Hướng dẫn bài tập' : 'Nội dung (Markdown)'}
                </label>
                <Textarea value={form.content} rows={4}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder={form.type === 'exercise'
                    ? 'Mô tả yêu cầu bài tập, các bước thực hiện...'
                    : 'Nội dung bài viết hoặc ghi chú...'} />
              </div>
            )}

            {/* URL cho exercise */}
            {form.type === 'exercise' && (
              <div>
                <label className="text-sm font-medium block mb-1.5">URL bài tập (nếu có)</label>
                <Input value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://github.com/..." />
              </div>
            )}

            {/* Test Questions Builder */}
            {form.type === 'test' && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Câu hỏi test ({form.testQuestions.length})</label>
                  <Button type="button" variant="outline" size="sm" className="gap-1 text-xs h-7"
                    onClick={() => setForm(f => ({
                      ...f,
                      testQuestions: [...f.testQuestions, {
                        question: '', explanation: '', difficulty: 'medium',
                        options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
                      }],
                    }))}>
                    <Plus className="w-3 h-3" /> Thêm câu hỏi
                  </Button>
                </div>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {form.testQuestions.map((q, qi) => (
                    <div key={qi} className="rounded-lg border p-3 space-y-2 bg-muted/10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary">Câu {qi + 1}</span>
                        <button type="button" onClick={() => setForm(f => ({
                          ...f, testQuestions: f.testQuestions.filter((_, i) => i !== qi),
                        }))} className="text-xs text-red-500 hover:underline">Xóa</button>
                      </div>
                      <Input value={q.question} placeholder="Nội dung câu hỏi..."
                        onChange={e => setForm(f => {
                          const qs = [...f.testQuestions];
                          qs[qi] = { ...qs[qi], question: e.target.value };
                          return { ...f, testQuestions: qs };
                        })} />
                      <div className="space-y-1">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <button type="button" onClick={() => setForm(f => {
                              const qs = [...f.testQuestions];
                              qs[qi] = {
                                ...qs[qi],
                                options: qs[qi].options.map((o, j) => ({ ...o, isCorrect: j === oi })),
                              };
                              return { ...f, testQuestions: qs };
                            })} className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[10px] ${opt.isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border hover:border-primary'
                              }`}>
                              {opt.isCorrect && '✓'}
                            </button>
                            <Input value={opt.text} placeholder={`Lựa chọn ${oi + 1}`}
                              className="h-8 text-xs"
                              onChange={e => setForm(f => {
                                const qs = [...f.testQuestions];
                                const opts = [...qs[qi].options];
                                opts[oi] = { ...opts[oi], text: e.target.value };
                                qs[qi] = { ...qs[qi], options: opts };
                                return { ...f, testQuestions: qs };
                              })} />
                            {q.options.length > 2 && (
                              <button type="button" className="text-muted-foreground hover:text-red-500 text-xs"
                                onClick={() => setForm(f => {
                                  const qs = [...f.testQuestions];
                                  qs[qi] = { ...qs[qi], options: qs[qi].options.filter((_, j) => j !== oi) };
                                  return { ...f, testQuestions: qs };
                                })}>×</button>
                            )}
                          </div>
                        ))}
                        {q.options.length < 6 && (
                          <button type="button" className="text-xs text-primary hover:underline ml-7"
                            onClick={() => setForm(f => {
                              const qs = [...f.testQuestions];
                              qs[qi] = { ...qs[qi], options: [...qs[qi].options, { text: '', isCorrect: false }] };
                              return { ...f, testQuestions: qs };
                            })}>+ Thêm lựa chọn</button>
                        )}
                      </div>
                      <Input value={q.explanation} placeholder="Giải thích đáp án (tùy chọn)"
                        className="h-8 text-xs"
                        onChange={e => setForm(f => {
                          const qs = [...f.testQuestions];
                          qs[qi] = { ...qs[qi], explanation: e.target.value };
                          return { ...f, testQuestions: qs };
                        })} />
                    </div>
                  ))}
                  {form.testQuestions.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Chưa có câu hỏi. Nhấn "Thêm câu hỏi" để bắt đầu.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Kỹ năng liên kết */}
            <div className="border-t pt-4">
              <label className="text-sm font-medium block mb-2">
                Kỹ năng liên kết ({form.skills.length} đã chọn)
              </label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                {skills.map(skill => {
                  const selected = form.skills.includes(skill._id);
                  return (
                    <button
                      key={skill._id}
                      type="button"
                      onClick={() => toggleSkill(skill._id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${selected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60'
                        }`}
                    >
                      <span className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 text-xs">
                        {selected ? '✓' : ''}
                      </span>
                      <span>{skill.icon} {skill.name}</span>
                    </button>
                  );
                })}
                {skills.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Chưa có kỹ năng</p>
                )}
              </div>
            </div>

            {/* Nổi bật */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured}
                onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                className="accent-primary w-4 h-4" />
              <div>
                <p className="text-sm font-medium">Đánh dấu nổi bật</p>
                <p className="text-xs text-muted-foreground">Hiển thị ưu tiên trong danh sách</p>
              </div>
            </label>
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

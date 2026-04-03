/**
 * SkillManagement - QL Kỹ năng
 * CRUD kỹ năng với resources, exercises, test questions
 */
import { useState, useEffect, useCallback } from 'react';
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
  Search, Plus, Pencil, Trash2, Target, Eye,
  ChevronLeft, ChevronRight, BookOpen, Dumbbell, HelpCircle, Clock,
  FileText, X,
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
  other: 'Khác',
};

const categoryColors = {
  programming: 'default',
  frontend: 'success',
  backend: 'warning',
  database: 'danger',
  devops: 'secondary',
  mobile: 'default',
  ai_ml: 'success',
  software_engineering: 'warning',
  soft_skills: 'secondary',
  networking: 'danger',
  other: 'outline',
};

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
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Kỹ Năng</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tổng {pagination.total} kỹ năng
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Thêm kỹ năng
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm tên kỹ năng..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className="pl-9"
          />
        </div>
        <Select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
          className="w-48"
        >
          <option value="">Tất cả nhóm</option>
          {Object.entries(categoryLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>

      {/* Grid Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kỹ Năng</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nhóm</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Giờ Học</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Nội Dung</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Bài Tập</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Câu Hỏi</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 w-16 skeleton" /></td>
                    ))}
                  </tr>
                ))
              ) : skills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Không có kỹ năng nào
                  </td>
                </tr>
              ) : (
                skills.map((skill) => (
                  <tr key={skill._id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{skill.icon}</span>
                        <span className="font-medium">{skill.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={categoryColors[skill.category]}>
                        {categoryLabels[skill.category]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{skill.estimatedHours}h</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium">
                        {(skill.linkedResources || []).filter(r => r.type === 'content').length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium">
                        {(skill.linkedResources || []).filter(r => r.type === 'exercise').length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium">
                        {(skill.linkedResources || []).filter(r => r.type === 'test').length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(skill)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(skill)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(skill)}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors">
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Trang {pagination.page}/{pagination.pages} • Tổng {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
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
        <DialogHeader onClose={() => setShowDetail(false)}>
          Chi tiết Kỹ năng
        </DialogHeader>
        {detailSkill && (
          <DialogBody className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{detailSkill.icon}</span>
              <div>
                <h3 className="font-semibold text-lg">{detailSkill.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={categoryColors[detailSkill.category]}>
                    {categoryLabels[detailSkill.category]}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {detailSkill.estimatedHours}h
                  </span>
                </div>
              </div>
            </div>

            {detailSkill.description && (
              <p className="text-sm text-muted-foreground">{detailSkill.description}</p>
            )}

            {/* Linked Resources — grouped by type */}
            {(() => {
              const linked = detailSkill.linkedResources || [];
              const contents = linked.filter(r => r.type === 'content');
              const exercises = linked.filter(r => r.type === 'exercise');
              const tests = linked.filter(r => r.type === 'test');

              return (
                <>
                  {/* Content Resources */}
                  <div>
                    <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4" /> Tài nguyên nội dung ({contents.length})
                    </h4>
                    {contents.length > 0 ? (
                      <div className="space-y-2">
                        {contents.map((res) => (
                          <div key={res._id} className="rounded-lg border p-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{res.title}</span>
                              <Badge variant="secondary">{res.category}</Badge>
                            </div>
                            {res.description && <p className="text-xs text-muted-foreground mt-1">{res.description}</p>}
                            {res.url && (
                              <a href={res.url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline mt-1 inline-block">🔗 {res.url}</a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Chưa có tài nguyên nội dung</p>
                    )}
                  </div>

                  {/* Exercises */}
                  <div>
                    <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                      <Dumbbell className="w-4 h-4" /> Bài tập ({exercises.length})
                    </h4>
                    {exercises.length > 0 ? (
                      <div className="space-y-2">
                        {exercises.map((ex) => (
                          <div key={ex._id} className="rounded-lg border p-3 text-sm">
                            <span className="font-medium">{ex.title}</span>
                            <Badge variant="secondary" className="ml-2">{ex.difficulty}</Badge>
                            {ex.description && <p className="text-xs text-muted-foreground mt-1">{ex.description}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Chưa có bài tập</p>
                    )}
                  </div>

                  {/* Test Resources */}
                  <div>
                    <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                      <HelpCircle className="w-4 h-4" /> Bài test ({tests.length})
                    </h4>
                    {tests.length > 0 ? (
                      <div className="space-y-2">
                        {tests.map((t) => (
                          <div key={t._id} className="rounded-lg border p-3 text-sm">
                            <span className="font-medium">{t.title}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              — {t.testQuestions?.length || 0} câu hỏi
                            </span>
                            {(t.testQuestions || []).map((q, i) => (
                              <div key={q._id || i} className="mt-2 ml-2 p-2 rounded bg-muted/20 text-xs">
                                <p className="font-medium">Câu {i + 1}: {q.question}</p>
                                <div className="mt-1 space-y-0.5">
                                  {q.options?.map((opt, j) => (
                                    <p key={j} className={`${opt.isCorrect ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                                      {opt.isCorrect ? '✓' : '○'} {opt.text}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Chưa có bài test</p>
                    )}
                  </div>
                </>
              );
            })()}
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
        </DialogFooter>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)}>
        <DialogHeader onClose={() => setShowForm(false)}>
          {editingId ? 'Chỉnh sửa kỹ năng' : 'Thêm kỹ năng mới'}
        </DialogHeader>
        <form onSubmit={handleSave}>
          <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <label className="text-sm font-medium mb-1.5 block">Icon</label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData((f) => ({ ...f, icon: e.target.value }))}
                  className="text-center text-lg"
                />
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium mb-1.5 block">Tên kỹ năng *</label>
                <Input
                  value={formData.name} required
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  placeholder="VD: React.js"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nhóm *</label>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))}
                >
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Giờ học ước tính</label>
                <Input
                  type="number" min={1}
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData((f) => ({ ...f, estimatedHours: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Mô tả</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Resource picker */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  Tài nguyên liên kết ({formData.linkedResources.length} đã chọn)
                </label>
                <a href="/admin/resources" target="_blank"
                  className="text-xs text-primary hover:underline">+ Thêm tài nguyên mới</a>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Tìm tài nguyên..."
                  value={resourceSearch}
                  onChange={e => setResourceSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <div className="max-h-44 overflow-y-auto border rounded-lg divide-y">
                {filteredResources.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {allResources.length === 0 ? 'Chưa có tài nguyên nào. Tạo từ trang Quản lý Tài nguyên.' : 'Không tìm thấy'}
                  </p>
                ) : filteredResources.map(resource => {
                  const TypeIcon = RESOURCE_TYPE_ICONS[resource.type] || FileText;
                  const selected = formData.linkedResources.includes(resource._id);
                  return (
                    <button
                      key={resource._id}
                      type="button"
                      onClick={() => toggleResource(resource._id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${selected ? 'bg-primary/8 text-primary' : 'hover:bg-muted/40'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] ${selected ? 'bg-primary border-primary text-white' : 'border-border'
                        }`}>
                        {selected && '✓'}
                      </div>
                      <TypeIcon className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block">{resource.title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {RESOURCE_TYPE_LABELS[resource.type]}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* Những resource đã chọn */}
              {formData.linkedResources.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.linkedResources.map(rid => {
                    const r = allResources.find(x => x._id === rid);
                    if (!r) return null;
                    return (
                      <span key={rid} className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {r.title}
                        <button type="button" onClick={() => toggleResource(rid)} className="hover:text-red-500">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
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

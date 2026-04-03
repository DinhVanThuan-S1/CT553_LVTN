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
} from 'lucide-react';

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

  function openCreate() {
    setFormData(initialForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(skill) {
    setFormData({
      name: skill.name,
      category: skill.category,
      description: skill.description || '',
      icon: skill.icon || '📘',
      estimatedHours: skill.estimatedHours || 20,
    });
    setEditingId(skill._id);
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, estimatedHours: Number(formData.estimatedHours) };
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
            Tổng {pagination.total} kỹ năng • Resources, bài tập, bài test
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kỹ năng</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nhóm</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Giờ học</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Resources</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Bài tập</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Câu hỏi</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Thao tác</th>
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
                      <span className="text-xs font-medium">{skill.resources?.length || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium">{skill.exercises?.length || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium">—</span>
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

            {/* Resources */}
            <div>
              <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4" /> Tài nguyên ({detailSkill.resources?.length || 0})
              </h4>
              {detailSkill.resources?.length > 0 ? (
                <div className="space-y-2">
                  {detailSkill.resources.map((res, i) => (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{res.title}</span>
                        <Badge variant="secondary">{res.type}</Badge>
                      </div>
                      {res.description && <p className="text-xs text-muted-foreground mt-1">{res.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có tài nguyên</p>
              )}
            </div>

            {/* Exercises */}
            <div>
              <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                <Dumbbell className="w-4 h-4" /> Bài tập ({detailSkill.exercises?.length || 0})
              </h4>
              {detailSkill.exercises?.length > 0 ? (
                <div className="space-y-2">
                  {detailSkill.exercises.map((ex, i) => (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <span className="font-medium">{ex.title}</span>
                      <Badge variant="secondary" className="ml-2">{ex.difficulty}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có bài tập</p>
              )}
            </div>

            {/* Test Questions */}
            <div>
              <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4" /> Câu hỏi test ({detailSkill.testQuestions?.length || 0})
              </h4>
              {detailSkill.testQuestions?.length > 0 ? (
                <div className="space-y-2">
                  {detailSkill.testQuestions.map((q, i) => (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">Câu {i + 1}: {q.question}</p>
                      <div className="mt-1 space-y-0.5">
                        {q.options?.map((opt, j) => (
                          <p key={j} className={`text-xs ${opt.isCorrect ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                            {opt.isCorrect ? '✓' : '○'} {opt.text}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có câu hỏi test</p>
              )}
            </div>
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
          <DialogBody className="space-y-4">
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
                rows={3}
              />
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

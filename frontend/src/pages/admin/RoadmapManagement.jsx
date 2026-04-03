/**
 * RoadmapManagement - QL Lộ trình mẫu (Admin)
 * CRUD lộ trình mẫu, chọn kỹ năng, gắn công việc liên quan
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
  Search, Plus, Pencil, Trash2, Eye, Route,
  ChevronLeft, ChevronRight, Clock, Users, Star,
  GripVertical, X, ArrowUp, ArrowDown,
} from 'lucide-react';

const difficultyLabels = { beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' };
const difficultyColors = { beginner: 'success', intermediate: 'warning', advanced: 'danger' };
const levelLabels = { beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' };

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
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Lộ Trình Mẫu</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tổng {pagination.total} lộ trình • Kéo thả sắp xếp kỹ năng
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Thêm lộ trình
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm lộ trình..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className="pl-9"
          />
        </div>
        <Select
          value={filterDifficulty}
          onChange={(e) => { setFilterDifficulty(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
          className="w-44"
        >
          <option value="">Tất cả mức độ</option>
          {Object.entries(difficultyLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lộ trình</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hướng nghề nghiệp</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Mức độ</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Kỹ năng</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Thời gian</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Đánh giá</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Đăng ký</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 w-16 skeleton" /></td>
                    ))}
                  </tr>
                ))
              ) : roadmaps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    Chưa có lộ trình nào
                  </td>
                </tr>
              ) : (
                roadmaps.map((rm) => (
                  <tr key={rm._id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Route className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium">{rm.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{rm.careerPath}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={difficultyColors[rm.difficulty]}>
                        {difficultyLabels[rm.difficulty]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">{rm.skills?.length || 0}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{rm.estimatedMonths} tháng</td>
                    <td className="px-4 py-3 text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs">{rm.averageRating?.toFixed(1) || '0.0'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Users className="w-3.5 h-3.5" /> {rm.enrollmentCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(rm)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(rm)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(rm)}
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
        <DialogHeader onClose={() => setShowDetail(false)}>Chi tiết Lộ trình</DialogHeader>
        {detailRoadmap && (
          <DialogBody className="space-y-5">
            <div>
              <h3 className="font-semibold text-lg">{detailRoadmap.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={difficultyColors[detailRoadmap.difficulty]}>
                  {difficultyLabels[detailRoadmap.difficulty]}
                </Badge>
                <span className="text-xs text-muted-foreground">{detailRoadmap.careerPath}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {detailRoadmap.estimatedMonths} tháng
                </span>
              </div>
            </div>
            {detailRoadmap.description && (
              <p className="text-sm text-muted-foreground">{detailRoadmap.description}</p>
            )}
            <div>
              <h4 className="font-medium text-sm mb-2">Kỹ năng ({detailRoadmap.skills?.length || 0})</h4>
              <div className="space-y-2">
                {(detailRoadmap.skills || [])
                  .sort((a, b) => a.order - b.order)
                  .map((s, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                      <span className="text-xs font-bold text-primary w-6 text-center">{s.order}</span>
                      <div className="flex-1">
                        <span className="font-medium text-sm">{s.skill?.name || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground ml-2">{s.estimatedHours}h</span>
                      </div>
                      <Badge variant="secondary">{levelLabels[s.targetLevel]}</Badge>
                    </div>
                  ))}
                {(!detailRoadmap.skills || detailRoadmap.skills.length === 0) && (
                  <p className="text-sm text-muted-foreground">Chưa có kỹ năng</p>
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

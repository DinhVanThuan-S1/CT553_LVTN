/**
 * CourseManagement - QL Học phần
 * CRUD: Danh sách, thêm, sửa, xóa học phần
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
import {
  Search, Plus, Pencil, Trash2, BookOpen,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const courseTypeLabels = {
  required: 'Bắt buộc',
  elective: 'Tự chọn',
  thesis: 'Luận văn',
  internship: 'Thực tập',
  general: 'Đại cương',
};

const courseTypeBadge = {
  required: 'default',
  elective: 'warning',
  thesis: 'success',
  internship: 'secondary',
  general: 'outline',
};

const initialForm = {
  code: '', name: '', credits: 2, courseType: 'required',
  prerequisites: '', corequisites: '',
  description: '', theoryKnowledge: '', practiceKnowledge: '',
};

export default function CourseManagement() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 15 });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (filterType) params.courseType = filterType;
      const { data } = await api.get('/courses', { params });
      setCourses(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Không thể tải danh sách học phần');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, filterType]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  function openCreate() {
    setFormData(initialForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(course) {
    setFormData({
      code: course.code,
      name: course.name,
      credits: course.credits,
      courseType: course.courseType,
      prerequisites: (course.prerequisites || []).join(', '),
      corequisites: (course.corequisites || []).join(', '),
      description: course.description || '',
      theoryKnowledge: course.theoryKnowledge || '',
      practiceKnowledge: course.practiceKnowledge || '',
    });
    setEditingId(course._id);
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        credits: Number(formData.credits),
        prerequisites: formData.prerequisites ? formData.prerequisites.split(',').map((s) => s.trim()).filter(Boolean) : [],
        corequisites: formData.corequisites ? formData.corequisites.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };

      if (editingId) {
        await api.put(`/courses/${editingId}`, payload);
        toast.success('Cập nhật học phần thành công');
      } else {
        await api.post('/courses', payload);
        toast.success('Tạo học phần thành công');
      }
      setShowForm(false);
      loadCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bạn có chắc muốn xóa học phần này?')) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success('Đã xóa học phần');
      loadCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">QL Học phần</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tổng {pagination.total} học phần trong hệ thống
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Thêm học phần
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm mã HP, tên HP..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className="pl-9"
          />
        </div>
        <Select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
          className="w-36"
        >
          <option value="">Tất cả loại</option>
          {Object.entries(courseTypeLabels).map(([k, v]) => (
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-20">Mã HP</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tên học phần</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground w-16">TC</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-24">Loại</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-32">Tiên quyết</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3"><div className="h-4 w-14 skeleton" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-48 skeleton" /></td>
                    <td className="px-4 py-3 text-center"><div className="h-4 w-6 skeleton mx-auto" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 skeleton" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 skeleton" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 skeleton ml-auto" /></td>
                  </tr>
                ))
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Không có học phần nào
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course._id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{course.code}</td>
                    <td className="px-4 py-3 font-medium">{course.name}</td>
                    <td className="px-4 py-3 text-center">{course.credits}</td>
                    <td className="px-4 py-3">
                      <Badge variant={courseTypeBadge[course.courseType]}>
                        {courseTypeLabels[course.courseType]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {course.prerequisites?.length > 0 ? course.prerequisites.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(course)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(course._id)}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors"
                        >
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

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} className="max-w-2xl">
        <DialogHeader onClose={() => setShowForm(false)}>
          {editingId ? 'Chỉnh sửa học phần' : 'Thêm học phần mới'}
        </DialogHeader>
        <form onSubmit={handleSave}>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Mã học phần *</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData((f) => ({ ...f, code: e.target.value }))}
                  placeholder="VD: CT101"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Số tín chỉ *</label>
                <Input
                  type="number" min={1} max={10}
                  value={formData.credits}
                  onChange={(e) => setFormData((f) => ({ ...f, credits: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tên học phần *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="VD: Nhập môn lập trình"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Loại học phần</label>
              <Select
                value={formData.courseType}
                onChange={(e) => setFormData((f) => ({ ...f, courseType: e.target.value }))}
              >
                {Object.entries(courseTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tiên quyết</label>
                <Input
                  value={formData.prerequisites}
                  onChange={(e) => setFormData((f) => ({ ...f, prerequisites: e.target.value }))}
                  placeholder="CT101, CT177"
                />
                <p className="text-xs text-muted-foreground mt-1">Phân cách bằng dấu phẩy</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Song hành</label>
                <Input
                  value={formData.corequisites}
                  onChange={(e) => setFormData((f) => ({ ...f, corequisites: e.target.value }))}
                  placeholder="CT178"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Mô tả</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả học phần..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Kiến thức lý thuyết</label>
                <Textarea
                  value={formData.theoryKnowledge}
                  onChange={(e) => setFormData((f) => ({ ...f, theoryKnowledge: e.target.value }))}
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Kiến thức thực hành</label>
                <Textarea
                  value={formData.practiceKnowledge}
                  onChange={(e) => setFormData((f) => ({ ...f, practiceKnowledge: e.target.value }))}
                  rows={2}
                />
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
    </div>
  );
}

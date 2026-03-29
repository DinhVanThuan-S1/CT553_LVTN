/**
 * CurriculumManagement - QL Chương trình đào tạo
 * Danh sách CTĐT + xem chi tiết (semesters + courses)
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  Search, Plus, Pencil, Trash2, Eye, GraduationCap,
  ChevronDown, ChevronRight, BookOpen, Calendar,
} from 'lucide-react';

const initialForm = { code: '', name: '', department: '', university: 'Trường Đại học Cần Thơ', description: '', totalCredits: 0 };

export default function CurriculumManagement() {
  const toast = useToast();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [expandedSemesters, setExpandedSemesters] = useState({});

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const { data } = await api.get('/curriculum-programs', { params });
      setPrograms(data.data);
    } catch {
      toast.error('Không thể tải danh sách CTĐT');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadPrograms(); }, [loadPrograms]);

  async function openDetail(program) {
    setShowDetail(true);
    setLoadingDetail(true);
    try {
      const { data } = await api.get(`/curriculum-programs/${program._id}`);
      setDetail(data.data);
      // Mở tất cả semesters
      const expanded = {};
      (data.data.semesterDetails || []).forEach((s) => { expanded[s._id] = true; });
      setExpandedSemesters(expanded);
    } catch {
      toast.error('Không thể tải chi tiết CTĐT');
    } finally {
      setLoadingDetail(false);
    }
  }

  function openCreate() {
    setFormData(initialForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(program) {
    setFormData({
      code: program.code,
      name: program.name,
      department: program.department || '',
      university: program.university || 'Trường Đại học Cần Thơ',
      description: program.description || '',
      totalCredits: program.totalCredits || 0,
    });
    setEditingId(program._id);
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, totalCredits: Number(formData.totalCredits) };
      if (editingId) {
        await api.put(`/curriculum-programs/${editingId}`, payload);
        toast.success('Cập nhật CTĐT thành công');
      } else {
        await api.post('/curriculum-programs', payload);
        toast.success('Tạo CTĐT thành công');
      }
      setShowForm(false);
      loadPrograms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bạn có chắc muốn xóa CTĐT này?')) return;
    try {
      await api.delete(`/curriculum-programs/${id}`);
      toast.success('Đã xóa CTĐT');
      loadPrograms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  function toggleSemester(id) {
    setExpandedSemesters((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">QL Chương trình đào tạo</h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý CTĐT, học kỳ và học phần</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Thêm CTĐT
        </Button>
      </div>

      {/* Search */}
      <div className="rounded-xl border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm mã, tên CTĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Programs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-6">
              <div className="h-5 w-40 skeleton mb-2" />
              <div className="h-4 w-60 skeleton mb-4" />
              <div className="h-3 w-32 skeleton" />
            </div>
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          Chưa có CTĐT nào
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map((program) => (
            <div key={program._id} className="rounded-xl border bg-card p-5 card-hover group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="default">{program.code}</Badge>
                    <Badge variant="secondary">{program.totalCredits} TC</Badge>
                  </div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {program.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openDetail(program)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEdit(program)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(program._id)}
                    className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {program.department && <p>{program.department}</p>}
                <p>{program.university}</p>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {program.semesters?.length || 0} học kỳ
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetail} onClose={() => setShowDetail(false)} className="max-w-3xl">
        <DialogHeader onClose={() => setShowDetail(false)}>
          Chi tiết Chương trình Đào tạo
        </DialogHeader>
        <DialogBody>
          {loadingDetail ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 skeleton rounded-lg" />)}
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{detail.name}</h3>
                <p className="text-sm text-muted-foreground">{detail.code} • {detail.totalCredits} tín chỉ</p>
              </div>

              {/* Semesters */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  Danh sách học kỳ ({detail.semesterDetails?.length || 0})
                </h4>
                {(detail.semesterDetails || []).map((semester) => (
                  <div key={semester._id} className="rounded-lg border">
                    <button
                      onClick={() => toggleSemester(semester._id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {expandedSemesters[semester._id] ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm">{semester.name}</span>
                        <Badge variant="secondary">{semester.courses?.length || 0} HP</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {semester.requiredCredits || 0} TC bắt buộc
                      </span>
                    </button>
                    {expandedSemesters[semester._id] && (
                      <div className="border-t px-4 py-2">
                        {semester.courses?.length > 0 ? (
                          <div className="space-y-1">
                            {semester.courses.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between py-1.5 text-sm">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="font-mono text-xs text-primary">{item.course?.code}</span>
                                  <span>{item.course?.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">{item.course?.credits} TC</span>
                                  {!item.isRequired && <Badge variant="warning">Tự chọn</Badge>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">Chưa có học phần</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
        </DialogFooter>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} className="max-w-lg">
        <DialogHeader onClose={() => setShowForm(false)}>
          {editingId ? 'Chỉnh sửa CTĐT' : 'Thêm CTĐT mới'}
        </DialogHeader>
        <form onSubmit={handleSave}>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Mã CTĐT *</label>
                <Input
                  value={formData.code} required
                  onChange={(e) => setFormData((f) => ({ ...f, code: e.target.value }))}
                  placeholder="VD: KTPM-K50"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tổng tín chỉ</label>
                <Input
                  type="number" min={0}
                  value={formData.totalCredits}
                  onChange={(e) => setFormData((f) => ({ ...f, totalCredits: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tên CTĐT *</label>
              <Input
                value={formData.name} required
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="VD: Kỹ thuật Phần mềm K50"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Khoa</label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData((f) => ({ ...f, department: e.target.value }))}
                placeholder="VD: CNTT & Truyền thông"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Trường</label>
              <Input
                value={formData.university}
                onChange={(e) => setFormData((f) => ({ ...f, university: e.target.value }))}
              />
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
    </div>
  );
}

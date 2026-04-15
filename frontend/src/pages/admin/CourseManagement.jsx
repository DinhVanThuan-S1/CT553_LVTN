/**
 * CourseManagement - QL Học phần
 * CRUD + Chi tiết + Loại + Phân loại + Điều kiện + GPA flags
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
import {
  Search, Plus, Pencil, Trash2, Eye, BookOpen,
  ChevronLeft, ChevronRight, AlertCircle, Info,
  SlidersHorizontal, ChevronDown,
} from 'lucide-react';

// === Labels & Badge maps ===
const courseTypeLabels = {
  required: 'Bắt buộc',
  elective: 'Tự chọn',
};
const courseTypeBadge = {
  required: 'default',
  elective: 'warning',
};

const courseCategoryLabels = {
  general: 'Đại cương',
  foundation: 'Cơ sở ngành',
  specialized: 'Chuyên ngành',
};
const courseCategoryBadge = {
  general: 'outline',
  foundation: 'secondary',
  specialized: 'default',
};

const initialForm = {
  code: '', name: '', credits: 2,
  courseType: 'required', courseCategory: 'general',
  prerequisites: '', corequisites: '', condition: '',
  description: '', theoryKnowledge: '', practiceKnowledge: '',
  excludeFromCumulativeGPA: false, excludeFromSemesterGPA: false,
};

export default function CourseManagement() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 15 });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailCourse, setDetailCourse] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showCatMenu, setShowCatMenu] = useState(false);
  const typeMenuRef = useRef(null);
  const catMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target)) setShowTypeMenu(false);
      if (catMenuRef.current && !catMenuRef.current.contains(e.target)) setShowCatMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (filterType) params.courseType = filterType;
      if (filterCategory) params.courseCategory = filterCategory;
      const { data } = await api.get('/courses', { params });
      setCourses(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Không thể tải danh sách học phần');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, filterType, filterCategory]);

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
      courseType: course.courseType || 'required',
      courseCategory: course.courseCategory || 'general',
      prerequisites: (course.prerequisites || []).join(', '),
      corequisites: (course.corequisites || []).join(', '),
      condition: course.condition || '',
      description: course.description || '',
      theoryKnowledge: course.theoryKnowledge || '',
      practiceKnowledge: course.practiceKnowledge || '',
      excludeFromCumulativeGPA: course.excludeFromCumulativeGPA || false,
      excludeFromSemesterGPA: course.excludeFromSemesterGPA || false,
    });
    setEditingId(course._id);
    setShowForm(true);
  }

  function openDetail(course) {
    setDetailCourse(course);
    setShowDetail(true);
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

  async function handleDelete() {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await api.delete(`/courses/${deleteConfirmId}`);
      toast.success('Đã xóa học phần');
      setDeleteConfirmId(null);
      loadCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setDeleting(false);
    }
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
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Quản Lý Học Phần</span>
            </div>
            <p className="text-muted-foreground text-sm mt-1.5">
              Tổng <strong className="text-foreground">{pagination.total}</strong> học phần trong hệ thống
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Thêm học phần
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
            placeholder="Tìm mã HP, tên HP..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className="pl-9"
          />
        </div>

        {/* Loại dropdown */}
        <div className="relative shrink-0" ref={typeMenuRef}>
          <button
            type="button"
            onClick={() => { setShowTypeMenu(v => !v); setShowCatMenu(false); }}
            className={`h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all min-w-[140px] ${
              showTypeMenu ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1'
                : 'border-input bg-background text-foreground hover:border-primary/60'
            }`}
          >
            <span className="flex-1 text-left truncate">
              {filterType === '' ? 'Tất cả Loại' : courseTypeLabels[filterType]}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${showTypeMenu ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
          </button>
          {showTypeMenu && (
            <div className="absolute left-0 top-full mt-1.5 z-30 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden w-44 animate-fade-in">
              <div className="py-1.5">
                {[{ value: '', label: 'Tất cả Loại' }, ...Object.entries(courseTypeLabels).map(([k, v]) => ({ value: k, label: v }))].map(({ value, label }) => (
                  <button key={value} type="button"
                    onClick={() => { setFilterType(value); setPagination((p) => ({ ...p, page: 1 })); setShowTypeMenu(false); }}
                    className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${
                      filterType === value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted/50'
                    }`}>
                    {filterType === value && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    <span className={filterType === value ? '' : 'ml-3.5'}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phân loại dropdown */}
        <div className="relative shrink-0" ref={catMenuRef}>
          <button
            type="button"
            onClick={() => { setShowCatMenu(v => !v); setShowTypeMenu(false); }}
            className={`h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all min-w-[160px] ${
              showCatMenu ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1'
                : 'border-input bg-background text-foreground hover:border-primary/60'
            }`}
          >
            <span className="flex-1 text-left truncate">
              {filterCategory === '' ? 'Tất cả Phân Loại' : courseCategoryLabels[filterCategory]}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${showCatMenu ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
          </button>
          {showCatMenu && (
            <div className="absolute left-0 top-full mt-1.5 z-30 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden w-48 animate-fade-in">
              <div className="py-1.5">
                {[{ value: '', label: 'Tất cả Phân Loại' }, ...Object.entries(courseCategoryLabels).map(([k, v]) => ({ value: k, label: v }))].map(({ value, label }) => (
                  <button key={value} type="button"
                    onClick={() => { setFilterCategory(value); setPagination((p) => ({ ...p, page: 1 })); setShowCatMenu(false); }}
                    className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${
                      filterCategory === value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted/50'
                    }`}>
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
                <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-20">Mã HP</th>
                <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Tên Học Phần</th>
                <th className="text-center px-3 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-12">TC</th>
                <th className="text-center px-3 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-28">Loại</th>
                <th className="text-center px-3 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-36">Phân Loại</th>
                <th className="text-center px-3 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-28">TQ / SH</th>
                <th className="text-center px-3 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-32">Điều Kiện</th>
                <th className="text-right px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3.5 text-center"><div className="h-4 w-14 skeleton mx-auto rounded" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-44 skeleton rounded" /></td>
                    <td className="px-3 py-3.5 text-center"><div className="h-4 w-6 skeleton mx-auto rounded" /></td>
                    <td className="px-3 py-3.5 text-center"><div className="h-5 w-16 skeleton mx-auto rounded-full" /></td>
                    <td className="px-3 py-3.5 text-center"><div className="h-5 w-20 skeleton mx-auto rounded-full" /></td>
                    <td className="px-3 py-3.5 text-center"><div className="h-4 w-14 skeleton mx-auto rounded" /></td>
                    <td className="px-3 py-3.5 text-center"><div className="h-4 w-20 skeleton mx-auto rounded" /></td>
                    <td className="px-4 py-3.5"><div className="h-7 w-20 skeleton rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Không có học phần nào</p>
                    <p className="text-xs text-muted-foreground mt-1">Thử thay đổi bộ lọc</p>
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course._id} className="border-b hover:bg-muted/20 transition-colors group">
                    {/* Mã HP */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{course.code}</span>
                    </td>
                    {/* Tên */}
                    <td className="px-4 py-3.5 font-medium max-w-[200px] truncate group-hover:text-primary transition-colors" title={course.name}>
                      {course.name}
                    </td>
                    {/* TC */}
                    <td className="px-3 py-3.5 text-center">
                      <span className="text-xs font-bold text-muted-foreground">{course.credits}</span>
                    </td>
                    {/* Loại */}
                    <td className="px-3 py-3.5 text-center">
                      {course.courseType === 'required' ? (
                        <span className="inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Bắt buộc</span>
                      ) : (
                        <span className="inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-400/20">Tự chọn</span>
                      )}
                    </td>
                    {/* Phân loại */}
                    <td className="px-3 py-3.5 text-center">
                      {course.courseCategory === 'general' && (
                        <span className="inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border">Đại cương</span>
                      )}
                      {course.courseCategory === 'foundation' && (
                        <span className="inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-400/20">Cơ sở ngành</span>
                      )}
                      {course.courseCategory === 'specialized' && (
                        <span className="inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-400/20">Chuyên ngành</span>
                      )}
                      {!course.courseCategory && <span className="text-muted-foreground">—</span>}
                    </td>
                    {/* TQ / SH */}
                    <td className="px-3 py-3.5 text-xs text-muted-foreground text-center">
                      {[...(course.prerequisites || []), ...(course.corequisites || [])].length > 0
                        ? [course.prerequisites?.join(', '), course.corequisites?.join(', ')].filter(Boolean).join(' / ')
                        : <span>—</span>}
                    </td>
                    {/* Điều kiện */}
                    <td className="px-3 py-3.5 text-xs text-muted-foreground text-center">
                      <span className="truncate block max-w-[120px] mx-auto" title={course.condition}>{course.condition || '—'}</span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(course)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary" title="Xem chi tiết">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(course)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Chỉnh sửa">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirmId(course._id)}
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/10">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">{pagination.total}</strong> học phần • Trang {pagination.page}/{pagination.pages}
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

      {/* ===== Detail Dialog ===== */}
      <Dialog open={showDetail} onClose={() => setShowDetail(false)} className="max-w-2xl">
        <DialogHeader onClose={() => setShowDetail(false)}>
          Chi tiết Học phần
        </DialogHeader>
        {detailCourse && (
          <DialogBody className="space-y-5">
            {/* Header info */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{detailCourse.name}</h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{detailCourse.code}</span>
                  <Badge variant="secondary">{detailCourse.credits} tín chỉ</Badge>
                  <Badge variant={courseTypeBadge[detailCourse.courseType]}>
                    {courseTypeLabels[detailCourse.courseType]}
                  </Badge>
                  <Badge variant={courseCategoryBadge[detailCourse.courseCategory]}>
                    {courseCategoryLabels[detailCourse.courseCategory] || '—'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Grid info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Tiên quyết</p>
                <p className="text-sm font-medium">
                  {detailCourse.prerequisites?.length > 0 ? detailCourse.prerequisites.join(', ') : 'Không có'}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Song hành</p>
                <p className="text-sm font-medium">
                  {detailCourse.corequisites?.length > 0 ? detailCourse.corequisites.join(', ') : 'Không có'}
                </p>
              </div>
            </div>

            {/* Condition */}
            {detailCourse.condition && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-600 mb-0.5">Điều kiện đăng ký</p>
                  <p className="text-sm">{detailCourse.condition}</p>
                </div>
              </div>
            )}

            {/* GPA flags */}
            {(detailCourse.excludeFromCumulativeGPA || detailCourse.excludeFromSemesterGPA) && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-sm space-y-0.5">
                  {detailCourse.excludeFromCumulativeGPA && (
                    <p>• Không tính vào GPA tích lũy</p>
                  )}
                  {detailCourse.excludeFromSemesterGPA && (
                    <p>• Không tính vào GPA học kỳ</p>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {detailCourse.description && (
              <div>
                <h4 className="text-sm font-medium mb-1.5">Mô tả</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailCourse.description}</p>
              </div>
            )}

            {/* Knowledge */}
            <div className="grid grid-cols-2 gap-4">
              {detailCourse.theoryKnowledge && (
                <div>
                  <h4 className="text-sm font-medium mb-1.5">Kiến thức lý thuyết</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailCourse.theoryKnowledge}</p>
                </div>
              )}
              {detailCourse.practiceKnowledge && (
                <div>
                  <h4 className="text-sm font-medium mb-1.5">Kiến thức thực hành</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailCourse.practiceKnowledge}</p>
                </div>
              )}
            </div>
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
          <Button size="sm" onClick={() => { setShowDetail(false); openEdit(detailCourse); }}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Chỉnh sửa
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ===== Form Dialog ===== */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} className="max-w-2xl">
        <DialogHeader onClose={() => setShowForm(false)}>
          {editingId ? 'Chỉnh sửa học phần' : 'Thêm học phần mới'}
        </DialogHeader>
        <form onSubmit={handleSave}>
          <DialogBody className="space-y-4">
            {/* Row 1: Code + Credits */}
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
                  type="number" min={1} max={30}
                  value={formData.credits}
                  onChange={(e) => setFormData((f) => ({ ...f, credits: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Row 2: Name */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tên học phần *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="VD: Nhập môn lập trình"
                required
              />
            </div>

            {/* Row 3: courseType + courseCategory */}
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="text-sm font-medium mb-1.5 block">Phân loại</label>
                <Select
                  value={formData.courseCategory}
                  onChange={(e) => setFormData((f) => ({ ...f, courseCategory: e.target.value }))}
                >
                  {Object.entries(courseCategoryLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Row 4: Prerequisites + Corequisites */}
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
                />
              </div>
            </div>

            {/* Row 5: Condition */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Điều kiện đăng ký</label>
              <Input
                value={formData.condition}
                onChange={(e) => setFormData((f) => ({ ...f, condition: e.target.value }))}
                placeholder="VD: Tích lũy >= 125 TC"
              />
              <p className="text-xs text-muted-foreground mt-1">VD: CT553E cần tích lũy &ge; 125 tín chỉ</p>
            </div>

            {/* Row 6: GPA checkboxes */}
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-medium">Tùy chọn tính GPA</p>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.excludeFromCumulativeGPA}
                  onChange={(e) => setFormData((f) => ({ ...f, excludeFromCumulativeGPA: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-[hsl(var(--primary))]"
                />
                <span className="text-sm group-hover:text-foreground text-muted-foreground">Không tính vào GPA tích lũy</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.excludeFromSemesterGPA}
                  onChange={(e) => setFormData((f) => ({ ...f, excludeFromSemesterGPA: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-[hsl(var(--primary))]"
                />
                <span className="text-sm group-hover:text-foreground text-muted-foreground">Không tính vào GPA học kỳ</span>
              </label>
            </div>

            {/* Row 7: Description */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Mô tả</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả học phần..."
                rows={3}
              />
            </div>

            {/* Row 8: Theory + Practice */}
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

      {/* ===== Confirm Delete Dialog ===== */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} className="max-w-sm">
        <DialogHeader onClose={() => setDeleteConfirmId(null)}>
          Xác nhận xóa học phần
        </DialogHeader>
        <DialogBody>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Bạn có chắc muốn xóa học phần này?</p>
              <p className="text-muted-foreground text-xs mt-1">
                Học phần sẽ bị ẩn khỏi hệ thống. Hành động này không thể hoàn tác.
              </p>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
            Hủy
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

/**
 * CourseManagement - QL Học phần
 * CRUD + Chi tiết + Loại + Phân loại + Điều kiện + GPA flags
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog, DialogBody, DialogHeader, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  Search, Plus, Pencil, Trash2, Eye, BookOpen,
  ChevronLeft, ChevronRight, AlertCircle, Info, X,
  SlidersHorizontal, ChevronDown, GraduationCap, Hash, Link2, Cpu, Check, ArrowUpDown,
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
  relatedSkills: [],
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
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');
  const typeMenuRef = useRef(null);
  const catMenuRef = useRef(null);
  const sortMenuRef = useRef(null);
  // Skills
  const [allSkills, setAllSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');
  // Skills đã bị xóa khỏi hệ thống nhưng vẫn còn trong course
  const [orphanSkillsMap, setOrphanSkillsMap] = useState({});

  useEffect(() => {
    function handleClickOutside(e) {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target)) setShowTypeMenu(false);
      if (catMenuRef.current && !catMenuRef.current.contains(e.target)) setShowCatMenu(false);
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) setShowSortMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load all skills once
  useEffect(() => {
    api.get('/skills/all')
      .then(({ data }) => setAllSkills(data.data || []))
      .catch(() => {});
  }, []);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (filterType) params.courseType = filterType;
      if (filterCategory) params.courseCategory = filterCategory;
      params.sort = sortOrder === 'desc' ? '-createdAt' : 'createdAt';
      const { data } = await api.get('/courses', { params });
      setCourses(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Không thể tải danh sách học phần');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, filterType, filterCategory, sortOrder]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  function openCreate() {
    setFormData(initialForm);
    setSkillSearch('');
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(course) {
    const relatedSkillObjs = course.relatedSkills || [];
    const ids = relatedSkillObjs.map(s => s._id || s);
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
      relatedSkills: ids,
    });
    // Build map of orphan skills (deleted from system but still linked to course)
    const orphan = {};
    relatedSkillObjs.forEach(s => {
      const exists = allSkills.some(sk => sk._id === (s._id || s));
      if (!exists && s._id) orphan[s._id] = { name: s.name || '?', icon: s.icon || '' };
    });
    setOrphanSkillsMap(orphan);
    setSkillSearch('');
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
        relatedSkills: formData.relatedSkills,
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
            className={`h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all min-w-[140px] ${showTypeMenu ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1'
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
                    className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${filterType === value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted/50'
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
            className={`h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all min-w-[160px] ${showCatMenu ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1'
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
                    className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${filterCategory === value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted/50'
                      }`}>
                    {filterCategory === value && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    <span className={filterCategory === value ? '' : 'ml-3.5'}>{label}</span>
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
            onClick={() => { setShowSortMenu(v => !v); setShowTypeMenu(false); setShowCatMenu(false); }}
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
        {/* Gradient header */}
        {detailCourse && (
          <div className="relative overflow-hidden rounded-t-xl border-b bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 border border-primary/10">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground leading-tight">{detailCourse.name}</h2>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {detailCourse.code}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {detailCourse.credits} tín chỉ
                    </span>
                    {/* Course type badge */}
                    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border ${detailCourse.courseType === 'required'
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-amber-500/10 text-amber-600 border-amber-400/20'
                      }`}>
                      {courseTypeLabels[detailCourse.courseType]}
                    </span>
                    {/* Category badge */}
                    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border ${detailCourse.courseCategory === 'general' ? 'bg-muted text-muted-foreground border-border' :
                        detailCourse.courseCategory === 'foundation' ? 'bg-blue-500/10 text-blue-600 border-blue-400/20' :
                          'bg-emerald-500/10 text-emerald-600 border-emerald-400/20'
                      }`}>
                      {courseCategoryLabels[detailCourse.courseCategory] || '—'}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)}
                className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {detailCourse && (
          <DialogBody className="max-h-[62vh] overflow-y-auto px-6 py-5 space-y-5">

            {/* Tiên quyết / Song hành */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-card p-3.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Link2 className="w-3.5 h-3.5 text-primary" />
                  <p className="text-[11px] font-bold text-primary uppercase tracking-widest">Tiên quyết</p>
                </div>
                <p className="text-sm font-medium">
                  {detailCourse.prerequisites?.length > 0
                    ? detailCourse.prerequisites.map(c => (
                      <span key={c} className="inline-block font-mono text-[11px] bg-primary/8 text-primary px-1.5 py-0.5 rounded mr-1 mb-1">{c}</span>
                    ))
                    : <span className="text-muted-foreground text-sm">Không có</span>}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-3.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Link2 className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">Song hành</p>
                </div>
                <p className="text-sm font-medium">
                  {detailCourse.corequisites?.length > 0
                    ? detailCourse.corequisites.map(c => (
                      <span key={c} className="inline-block font-mono text-[11px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded mr-1 mb-1">{c}</span>
                    ))
                    : <span className="text-muted-foreground text-sm">Không có</span>}
                </p>
              </div>
            </div>

            {/* Điều kiện đăng ký */}
            {detailCourse.condition && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest mb-1">Điều kiện đăng ký</p>
                  <p className="text-sm">{detailCourse.condition}</p>
                </div>
              </div>
            )}

            {/* GPA flags */}
            {(detailCourse.excludeFromCumulativeGPA || detailCourse.excludeFromSemesterGPA) && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-sm space-y-1">
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-1">Tùy chọn GPA</p>
                  {detailCourse.excludeFromCumulativeGPA && (
                    <p className="text-muted-foreground">• Không tính vào GPA tích lũy</p>
                  )}
                  {detailCourse.excludeFromSemesterGPA && (
                    <p className="text-muted-foreground">• Không tính vào GPA học kỳ</p>
                  )}
                </div>
              </div>
            )}


            {/* Kỹ năng liên quan */}
            {detailCourse.relatedSkills?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Kỹ năng liên quan</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {detailCourse.relatedSkills.map(sk => (
                    <span key={sk._id} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      {sk.icon} {sk.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mô tả */}
            {detailCourse.description && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Mô tả</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed pl-1">{detailCourse.description}</p>
              </div>
            )}

            {/* Kiến thức */}
            {(detailCourse.theoryKnowledge || detailCourse.practiceKnowledge) && (
              <div className="grid grid-cols-2 gap-4">
                {detailCourse.theoryKnowledge && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3 h-3 text-indigo-500" />
                      <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">Lý thuyết</p>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{detailCourse.theoryKnowledge}</p>
                  </div>
                )}
                {detailCourse.practiceKnowledge && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3 h-3 text-emerald-500" />
                      <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Thực hành</p>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{detailCourse.practiceKnowledge}</p>
                  </div>
                )}
              </div>
            )}
          </DialogBody>
        )}

        <DialogFooter className="border-t bg-muted/20 rounded-b-xl px-6 py-4">
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
          {detailCourse && (
            <Button size="sm" className="gap-2" onClick={() => { setShowDetail(false); openEdit(detailCourse); }}>
              <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
            </Button>
          )}
        </DialogFooter>
      </Dialog>

      {/* ===== Form Dialog ===== */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} className="max-w-2xl">
        {/* Gradient header */}
        <div className="relative overflow-hidden rounded-t-xl border-b bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${editingId ? 'bg-amber-500/15 text-amber-600' : 'bg-primary/15 text-primary'
                }`}>
                {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground leading-tight">
                  {editingId ? 'Chỉnh sửa học phần' : 'Thêm học phần mới'}
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {editingId ? 'Cập nhật thông tin học phần trong chương trình' : 'Tạo học phần mới cho chương trình đào tạo'}
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
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Thông tin cơ bản</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Mã HP + Tín chỉ */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Mã học phần <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData((f) => ({ ...f, code: e.target.value }))}
                    placeholder="VD: CT101"
                    required
                    className="h-9 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Tín chỉ <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number" min={1} max={30}
                    value={formData.credits}
                    onChange={(e) => setFormData((f) => ({ ...f, credits: e.target.value }))}
                    required
                    className="h-9"
                  />
                </div>
              </div>

              {/* Tên học phần */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Tên học phần <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Nhập môn lập trình"
                  required
                  className="h-9"
                />
              </div>

              {/* Loại + Phân loại */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Loại học phần</label>
                  <CustomSelect
                    value={formData.courseType}
                    onChange={v => setFormData(f => ({ ...f, courseType: v }))}
                    options={[
                      { value: 'required', label: 'Bắt buộc', color: 'bg-primary' },
                      { value: 'elective', label: 'Tự chọn', color: 'bg-amber-400' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Phân loại</label>
                  <CustomSelect
                    value={formData.courseCategory}
                    onChange={v => setFormData(f => ({ ...f, courseCategory: v }))}
                    options={[
                      { value: 'general', label: 'Đại cương', color: 'bg-muted-foreground' },
                      { value: 'foundation', label: 'Cơ sở ngành', color: 'bg-blue-500' },
                      { value: 'specialized', label: 'Chuyên ngành', color: 'bg-emerald-500' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Section: Điều kiện */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">Điều kiện & Liên kết</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Tiên quyết + Song hành */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Tiên quyết</label>
                  <Input
                    value={formData.prerequisites}
                    onChange={(e) => setFormData((f) => ({ ...f, prerequisites: e.target.value }))}
                    placeholder="CT101, CT177"
                    className="h-9 font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Phân cách bằng dấu phẩy</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Song hành</label>
                  <Input
                    value={formData.corequisites}
                    onChange={(e) => setFormData((f) => ({ ...f, corequisites: e.target.value }))}
                    className="h-9 font-mono text-xs"
                    placeholder="VD: CT202"
                  />
                </div>
              </div>

              {/* Điều kiện đăng ký */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Điều kiện đăng ký</label>
                <Input
                  value={formData.condition}
                  onChange={(e) => setFormData((f) => ({ ...f, condition: e.target.value }))}
                  placeholder="VD: Tích lũy >= 125 TC"
                  className="h-9"
                />
                <p className="text-[11px] text-muted-foreground mt-1">VD: CT553E cần tích lũy &ge; 125 tín chỉ</p>
              </div>
            </div>

            {/* Section: Tùy chọn GPA */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">Tùy chọn GPA</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="rounded-xl border bg-card/50 p-4 space-y-3">
                {/* Toggle: GPA tích lũy */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <p className="text-sm font-medium group-hover:text-foreground transition-colors">Không tính vào GPA tích lũy</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Không ảnh hưởng điểm trung bình toàn khóa</p>
                  </div>
                  <div
                    onClick={() => setFormData(f => ({ ...f, excludeFromCumulativeGPA: !f.excludeFromCumulativeGPA }))}
                    className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer shrink-0 ${formData.excludeFromCumulativeGPA ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    style={{ height: '22px', width: '40px' }}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${formData.excludeFromCumulativeGPA ? 'translate-x-[18px]' : 'translate-x-0'
                      }`} />
                  </div>
                </label>
                <div className="h-px bg-border" />
                {/* Toggle: GPA học kỳ */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <p className="text-sm font-medium group-hover:text-foreground transition-colors">Không tính vào GPA học kỳ</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Không ảnh hưởng điểm trung bình học kỳ đó</p>
                  </div>
                  <div
                    onClick={() => setFormData(f => ({ ...f, excludeFromSemesterGPA: !f.excludeFromSemesterGPA }))}
                    className={`relative rounded-full transition-colors cursor-pointer shrink-0 ${formData.excludeFromSemesterGPA ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    style={{ height: '22px', width: '40px' }}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${formData.excludeFromSemesterGPA ? 'translate-x-[18px]' : 'translate-x-0'
                      }`} />
                  </div>
                </label>
              </div>
            </div>

            {/* Section: Mô tả */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Mô tả & Kiến thức</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Mô tả học phần</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả nội dung và mục tiêu học phần..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Kiến thức lý thuyết</label>
                  <Textarea
                    value={formData.theoryKnowledge}
                    onChange={(e) => setFormData((f) => ({ ...f, theoryKnowledge: e.target.value }))}
                    rows={2}
                    placeholder="Nội dung lý thuyết chính..."
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Kiến thức thực hành</label>
                  <Textarea
                    value={formData.practiceKnowledge}
                    onChange={(e) => setFormData((f) => ({ ...f, practiceKnowledge: e.target.value }))}
                    rows={2}
                    placeholder="Nội dung thực hành chính..."
                  />
                </div>
              </div>
            </div>

            {/* Section: Kỹ năng liên quan */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Kỹ năng liên quan</span>
                <div className="flex-1 h-px bg-border" />
                {formData.relatedSkills.length > 0 && (
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {formData.relatedSkills.length} đã chọn
                  </span>
                )}
              </div>

              {/* Search skills */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm kỹ năng..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                />
              </div>

              {/* Selected pills */}
              {formData.relatedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.relatedSkills.map(id => {
                    const sk = allSkills.find(s => s._id === id);
                    if (sk) {
                      return (
                        <span key={id} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                          {sk.icon} {sk.name}
                          <button
                            type="button"
                            onClick={() => setFormData(f => ({ ...f, relatedSkills: f.relatedSkills.filter(i => i !== id) }))}
                            className="ml-0.5 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    }
                    // Orphan skill — đã bị xóa khỏi hệ thống
                    const orphan = orphanSkillsMap[id];
                    return (
                      <span key={id} title="Kỹ năng này đã bị xóa khỏi hệ thống" className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-400/30 line-through opacity-70">
                        {orphan?.name || id.slice(-6)}
                        <button
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, relatedSkills: f.relatedSkills.filter(i => i !== id) }))}
                          className="ml-0.5 hover:text-red-700 no-underline"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Skill list */}
              <div className="max-h-44 overflow-y-auto rounded-xl border bg-card/50 divide-y">
                {allSkills
                  .filter(sk => !skillSearch || sk.name.toLowerCase().includes(skillSearch.toLowerCase()))
                  .map(sk => {
                    const selected = formData.relatedSkills.includes(sk._id);
                    return (
                      <button
                        key={sk._id}
                        type="button"
                        onClick={() => setFormData(f => ({
                          ...f,
                          relatedSkills: selected
                            ? f.relatedSkills.filter(i => i !== sk._id)
                            : [...f.relatedSkills, sk._id],
                        }))}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/60 transition-colors ${selected ? 'bg-emerald-500/5' : ''}`}
                      >
                        <span className="text-base shrink-0">{sk.icon || '📘'}</span>
                        <span className="flex-1 text-xs font-medium truncate">{sk.name}</span>
                        {sk.category && (
                          <span className="text-[10px] text-muted-foreground shrink-0">{sk.category}</span>
                        )}
                        {selected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      </button>
                    );
                  })}
                {allSkills.filter(sk => !skillSearch || sk.name.toLowerCase().includes(skillSearch.toLowerCase())).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Không tìm thấy kỹ năng</p>
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

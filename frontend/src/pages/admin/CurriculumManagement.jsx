/**
 * CurriculumManagement - QL Chương trình đào tạo
 * Full CRUD: CTĐT, Học kỳ, Học phần
 * - Tab "Thông tin cơ bản": mã, tên, khoa, trường, mô tả
 * - Tab "Học kỳ & Học phần": thêm/xóa HK, thêm/xóa/sửa HP trong HK
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  Search, Plus, Pencil, Trash2, Eye, BookOpen, Calendar,
  ChevronDown, ChevronRight, Settings, X, GripVertical,
  GraduationCap, SlidersHorizontal, Building2, Hash, BookMarked,
  Layers, FileText, CheckCircle2,
} from 'lucide-react';

/* ══════════════════════════════════════════
   Course Picker Component
   Inline dropdown search để chọn học phần
══════════════════════════════════════════ */
function CoursePicker({ allCourses, existingCodes, onSelect, onClose }) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = allCourses.filter(c => {
    if (existingCodes.has(c.code)) return false;
    if (!q.trim()) return true;
    const query = q.toLowerCase();
    return c.code.toLowerCase().includes(query) || c.name.toLowerCase().includes(query);
  });

  return (
    <div className="border rounded-lg bg-card shadow-lg overflow-hidden mt-2">
      <div className="p-2 border-b flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Tìm mã hoặc tên học phần..."
          className="flex-1 text-sm bg-transparent outline-none"
        />
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Không tìm thấy học phần</p>
        ) : (
          filtered.slice(0, 50).map(c => (
            <button
              key={c._id}
              type="button"
              onClick={() => onSelect(c)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/40 transition-colors text-left border-b last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-primary font-bold w-16 shrink-0">{c.code}</span>
                <span className="text-sm truncate max-w-[240px]">{c.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">{c.credits} TC</span>
                <Badge variant={c.courseType === 'elective' ? 'warning' : 'secondary'} className="text-[10px] px-1.5 py-0">
                  {c.courseType === 'elective' ? 'TC' : 'BB'}
                </Badge>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Main Component
══════════════════════════════════════ */
const initialForm = {
  code: '', name: '', department: '',
  university: 'Trường Đại học Cần Thơ', description: '', totalCredits: 0,
};

function makeSemester(order) {
  return {
    _localId: `new_${Date.now()}_${order}`,
    _isNew: true,
    name: `Học kỳ ${order}`,
    order,
    courses: [],
  };
}

export default function CurriculumManagement() {
  const toast = useToast();
  const [programs, setPrograms] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // ── Form state ──
  const [showForm, setShowForm] = useState(false);
  const [editTab, setEditTab] = useState('info');
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [editSemesters, setEditSemesters] = useState([]);
  const [expandedSems, setExpandedSems] = useState({});
  const [pickerOpenFor, setPickerOpenFor] = useState(null); // semId or _localId
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Detail Dialog ──
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [expandedDetailSems, setExpandedDetailSems] = useState({});

  // ── Load data ──
  const loadPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/curriculum-programs', { params: search ? { search } : {} });
      setPrograms(data.data);
    } catch {
      toast.error('Không thể tải danh sách CTĐT');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadPrograms(); }, [loadPrograms]);

  // Load all courses once
  useEffect(() => {
    api.get('/courses/all').then(({ data }) => {
      setAllCourses(data.data || []);
    }).catch(() => { });
  }, []);

  // ── View Detail ──
  async function openDetail(program) {
    setShowDetail(true);
    setLoadingDetail(true);
    try {
      const { data } = await api.get(`/curriculum-programs/${program._id}`);
      setDetail(data.data);
      const expanded = {};
      (data.data.semesterDetails || []).forEach(s => { expanded[s._id] = true; });
      setExpandedDetailSems(expanded);
    } catch {
      toast.error('Không thể tải chi tiết CTĐT');
    } finally {
      setLoadingDetail(false);
    }
  }

  // ── Open Create ──
  function openCreate() {
    setFormData(initialForm);
    setEditingId(null);
    setEditSemesters([]);
    setEditTab('info');
    setExpandedSems({});
    setPickerOpenFor(null);
    setShowForm(true);
  }

  // ── Open Edit ──
  async function openEdit(program) {
    setEditingId(program._id);
    setFormData({
      code: program.code,
      name: program.name,
      department: program.department || '',
      university: program.university || 'Trường Đại học Cần Thơ',
      description: program.description || '',
      totalCredits: program.totalCredits || 0,
    });
    setEditTab('info');
    setEditSemesters([]);
    setPickerOpenFor(null);
    setShowForm(true);
    setLoadingEdit(true);
    try {
      const { data } = await api.get(`/curriculum-programs/${program._id}`);
      const sems = (data.data.semesterDetails || []).map(s => ({
        ...s,
        _isNew: false,
        _deleted: false,
        courses: (s.courses || []).map(c => ({ ...c, _dirty: false })),
      }));
      setEditSemesters(sems);
      const expanded = {};
      sems.forEach(s => { expanded[s._id] = true; });
      setExpandedSems(expanded);
    } catch {
      toast.error('Không thể tải chi tiết CTĐT');
    } finally {
      setLoadingEdit(false);
    }
  }

  // ── Semester ops ──
  function addSemester() {
    const nextOrder = editSemesters.length + 1;
    const sem = makeSemester(nextOrder);
    setEditSemesters(prev => [...prev, sem]);
    setExpandedSems(prev => ({ ...prev, [sem._localId]: true }));
  }

  function deleteSemester(semKey) {
    setEditSemesters(prev => prev.map(s => {
      const key = s._id || s._localId;
      if (key !== semKey) return s;
      if (s._isNew) return null; // remove entirely
      return { ...s, _deleted: true };
    }).filter(Boolean));
  }

  function updateSemesterField(semKey, field, value) {
    setEditSemesters(prev => prev.map(s => {
      const key = s._id || s._localId;
      if (key !== semKey) return s;
      return { ...s, [field]: value, _dirty: true };
    }));
  }

  // ── Course ops ──
  function addCourseToSemester(semKey, course) {
    setEditSemesters(prev => prev.map(s => {
      const key = s._id || s._localId;
      if (key !== semKey) return s;
      const alreadyIn = s.courses.some(c => (c.course?.code || c.course?.code) === course.code);
      if (alreadyIn) return s;
      const newItem = {
        course: { _id: course._id, code: course.code, name: course.name, credits: course.credits },
        isRequired: course.courseType !== 'elective',
        electiveGroup: null,
        _dirty: true,
        _isNew: true,
      };
      return { ...s, courses: [...s.courses, newItem] };
    }));
    setPickerOpenFor(null); // close picker after select
  }

  function removeCourseFromSemester(semKey, courseIdx) {
    setEditSemesters(prev => prev.map(s => {
      const key = s._id || s._localId;
      if (key !== semKey) return s;
      const courses = s.courses.filter((_, i) => i !== courseIdx);
      return { ...s, courses, _dirty: true };
    }));
  }

  function toggleIsRequired(semKey, courseIdx) {
    setEditSemesters(prev => prev.map(s => {
      const key = s._id || s._localId;
      if (key !== semKey) return s;
      const courses = s.courses.map((c, i) => {
        if (i !== courseIdx) return c;
        return { ...c, isRequired: !c.isRequired, _dirty: true };
      });
      return { ...s, courses };
    }));
  }

  function changeElectiveGroup(semKey, courseIdx, value) {
    setEditSemesters(prev => prev.map(s => {
      const key = s._id || s._localId;
      if (key !== semKey) return s;
      const courses = s.courses.map((c, i) => {
        if (i !== courseIdx) return c;
        return { ...c, electiveGroup: value || null, _dirty: true };
      });
      return { ...s, courses };
    }));
  }

  // ── Save ──
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, totalCredits: Number(formData.totalCredits) };
      let programId = editingId;

      // 1. Create or update program
      if (editingId) {
        await api.put(`/curriculum-programs/${editingId}`, payload);
      } else {
        const { data } = await api.post('/curriculum-programs', payload);
        programId = data.data._id;
      }

      // 2. Process semesters
      const activeSems = editSemesters.filter(s => !s._deleted);

      for (const sem of editSemesters) {
        const semPayload = {
          name: sem.name,
          order: sem.order,
          courses: sem.courses.map(c => ({
            course: c.course?._id || c.course,
            isRequired: c.isRequired !== false,
            electiveGroup: c.electiveGroup || null,
          })),
        };

        if (sem._deleted && !sem._isNew) {
          // Delete existing semester
          await api.delete(`/curriculum-programs/${programId}/semesters/${sem._id}`);
        } else if (sem._isNew) {
          // Create new semester
          await api.post(`/curriculum-programs/${programId}/semesters`, semPayload);
        } else {
          // Update existing semester if dirty
          const hasDirty = sem.courses.some(c => c._dirty) || sem._dirty;
          if (hasDirty) {
            await api.put(`/curriculum-programs/${programId}/semesters/${sem._id}`, semPayload);
          }
        }
      }

      toast.success(editingId ? 'Cập nhật CTĐT thành công' : 'Tạo CTĐT thành công');
      setShowForm(false);
      loadPrograms();
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
      await api.delete(`/curriculum-programs/${deleteConfirmId}`);
      toast.success('Đã xóa CTĐT');
      setDeleteConfirmId(null);
      loadPrograms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setDeleting(false);
    }
  }

  // ── Stats ──
  const activeSems = editSemesters.filter(s => !s._deleted);
  const dirtyCount = editSemesters.reduce(
    (sum, s) => sum + s.courses.filter(c => c._dirty).length, 0
  );
  const totalCourses = activeSems.reduce((s, sem) => s + sem.courses.length, 0);

  return (
    <div className="animate-fade-in space-y-5">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-primary/8 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Quản Lý CTDT</span>
            </div>
            <p className="text-muted-foreground text-sm mt-1.5">
              Quản lý <strong className="text-foreground">{programs.length}</strong> chương trình đào tạo &bull; Học kỳ và học phần
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Thêm CTĐT
          </Button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Tìm mã, tên CTĐT..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* ── Programs Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border bg-card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex gap-2">
                    <div className="h-5 w-24 skeleton rounded-full" />
                    <div className="h-5 w-14 skeleton rounded-full" />
                  </div>
                  <div className="h-5 w-48 skeleton rounded" />
                </div>
                <div className="flex gap-1">
                  <div className="h-7 w-7 skeleton rounded-lg" />
                  <div className="h-7 w-7 skeleton rounded-lg" />
                  <div className="h-7 w-7 skeleton rounded-lg" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-3.5 w-40 skeleton rounded" />
                <div className="h-3.5 w-32 skeleton rounded" />
              </div>
              <div className="h-3.5 w-24 skeleton rounded" />
            </div>
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-7 h-7 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Chưa có chương trình đào tạo nào</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Bắt đầu bằng cách tạo CTĐT đầu tiên</p>
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Tạo CTĐT
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map(program => {
            const isCustom = program.code?.startsWith('CUSTOM');
            return (
              <div key={program._id}
                className="rounded-xl border bg-card overflow-hidden group hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/40 hover:border-l-primary">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {program.code}
                        </span>
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                          {program.totalCredits} TC
                        </span>
                        {isCustom && (
                          <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-400/20">
                            Tùy chỉnh
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors truncate" title={program.name}>
                        {program.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-0.5 ml-2 shrink-0">
                      <button onClick={() => openDetail(program)}
                        className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary" title="Xem">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(program)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Sửa">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirmId(program._id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-0.5 mb-3">
                    {program.department && <p className="truncate">{program.department}</p>}
                    <p className="truncate">{program.university}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2.5 border-t border-border/50">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {program.semesters?.length || 0} học kỳ
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {program.totalCredits} tín chỉ
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════ View Detail Dialog ═══════════════ */}
      <Dialog open={showDetail} onClose={() => setShowDetail(false)} className="max-w-3xl">
        {/* Gradient Header */}
        {detail && (
          <div className="relative overflow-hidden rounded-t-xl border-b px-6 py-5 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border bg-indigo-500/15 border-indigo-400/20 text-indigo-600">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground leading-tight">{detail.name}</h2>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded">{detail.code}</span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3 h-3" /> {detail.totalCredits} tín chỉ
                    </span>
                    {detail.department && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {detail.department}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)}
                className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors self-start">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Meta bar */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/40">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-semibold text-indigo-700">{detail.semesterDetails?.length || 0} học kỳ</span>
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold text-emerald-700">
                  {(detail.semesterDetails || []).reduce((s, sem) => s + (sem.courses?.length || 0), 0)} học phần
                </span>
              </span>
              {detail.university && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-auto">
                  <Building2 className="w-3 h-3" /> {detail.university}
                </span>
              )}
            </div>
          </div>
        )}

        <DialogBody className="max-h-[62vh] overflow-y-auto px-6 py-5">
          {loadingDetail ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 skeleton rounded-lg" />)}
            </div>
          ) : detail ? (
            <div className="space-y-3">
              {/* Section header */}
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">
                  Danh sách học kỳ ({detail.semesterDetails?.length || 0})
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {(detail.semesterDetails || []).map(semester => (
                <div key={semester._id} className="rounded-xl border bg-card overflow-hidden">
                  <button
                    onClick={() => setExpandedDetailSems(prev => ({ ...prev, [semester._id]: !prev[semester._id] }))}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-1 h-4 rounded-full transition-colors ${
                        expandedDetailSems[semester._id] ? 'bg-indigo-500' : 'bg-border'
                      }`} />
                      {expandedDetailSems[semester._id]
                        ? <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
                        : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className="font-semibold text-sm">{semester.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-400/20">
                        {semester.courses?.length || 0} HP
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {semester.requiredCredits || 0} TC bắt buộc
                    </span>
                  </button>

                  {expandedDetailSems[semester._id] && (
                    <div className="border-t bg-muted/5">
                      {(semester.courses || []).map((item, idx) => (
                        <div key={idx}
                          className="flex items-center justify-between px-5 py-2 text-sm border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <BookOpen className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                            <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-500/8 px-1.5 py-0.5 rounded shrink-0">
                              {item.course?.code}
                            </span>
                            <span className="text-sm truncate max-w-[260px]">{item.course?.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-semibold text-muted-foreground">{item.course?.credits} TC</span>
                            {!item.isRequired && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-400/20">
                                Tự chọn
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter className="border-t bg-muted/20 rounded-b-xl px-6 py-4">
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
          {detail && (
            <Button size="sm" className="gap-1.5" onClick={() => { setShowDetail(false); openEdit(detail); }}>
              <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
            </Button>
          )}
        </DialogFooter>
      </Dialog>

      {/* ═══════════════ Create / Edit Dialog ═══════════════ */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} className="max-w-4xl">
        {/* Gradient Header */}
        <div className={`relative overflow-hidden rounded-t-xl border-b px-6 py-5 ${
          editingId
            ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent'
            : 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent'
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                editingId
                  ? 'bg-amber-500/15 border-amber-400/20 text-amber-600'
                  : 'bg-emerald-500/15 border-emerald-400/20 text-emerald-600'
              }`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {editingId ? 'Chỉnh sửa CTDT' : 'Thêm CTDT mới'}
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {editingId
                    ? `Đang sửa • ${formData.code || 'Chưa có mã'}`
                    : 'Tạo chương trình đào tạo mới'}
                </p>
              </div>
            </div>
            <button onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors self-start">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave}>
          {/* Tab pill bar */}
          <div className="flex items-center gap-1 px-6 py-3 border-b bg-muted/10">
            <button
              type="button"
              onClick={() => setEditTab('info')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                editTab === 'info'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Thông tin cơ bản
            </button>
            <button
              type="button"
              onClick={() => setEditTab('semesters')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                editTab === 'semesters'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Học kỳ & Học phần
              {activeSems.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5 ${
                  editTab === 'semesters' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {activeSems.length} HK · {totalCourses} HP
                </span>
              )}
              {dirtyCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {dirtyCount}
                </span>
              )}
            </button>
          </div>

          <DialogBody className={editTab === 'semesters' ? 'p-0' : 'px-6 py-5'}>
            {/* ── Tab: Thông tin cơ bản ── */}
            {editTab === 'info' && (
              <div className="space-y-5">
                {/* Section: Mã + Tín chỉ */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Thông tin cơ bản</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pl-1">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Mã CTĐT *</label>
                      <Input
                        value={formData.code} required
                        onChange={e => setFormData(f => ({ ...f, code: e.target.value }))}
                        placeholder="VD: KTPM-K50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Tổng tín chỉ</label>
                      <Input
                        type="number" min={0}
                        value={formData.totalCredits}
                        onChange={e => setFormData(f => ({ ...f, totalCredits: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="pl-1">
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Tên CTĐT *</label>
                    <Input
                      value={formData.name} required
                      onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                      placeholder="VD: Kỹ thuật Phần mềm K50"
                    />
                  </div>
                </div>

                {/* Section: Đơn vị */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">Đơn vị</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pl-1">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Khoa</label>
                      <Input
                        value={formData.department}
                        onChange={e => setFormData(f => ({ ...f, department: e.target.value }))}
                        placeholder="VD: CNTT & Truyền thông"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Trường</label>
                      <Input
                        value={formData.university}
                        onChange={e => setFormData(f => ({ ...f, university: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Mô tả */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">Mô tả</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="pl-1">
                    <Textarea
                      value={formData.description}
                      onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                      rows={3}
                      placeholder="Mô tả ngắn về chương trình đào tạo..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Học kỳ & Học phần ── */}
            {editTab === 'semesters' && (
              <div className="max-h-[62vh] overflow-y-auto">
                {loadingEdit ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-14 skeleton rounded-lg" />)}
                  </div>
                ) : (
                  <>
                    {/* Stats bar */}
                    <div className="px-5 py-3 border-b bg-muted/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-muted-foreground">{activeSems.length} học kỳ</span>
                        <span className="text-muted-foreground/40 text-xs">·</span>
                        <span className="text-xs font-semibold text-muted-foreground">{totalCourses} học phần</span>
                        {dirtyCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-400/20">
                            ✦ {dirtyCount} thay đổi
                          </span>
                        )}
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={addSemester} className="gap-1.5 h-7 text-xs">
                        <Plus className="w-3.5 h-3.5" /> Thêm học kỳ
                      </Button>
                    </div>

                    {activeSems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                        <p className="text-sm text-muted-foreground">Chưa có học kỳ nào</p>
                        <button type="button" onClick={addSemester}
                          className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors">
                          <Plus className="w-3.5 h-3.5" /> Thêm học kỳ đầu tiên
                        </button>
                      </div>
                    ) : (
                      <div>
                        {editSemesters.filter(s => !s._deleted).map((sem, semIdx) => {
                          const semKey = sem._id || sem._localId;
                          const isExpanded = expandedSems[semKey];
                          const isPickerOpen = pickerOpenFor === semKey;
                          const existingCodes = new Set(sem.courses.map(c => c.course?.code));
                          const reqCount = sem.courses.filter(c => c.isRequired !== false).length;
                          const dirtyInSem = sem.courses.filter(c => c._dirty).length;
                          const totalCreditsInSem = sem.courses.reduce((s, c) => s + (c.course?.credits || 0), 0);

                          return (
                            <div key={semKey} className={`border-b transition-colors`}>
                              {/* ── Semester Header ── */}
                              <div className={`flex items-center gap-2 px-4 py-3 transition-colors border-l-4 ${
                                sem._isNew
                                  ? 'border-l-emerald-400 bg-emerald-500/[0.025]'
                                  : isExpanded
                                  ? 'border-l-primary bg-primary/[0.025]'
                                  : 'border-l-transparent hover:border-l-primary/30 hover:bg-muted/20'
                              }`}>
                                <button
                                  type="button"
                                  onClick={() => setExpandedSems(prev => ({ ...prev, [semKey]: !prev[semKey] }))}
                                  className={`transition-colors shrink-0 ${isExpanded ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                  {isExpanded
                                    ? <ChevronDown className="w-4 h-4" />
                                    : <ChevronRight className="w-4 h-4" />}
                                </button>

                                {/* Editable name */}
                                <input
                                  type="text"
                                  value={sem.name}
                                  onChange={e => updateSemesterField(semKey, 'name', e.target.value)}
                                  className="font-semibold text-sm bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 flex-1 min-w-0 transition-colors"
                                  onClick={e => e.stopPropagation()}
                                />

                                {/* Stat chips */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {sem._isNew && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-400/20 shrink-0">
                                      Mới
                                    </span>
                                  )}
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                                    {sem.courses.length} HP
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/15">
                                    {totalCreditsInSem} TC
                                  </span>
                                  <span className="text-[10px] text-muted-foreground hidden sm:inline">{reqCount} BB</span>
                                  {dirtyInSem > 0 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-400/20">
                                      ✦ {dirtyInSem}
                                    </span>
                                  )}
                                </div>

                                {/* Order */}
                                <div className="flex items-center gap-1 shrink-0 border-l border-border/50 pl-2 ml-1">
                                  <span className="text-[10px] text-muted-foreground">STT:</span>
                                  <input
                                    type="number" min={1} max={20}
                                    value={sem.order}
                                    onChange={e => updateSemesterField(semKey, 'order', parseInt(e.target.value) || 1)}
                                    onClick={e => e.stopPropagation()}
                                    className="w-9 text-center text-xs bg-background border border-border/60 rounded-md px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => deleteSemester(semKey)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-600 text-muted-foreground/40 transition-colors shrink-0"
                                  title="Xóa học kỳ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* ── Course Table ── */}
                              {isExpanded && (
                                <div className="bg-muted/[0.03]">
                                  {sem.courses.length > 0 ? (
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="bg-muted/25 border-y border-border/50">
                                          <th className="text-left px-4 py-2 font-semibold text-muted-foreground text-[10px] uppercase tracking-wider w-24">Mã HP</th>
                                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Tên học phần</th>
                                          <th className="text-center px-2 py-2 font-semibold text-muted-foreground text-[10px] uppercase tracking-wider w-10">TC</th>
                                          <th className="text-center px-2 py-2 font-semibold text-muted-foreground text-[10px] uppercase tracking-wider w-24">Loại</th>
                                          <th className="text-center px-2 py-2 font-semibold text-muted-foreground text-[10px] uppercase tracking-wider w-28">Nhóm TC</th>
                                          <th className="w-8" />
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sem.courses.map((item, idx) => {
                                          const isReq = item.isRequired !== false;
                                          return (
                                            <tr
                                              key={idx}
                                              className={`border-b border-border/30 transition-colors group ${
                                                item._isNew
                                                  ? 'bg-emerald-500/5 hover:bg-emerald-500/8'
                                                  : item._dirty
                                                  ? 'bg-amber-500/5 hover:bg-amber-500/8'
                                                  : idx % 2 === 0 ? 'hover:bg-primary/5' : 'bg-muted/[0.04] hover:bg-primary/5'
                                              }`}
                                            >
                                              <td className="px-4 py-2">
                                                <div className="flex items-center gap-1.5">
                                                  <span className="font-mono text-[11px] font-bold text-primary bg-primary/8 px-1.5 py-0.5 rounded border border-primary/10">
                                                    {item.course?.code}
                                                  </span>
                                                  {item._isNew && (
                                                    <span className="text-[9px] font-bold text-emerald-600" title="Mới thêm">◆</span>
                                                  )}
                                                </div>
                                              </td>
                                              <td className="px-3 py-2 text-xs truncate max-w-[200px]" title={item.course?.name}>
                                                {item.course?.name}
                                              </td>
                                              <td className="text-center px-2 py-2">
                                                <span className="text-xs font-bold text-muted-foreground">{item.course?.credits}</span>
                                              </td>
                                              <td className="text-center px-2 py-2">
                                                <button
                                                  type="button"
                                                  onClick={() => toggleIsRequired(semKey, idx)}
                                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all border ${isReq
                                                    ? 'bg-primary/10 text-primary border-primary/30 hover:bg-red-500/10 hover:text-red-600 hover:border-red-300/60'
                                                    : 'bg-amber-500/10 text-amber-600 border-amber-300/60 hover:bg-primary/10 hover:text-primary hover:border-primary/30'}`}
                                                  title="Click để đổi loại"
                                                >
                                                  {isReq ? 'Bắt buộc' : 'Tự chọn'}
                                                </button>
                                              </td>
                                              <td className="text-center px-2 py-2">
                                                {!isReq ? (
                                                  <input
                                                    type="text"
                                                    value={item.electiveGroup || ''}
                                                    onChange={e => changeElectiveGroup(semKey, idx, e.target.value)}
                                                    placeholder="Nhóm…"
                                                    className="w-20 text-xs text-center bg-transparent border border-border/60 rounded-lg px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors placeholder:text-muted-foreground/40"
                                                  />
                                                ) : (
                                                  <span className="text-muted-foreground/25 text-xs select-none">—</span>
                                                )}
                                              </td>
                                              <td className="pr-2 py-2">
                                                <button
                                                  type="button"
                                                  onClick={() => removeCourseFromSemester(semKey, idx)}
                                                  className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-600 text-transparent group-hover:text-muted-foreground/50 transition-colors"
                                                  title="Xóa khỏi học kỳ"
                                                >
                                                  <X className="w-3 h-3" />
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-8 gap-2 border-b border-dashed border-border/40">
                                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                                        <BookOpen className="w-4 h-4 text-muted-foreground/40" />
                                      </div>
                                      <p className="text-xs text-muted-foreground">Chưa có học phần nào trong học kỳ này</p>
                                    </div>
                                  )}

                                  {/* Add Course button + picker */}
                                  <div className={`px-4 ${isPickerOpen ? 'pt-2 pb-3' : 'py-2'}`}>
                                    {isPickerOpen ? (
                                      <CoursePicker
                                        allCourses={allCourses}
                                        existingCodes={existingCodes}
                                        onSelect={course => addCourseToSemester(semKey, course)}
                                        onClose={() => setPickerOpenFor(null)}
                                      />
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setPickerOpenFor(semKey)}
                                        className="flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors py-1 px-2 rounded-lg hover:bg-primary/5"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        Thêm học phần
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </DialogBody>

          <DialogFooter className="border-t bg-muted/20 rounded-b-xl px-6 py-4">
            {dirtyCount > 0 && (
              <span className="text-xs text-amber-600 mr-auto flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                {dirtyCount} thay đổi chờ lưu
              </span>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button type="submit" size="sm" disabled={saving} className="gap-1.5 min-w-[100px]">
              {saving ? (
                <><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
              ) : editingId ? (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Cập nhật</>
              ) : (
                <><Plus className="w-3.5 h-3.5" /> Tạo mới</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* ═══════════════ Confirm Delete Dialog ═══════════════ */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} className="max-w-sm">
        <DialogHeader onClose={() => setDeleteConfirmId(null)}>
          Xác nhận xóa CTĐT
        </DialogHeader>
        <DialogBody>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Bạn có chắc muốn xóa chương trình đào tạo này?</p>
              <p className="text-muted-foreground text-xs mt-1">
                CTĐT sẽ bị ẩn khỏi hệ thống. Hành động này không thể hoàn tác.
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

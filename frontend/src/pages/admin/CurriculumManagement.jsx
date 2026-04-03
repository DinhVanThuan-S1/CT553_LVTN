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
    }).catch(() => {});
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

  // ── Stats ──
  const activeSems = editSemesters.filter(s => !s._deleted);
  const dirtyCount = editSemesters.reduce(
    (sum, s) => sum + s.courses.filter(c => c._dirty).length, 0
  );
  const totalCourses = activeSems.reduce((s, sem) => s + sem.courses.length, 0);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Chương Trình Đào Tạo</h1>
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
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Programs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
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
          {programs.map(program => (
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
                    className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Xem">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEdit(program)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Sửa">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(program._id)}
                    className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors" title="Xóa">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-0.5">
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

      {/* ═══════════════ View Detail Dialog ═══════════════ */}
      <Dialog open={showDetail} onClose={() => setShowDetail(false)} className="max-w-3xl">
        <DialogHeader onClose={() => setShowDetail(false)}>
          Chi tiết Chương trình Đào tạo
        </DialogHeader>
        <DialogBody>
          {loadingDetail ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 skeleton rounded-lg" />)}
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{detail.name}</h3>
                <p className="text-sm text-muted-foreground">{detail.code} • {detail.totalCredits} tín chỉ</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  Danh sách học kỳ ({detail.semesterDetails?.length || 0})
                </h4>
                {(detail.semesterDetails || []).map(semester => (
                  <div key={semester._id} className="rounded-lg border">
                    <button
                      onClick={() => setExpandedDetailSems(prev => ({ ...prev, [semester._id]: !prev[semester._id] }))}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {expandedDetailSems[semester._id]
                          ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        <span className="font-medium text-sm">{semester.name}</span>
                        <Badge variant="secondary">{semester.courses?.length || 0} HP</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {semester.requiredCredits || 0} TC bắt buộc
                      </span>
                    </button>
                    {expandedDetailSems[semester._id] && (
                      <div className="border-t px-4 py-2 space-y-1">
                        {(semester.courses || []).map((item, idx) => (
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

      {/* ═══════════════ Create / Edit Dialog ═══════════════ */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} className="max-w-4xl">
        <DialogHeader onClose={() => setShowForm(false)}>
          {editingId ? 'Chỉnh sửa CTĐT' : 'Thêm CTĐT mới'}
        </DialogHeader>

        <form onSubmit={handleSave}>
          {/* Tabs */}
          <div className="flex border-b px-6">
            <button
              type="button"
              onClick={() => setEditTab('info')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${editTab === 'info'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Thông tin cơ bản
            </button>
            <button
              type="button"
              onClick={() => setEditTab('semesters')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${editTab === 'semesters'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <Settings className="w-3.5 h-3.5" />
              Học kỳ & Học phần
              {activeSems.length > 0 && (
                <span className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                  {activeSems.length} HK · {totalCourses} HP
                </span>
              )}
              {dirtyCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {dirtyCount} thay đổi
                </span>
              )}
            </button>
          </div>

          <DialogBody className={editTab === 'semesters' ? 'p-0' : ''}>

            {/* ── Tab: Thông tin cơ bản ── */}
            {editTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Mã CTĐT *</label>
                    <Input
                      value={formData.code} required
                      onChange={e => setFormData(f => ({ ...f, code: e.target.value }))}
                      placeholder="VD: KTPM-K50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Tổng tín chỉ</label>
                    <Input
                      type="number" min={0}
                      value={formData.totalCredits}
                      onChange={e => setFormData(f => ({ ...f, totalCredits: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Tên CTĐT *</label>
                  <Input
                    value={formData.name} required
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    placeholder="VD: Kỹ thuật Phần mềm K50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Khoa</label>
                  <Input
                    value={formData.department}
                    onChange={e => setFormData(f => ({ ...f, department: e.target.value }))}
                    placeholder="VD: CNTT & Truyền thông"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Trường</label>
                  <Input
                    value={formData.university}
                    onChange={e => setFormData(f => ({ ...f, university: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Mô tả</label>
                  <Textarea
                    value={formData.description}
                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                  />
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
                    {/* Add Semester button */}
                    <div className="px-5 py-3 border-b bg-muted/10 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {activeSems.length} học kỳ · {totalCourses} học phần
                      </span>
                      <Button type="button" size="sm" variant="outline" onClick={addSemester} className="gap-1.5 h-7 text-xs">
                        <Plus className="w-3.5 h-3.5" /> Thêm học kỳ
                      </Button>
                    </div>

                    {activeSems.length === 0 ? (
                      <div className="py-16 text-center text-muted-foreground text-sm space-y-2">
                        <p>Chưa có học kỳ nào</p>
                        <button type="button" onClick={addSemester}
                          className="text-primary text-xs hover:underline">
                          + Thêm học kỳ đầu tiên
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {editSemesters.filter(s => !s._deleted).map(sem => {
                          const semKey = sem._id || sem._localId;
                          const isExpanded = expandedSems[semKey];
                          const isPickerOpen = pickerOpenFor === semKey;
                          const existingCodes = new Set(sem.courses.map(c => c.course?.code));
                          const reqCount = sem.courses.filter(c => c.isRequired !== false).length;
                          const dirtyInSem = sem.courses.filter(c => c._dirty).length;

                          return (
                            <div key={semKey} className={sem._isNew ? 'bg-primary/[0.02]' : ''}>
                              {/* Semester Header */}
                              <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/20 transition-colors">
                                <button
                                  type="button"
                                  onClick={() => setExpandedSems(prev => ({ ...prev, [semKey]: !prev[semKey] }))}
                                  className="text-muted-foreground hover:text-foreground"
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
                                  className="font-medium text-sm bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 flex-1 min-w-0"
                                  onClick={e => e.stopPropagation()}
                                />

                                {/* Order */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-xs text-muted-foreground">Thứ tự:</span>
                                  <input
                                    type="number" min={1} max={20}
                                    value={sem.order}
                                    onChange={e => updateSemesterField(semKey, 'order', parseInt(e.target.value) || 1)}
                                    onClick={e => e.stopPropagation()}
                                    className="w-10 text-center text-xs bg-transparent border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Badge variant="secondary" className="text-[10px]">{sem.courses.length} HP</Badge>
                                  <span className="text-xs text-muted-foreground">{reqCount} BB</span>
                                  {dirtyInSem > 0 && (
                                    <span className="text-[10px] text-amber-600 font-medium">● {dirtyInSem}</span>
                                  )}
                                  {sem._isNew && (
                                    <Badge variant="default" className="text-[9px] px-1.5">Mới</Badge>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => deleteSemester(semKey)}
                                  className="p-1 rounded hover:bg-red-500/10 hover:text-red-600 text-muted-foreground/40 transition-colors"
                                  title="Xóa học kỳ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Course Table */}
                              {isExpanded && (
                                <div className="border-t bg-muted/5 pb-2">
                                  {sem.courses.length > 0 ? (
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="bg-muted/20 border-b">
                                          <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs w-20">Mã HP</th>
                                          <th className="text-left px-2 py-2 font-medium text-muted-foreground text-xs">Tên học phần</th>
                                          <th className="text-center px-2 py-2 font-medium text-muted-foreground text-xs w-10">TC</th>
                                          <th className="text-center px-2 py-2 font-medium text-muted-foreground text-xs w-24">Loại</th>
                                          <th className="text-center px-2 py-2 font-medium text-muted-foreground text-xs w-28">Nhóm TC</th>
                                          <th className="w-8" />
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sem.courses.map((item, idx) => {
                                          const isReq = item.isRequired !== false;
                                          return (
                                            <tr
                                              key={idx}
                                              className={`border-t transition-colors ${item._dirty || item._isNew
                                                ? 'bg-amber-500/5'
                                                : 'hover:bg-muted/10'}`}
                                            >
                                              <td className="px-4 py-1.5 font-mono text-xs text-primary font-bold">
                                                {item.course?.code}
                                                {item._isNew && <span className="ml-1 text-primary text-[9px]">◆</span>}
                                              </td>
                                              <td className="px-2 py-1.5 text-xs truncate max-w-[180px]" title={item.course?.name}>
                                                {item.course?.name}
                                              </td>
                                              <td className="text-center px-2 py-1.5 text-muted-foreground text-xs">
                                                {item.course?.credits}
                                              </td>
                                              <td className="text-center px-2 py-1.5">
                                                <button
                                                  type="button"
                                                  onClick={() => toggleIsRequired(semKey, idx)}
                                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all border ${isReq
                                                    ? 'bg-primary/10 text-primary border-primary/30 hover:bg-red-500/10 hover:text-red-600 hover:border-red-300'
                                                    : 'bg-amber-500/10 text-amber-600 border-amber-300 hover:bg-primary/10 hover:text-primary hover:border-primary/30'}`}
                                                  title="Click để đổi"
                                                >
                                                  {isReq ? 'Bắt buộc' : 'Tự chọn'}
                                                </button>
                                              </td>
                                              <td className="text-center px-2 py-1.5">
                                                {!isReq ? (
                                                  <input
                                                    type="text"
                                                    value={item.electiveGroup || ''}
                                                    onChange={e => changeElectiveGroup(semKey, idx, e.target.value)}
                                                    placeholder="Nhóm TC"
                                                    className="w-24 text-xs text-center bg-transparent border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                                  />
                                                ) : (
                                                  <span className="text-muted-foreground/30 text-xs">—</span>
                                                )}
                                              </td>
                                              <td className="pr-2 py-1.5">
                                                <button
                                                  type="button"
                                                  onClick={() => removeCourseFromSemester(semKey, idx)}
                                                  className="p-1 rounded hover:bg-red-500/10 hover:text-red-600 text-muted-foreground/30 transition-colors"
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
                                    <p className="text-xs text-muted-foreground text-center py-4">
                                      Chưa có học phần nào trong học kỳ này
                                    </p>
                                  )}

                                  {/* Add Course button + picker */}
                                  <div className="px-4 pt-2">
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
                                        className="flex items-center gap-1.5 text-xs text-primary hover:underline py-1"
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

          <DialogFooter>
            {dirtyCount > 0 && (
              <span className="text-xs text-amber-600 mr-auto flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                {dirtyCount} thay đổi chờ lưu
              </span>
            )}
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

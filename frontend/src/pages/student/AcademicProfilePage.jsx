/**
 * AcademicProfilePage - Hồ sơ học tập
 * Chọn CTĐT → xem HP theo HK → nhập điểm → kéo thả + xóa HP
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import {
  GraduationCap, ChevronDown, ChevronRight,
  Save, CheckCircle2, GripVertical, AlertTriangle, Trash2, X,
} from 'lucide-react';

/* ──────── Constants ──────── */
const GRADES = ['', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
const GRADE_POINTS = { 'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0 };
const gradeColors = {
  'A': 'text-emerald-600', 'B+': 'text-emerald-500', 'B': 'text-blue-500',
  'C+': 'text-blue-400', 'C': 'text-amber-500', 'D+': 'text-amber-600',
  'D': 'text-orange-500', 'F': 'text-red-500',
};

/* ──────── Utilities ──────── */
function numericToLetter(num) {
  if (num == null || num === '') return '';
  const n = parseFloat(num);
  if (isNaN(n)) return '';
  if (n >= 9) return 'A';
  if (n >= 8) return 'B+';
  if (n >= 7) return 'B';
  if (n >= 6.5) return 'C+';
  if (n >= 5.5) return 'C';
  if (n >= 5) return 'D+';
  if (n >= 4) return 'D';
  return 'F';
}

function getEffectiveGrade(cg, gradeChanges, numericChanges) {
  if (numericChanges[cg._id] !== undefined) return numericToLetter(numericChanges[cg._id]);
  if (gradeChanges[cg._id] !== undefined) return gradeChanges[cg._id];
  return cg.grade || '';
}

/**
 * Tính GPA (credit-weighted), mỗi nhóm tự chọn chỉ lấy HP tốt nhất
 */
function calcGPA(courses, gradeChanges, numericChanges, excludeField) {
  let totalWeighted = 0, totalCredits = 0;
  const required = courses.filter(cg => cg.isRequired !== false);
  const elective = courses.filter(cg => cg.isRequired === false);

  for (const cg of required) {
    if (cg.course?.[excludeField]) continue;
    const grade = getEffectiveGrade(cg, gradeChanges, numericChanges);
    if (!grade) continue;
    const credits = cg.course?.credits || 0;
    totalWeighted += (GRADE_POINTS[grade] ?? 0) * credits;
    totalCredits += credits;
  }

  // Nhóm tự chọn: lấy HP tốt nhất mỗi group
  const groups = {};
  const standalone = [];
  for (const cg of elective) {
    if (cg.course?.[excludeField]) continue;
    if (cg.electiveGroup) {
      if (!groups[cg.electiveGroup]) groups[cg.electiveGroup] = [];
      groups[cg.electiveGroup].push(cg);
    } else {
      standalone.push(cg);
    }
  }
  for (const groupCGs of Object.values(groups)) {
    const best = groupCGs
      .map(cg => {
        const grade = getEffectiveGrade(cg, gradeChanges, numericChanges);
        return grade ? { cg, gp: GRADE_POINTS[grade] ?? 0 } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.gp - a.gp)[0];
    if (best) {
      totalWeighted += best.gp * (best.cg.course?.credits || 0);
      totalCredits += best.cg.course?.credits || 0;
    }
  }
  for (const cg of standalone) {
    const grade = getEffectiveGrade(cg, gradeChanges, numericChanges);
    if (!grade) continue;
    totalWeighted += (GRADE_POINTS[grade] ?? 0) * (cg.course?.credits || 0);
    totalCredits += cg.course?.credits || 0;
  }
  return totalCredits > 0 ? Math.round((totalWeighted / totalCredits) * 100) / 100 : null;
}

/**
 * Đếm HP và TC — tính tất cả HP trong HK (bình thường)
 */
function countSemesterHPTC(courses) {
  const hpCount = courses.length;
  const tcCount = courses.reduce((sum, cg) => sum + (cg.course?.credits || 0), 0);
  return { hpCount, tcCount };
}

/**
 * Validate tiên quyết khi kéo HP sang semester khác
 */
function validateDrop(dragCG, targetSemOrder, allCourseGrades) {
  const courseCode = dragCG.course?.code;
  const prereqs = dragCG.course?.prerequisites || [];
  const coreqs = dragCG.course?.corequisites || [];

  for (const pCode of prereqs) {
    const pCG = allCourseGrades.find(cg => cg.course?.code === pCode);
    if (pCG && (pCG.semester?.order || 0) >= targetSemOrder) {
      return { valid: false, message: `HP tiên quyết "${pCode}" phải ở HK trước` };
    }
  }
  for (const cCode of coreqs) {
    const cCG = allCourseGrades.find(cg => cg.course?.code === cCode);
    if (cCG && (cCG.semester?.order || 0) > targetSemOrder) {
      return { valid: false, message: `HP song hành "${cCode}" phải ở cùng hoặc trước HK đích` };
    }
  }
  for (const cg of allCourseGrades) {
    if (cg._id === dragCG._id) continue;
    if ((cg.course?.prerequisites || []).includes(courseCode)) {
      if (targetSemOrder >= (cg.semester?.order || 0)) {
        return { valid: false, message: `"${cg.course?.code}" phụ thuộc tiên quyết vào HP này` };
      }
    }
  }
  return { valid: true };
}

/* ──────── Component ──────── */
export default function AcademicProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSems, setExpandedSems] = useState({});
  const [gradeChanges, setGradeChanges] = useState({});
  const [numericChanges, setNumericChanges] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Drag state
  const [dragItem, setDragItem] = useState(null);
  const [dragOverSem, setDragOverSem] = useState(null);
  const [dropError, setDropError] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [profileRes, programsRes] = await Promise.all([
        api.get('/student/academic-profile'),
        api.get('/curriculum-programs'),
      ]);
      setProfile(profileRes.data.data);
      setPrograms(programsRes.data.data);
      if (profileRes.data.data?.courseGrades?.length > 0) {
        const sems = {};
        profileRes.data.data.courseGrades.forEach(cg => {
          if (cg.semester?._id) sems[cg.semester._id] = true;
        });
        setExpandedSems(sems);
      }
    } catch {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectProgram(programId) {
    try {
      const { data } = await api.post('/student/academic-profile/select-program', { programId });
      setProfile(data.data);
      toast.success('Đã chọn CTĐT');
      const sems = {};
      data.data.courseGrades?.forEach(cg => {
        if (cg.semester?._id) sems[cg.semester._id] = true;
      });
      setExpandedSems(sems);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi');
    }
  }

  function handleNumericGradeChange(courseGradeId, value) {
    setNumericChanges(prev => ({ ...prev, [courseGradeId]: value }));
    setGradeChanges(prev => { const n = { ...prev }; delete n[courseGradeId]; return n; });
  }

  function handleLetterGradeChange(courseGradeId, grade) {
    setGradeChanges(prev => ({ ...prev, [courseGradeId]: grade }));
    setNumericChanges(prev => { const n = { ...prev }; delete n[courseGradeId]; return n; });
  }

  async function handleSaveGrades() {
    const grades = [];
    for (const [courseGradeId, numericGrade] of Object.entries(numericChanges)) {
      grades.push({ courseGradeId, numericGrade: numericGrade === '' ? null : parseFloat(numericGrade) });
    }
    for (const [courseGradeId, grade] of Object.entries(gradeChanges)) {
      grades.push({ courseGradeId, grade });
    }
    if (grades.length === 0) { toast.info('Không có thay đổi nào'); return; }
    setSaving(true);
    try {
      const { data } = await api.put('/student/academic-profile/grades', { grades });
      setProfile(data.data);
      setGradeChanges({});
      setNumericChanges({});
      toast.success('Đã lưu điểm');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi');
    } finally {
      setSaving(false);
    }
  }

  /* ──── Xóa HP ──── */
  async function handleRemoveCourse(courseGradeId) {
    try {
      const { data } = await api.delete(`/student/academic-profile/course/${courseGradeId}`);
      setProfile(data.data);
      setDeleteConfirm(null);
      toast.success('Đã xóa học phần');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa');
    }
  }

  /* ──── Drag & Drop ──── */
  function handleDragStart(e, cg) {
    setDragItem(cg);
    setDropError(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cg._id);
    requestAnimationFrame(() => { e.target.style.opacity = '0.4'; });
  }

  function handleDragEnd(e) {
    e.target.style.opacity = '1';
    setDragItem(null);
    setDragOverSem(null);
    setDropError(null);
  }

  function handleDragOver(e, semId, semOrder) {
    e.preventDefault();
    if (!dragItem) return;
    if (dragItem.semester?._id === semId) { e.dataTransfer.dropEffect = 'none'; return; }
    const validation = validateDrop(dragItem, semOrder, profile?.courseGrades || []);
    if (!validation.valid) {
      e.dataTransfer.dropEffect = 'none';
      setDragOverSem(semId);
      setDropError(validation.message);
      return;
    }
    e.dataTransfer.dropEffect = 'move';
    setDragOverSem(semId);
    setDropError(null);
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverSem(null);
      setDropError(null);
    }
  }

  async function handleDrop(e, targetSemId, targetSemOrder) {
    e.preventDefault();
    setDragOverSem(null);
    setDropError(null);
    if (!dragItem || dragItem.semester?._id === targetSemId) return;

    const validation = validateDrop(dragItem, targetSemOrder, profile?.courseGrades || []);
    if (!validation.valid) { toast.error(validation.message); return; }

    try {
      const { data } = await api.put('/student/academic-profile/move-course', {
        courseGradeId: dragItem._id,
        targetSemesterId: targetSemId,
      });
      setProfile(data.data);
      toast.success(`Đã chuyển ${dragItem.course?.code}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể di chuyển HP');
    }
    setDragItem(null);
  }

  /* ──── Grouping ──── */
  function groupBySemester(courseGrades) {
    const groups = {};
    for (const cg of courseGrades || []) {
      const semId = cg.semester?._id || 'unknown';
      if (!groups[semId]) groups[semId] = { semester: cg.semester, courses: [] };
      groups[semId].courses.push(cg);
    }
    return Object.values(groups).sort((a, b) => (a.semester?.order || 0) - (b.semester?.order || 0));
  }

  const semGroups = useMemo(() => groupBySemester(profile?.courseGrades), [profile?.courseGrades]);
  const hasChanges = Object.keys(gradeChanges).length + Object.keys(numericChanges).length > 0;
  const changeCount = Object.keys(gradeChanges).length + Object.keys(numericChanges).length;

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <h1 className="text-2xl font-bold">Hồ Sơ Học Tập</h1>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 skeleton rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hồ Sơ Học Tập</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Chọn CTĐT mẫu, nhập điểm, kéo thả HP giữa các học kỳ, xóa HP không học
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSaveGrades} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : `Lưu điểm (${changeCount})`}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">GPA tích lũy</p>
          <p className="text-2xl font-bold">{profile?.gpa?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">TC tích lũy</p>
          <p className="text-2xl font-bold">{profile?.completedCredits || 0}</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Học kỳ</p>
          <p className="text-2xl font-bold">{profile?.currentSemester || 1}</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">CTĐT</p>
          <p className="text-sm font-semibold mt-1 line-clamp-1">
            {profile?.curriculumProgram?.name || 'Chưa chọn'}
          </p>
        </div>
      </div>

      {/* Chọn CTĐT */}
      {!profile?.curriculumProgram && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" /> Chọn Chương trình Đào tạo
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Chọn CTĐT có sẵn để hệ thống tự động tải danh sách học phần theo từng học kỳ.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {programs.map(p => (
              <button
                key={p._id}
                onClick={() => handleSelectProgram(p._id)}
                className="text-left p-4 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Badge variant="default" className="mb-2">{p.code}</Badge>
                <h3 className="font-medium">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{p.totalCredits} tín chỉ</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Danh sách HP theo HK */}
      {semGroups.length > 0 && (
        <div className="space-y-3">
          {dragItem && (
            <div className="text-xs text-center text-muted-foreground py-1 animate-pulse">
              🔀 Kéo <strong>{dragItem.course?.code}</strong> vào học kỳ muốn chuyển
            </div>
          )}

          {semGroups.map(({ semester, courses }) => {
            const semId = semester?._id || 'unknown';
            const semOrder = semester?.order || 0;
            const isExpanded = expandedSems[semId];
            const completedCount = courses.filter(c => {
              const g = getEffectiveGrade(c, gradeChanges, numericChanges);
              return g && g !== '' && g !== 'F';
            }).length;
            const semesterGPA = calcGPA(courses, gradeChanges, numericChanges, 'excludeFromSemesterGPA');
            const { hpCount: effectiveHP, tcCount: effectiveTC } = countSemesterHPTC(courses);

            const isDragOver = dragOverSem === semId;
            const isSameSem = dragItem?.semester?._id === semId;
            const hasError = isDragOver && dropError;

            return (
              <div
                key={semId}
                className={`rounded-xl border bg-card overflow-hidden transition-all duration-200 ${
                  isDragOver && !hasError && !isSameSem
                    ? 'ring-2 ring-primary border-primary/50 bg-primary/5'
                    : hasError
                    ? 'ring-2 ring-red-500 border-red-500/50 bg-red-500/5'
                    : ''
                }`}
                onDragOver={e => handleDragOver(e, semId, semOrder)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, semId, semOrder)}
              >
                <button
                  onClick={() => setExpandedSems(prev => ({ ...prev, [semId]: !prev[semId] }))}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span className="font-semibold">{semester?.name || 'Học kỳ'}</span>
                    <Badge variant="secondary">{effectiveHP} HP</Badge>
                    <span className="text-xs text-muted-foreground">{effectiveTC} TC</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {semesterGPA !== null && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                        GPA HK: {semesterGPA.toFixed(2)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {completedCount}/{courses.length} hoàn thành
                    </span>
                    {completedCount === courses.length && courses.length > 0 && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                </button>

                {hasError && (
                  <div className="flex items-center gap-2 px-5 py-2 text-xs text-red-600 bg-red-500/10 border-t border-red-500/20">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {dropError}
                  </div>
                )}

                {isExpanded && (
                  <div className="border-t">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/20">
                          <th className="w-8"></th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs w-20">Mã HP</th>
                          <th className="text-left px-2 py-2 font-medium text-muted-foreground text-xs">Tên học phần</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground text-xs w-10">TC</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground text-xs w-14">Loại</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground text-xs w-20">Điểm số</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground text-xs w-20">Điểm chữ</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map(cg => {
                          const numVal = numericChanges[cg._id] !== undefined ? numericChanges[cg._id] : (cg.numericGrade ?? '');
                          const currentGrade = getEffectiveGrade(cg, gradeChanges, numericChanges);
                          const isElective = cg.isRequired === false;
                          const isDragging = dragItem?._id === cg._id;

                          return (
                            <tr
                              key={cg._id}
                              draggable
                              onDragStart={e => handleDragStart(e, cg)}
                              onDragEnd={handleDragEnd}
                              className={`border-t transition-colors cursor-grab active:cursor-grabbing ${
                                isDragging ? 'opacity-40' : 'hover:bg-muted/10'
                              } ${isElective ? 'bg-amber-500/[0.03]' : ''}`}
                            >
                              <td className="pl-2 py-2 text-muted-foreground/40 hover:text-muted-foreground">
                                <GripVertical className="w-4 h-4" />
                              </td>
                              <td className="px-3 py-2 font-mono text-xs text-primary font-bold">{cg.course?.code}</td>
                              <td className="px-2 py-2 text-sm truncate" style={{ maxWidth: '200px' }} title={cg.course?.name}>
                                {cg.course?.name}
                                {cg.electiveGroup && (
                                  <span className="ml-1 text-[9px] text-muted-foreground/50">
                                    [{cg.electiveGroup.split('_')[0]}]
                                  </span>
                                )}
                              </td>
                              <td className="text-center px-2 py-2 text-muted-foreground text-xs">{cg.course?.credits}</td>
                              <td className="text-center px-2 py-2">
                                {isElective ? (
                                  <Badge variant="warning" className="text-[10px] px-1.5 py-0">TC</Badge>
                                ) : (
                                  <Badge variant="default" className="text-[10px] px-1.5 py-0">BB</Badge>
                                )}
                              </td>
                              <td className="text-center px-2 py-2">
                                <input
                                  type="number" min="0" max="10" step="0.1"
                                  value={numVal}
                                  onChange={e => handleNumericGradeChange(cg._id, e.target.value)}
                                  placeholder="—"
                                  className="w-16 text-center text-sm font-semibold bg-transparent border rounded-md px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                  onClick={e => e.stopPropagation()}
                                />
                              </td>
                              <td className="text-center px-2 py-2">
                                <select
                                  value={currentGrade || ''}
                                  onChange={e => handleLetterGradeChange(cg._id, e.target.value)}
                                  className={`w-16 text-center text-sm font-semibold bg-transparent border rounded-md px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary ${gradeColors[currentGrade] || 'text-muted-foreground'}`}
                                  onClick={e => e.stopPropagation()}
                                >
                                  {GRADES.map(g => (
                                    <option key={g} value={g}>{g || '—'}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="pr-2 py-2">
                                {deleteConfirm === cg._id ? (
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      onClick={e => { e.stopPropagation(); handleRemoveCourse(cg._id); }}
                                      className="p-0.5 rounded text-red-500 hover:bg-red-500/10"
                                      title="Xác nhận xóa"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={e => { e.stopPropagation(); setDeleteConfirm(null); }}
                                      className="p-0.5 rounded text-muted-foreground hover:bg-muted/30"
                                      title="Hủy"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={e => { e.stopPropagation(); setDeleteConfirm(cg._id); }}
                                    className="p-1 rounded text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                    title="Xóa học phần"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Re-select CTĐT */}
      {profile?.curriculumProgram && (
        <div className="text-center pt-2">
          <button
            onClick={() => {
              if (window.confirm('Chọn lại CTĐT sẽ xóa toàn bộ điểm đã nhập. Tiếp tục?')) {
                handleSelectProgram(profile.curriculumProgram._id);
              }
            }}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground underline transition-colors"
          >
            Tải lại CTĐT (reset dữ liệu)
          </button>
        </div>
      )}
    </div>
  );
}

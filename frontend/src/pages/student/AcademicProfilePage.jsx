/**
 * AcademicProfilePage - Hồ sơ học tập
 * Chọn CTĐT → xem danh sách HP theo HK → nhập điểm số → tự chuyển điểm chữ
 * GPA theo HK + GPA tích lũy
 */
import { useState, useEffect, useMemo } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import {
  GraduationCap, ChevronDown, ChevronRight,
  Save, CheckCircle2,
} from 'lucide-react';

const GRADES = ['', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
const GRADE_POINTS = { 'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0 };
const gradeColors = {
  'A': 'text-emerald-600', 'B+': 'text-emerald-500', 'B': 'text-blue-500',
  'C+': 'text-blue-400', 'C': 'text-amber-500', 'D+': 'text-amber-600',
  'D': 'text-orange-500', 'F': 'text-red-500',
};

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

/**
 * Tính GPA cho 1 nhóm courses (theo credit-weighted)
 * excludeField: 'excludeFromCumulativeGPA' | 'excludeFromSemesterGPA'
 * Chỉ tính 1 HP tự chọn có điểm cao nhất trong từng HK
 */
function calcGPA(courses, gradeChanges, numericChanges, excludeField) {
  let totalWeighted = 0;
  let totalCredits = 0;

  // Tách BB vs TC
  const required = courses.filter(cg => cg.isRequired !== false);
  const elective = courses.filter(cg => cg.isRequired === false);

  // Xử lý BB
  for (const cg of required) {
    if (cg.course?.[excludeField]) continue;
    const grade = getEffectiveGrade(cg, gradeChanges, numericChanges);
    if (!grade || grade === '') continue;
    const credits = cg.course?.credits || 0;
    totalWeighted += (GRADE_POINTS[grade] ?? 0) * credits;
    totalCredits += credits;
  }

  // Xử lý TC — chỉ lấy HP có điểm cao nhất
  if (elective.length > 0) {
    const electiveWithGrade = elective
      .map(cg => {
        if (cg.course?.[excludeField]) return null;
        const grade = getEffectiveGrade(cg, gradeChanges, numericChanges);
        if (!grade || grade === '') return null;
        return { cg, grade, gp: GRADE_POINTS[grade] ?? 0 };
      })
      .filter(Boolean)
      .sort((a, b) => b.gp - a.gp);

    if (electiveWithGrade.length > 0) {
      const best = electiveWithGrade[0];
      const credits = best.cg.course?.credits || 0;
      totalWeighted += best.gp * credits;
      totalCredits += credits;
    }
  }

  return totalCredits > 0 ? Math.round((totalWeighted / totalCredits) * 100) / 100 : null;
}

function getEffectiveGrade(cg, gradeChanges, numericChanges) {
  if (numericChanges[cg._id] !== undefined) {
    return numericToLetter(numericChanges[cg._id]);
  }
  if (gradeChanges[cg._id] !== undefined) {
    return gradeChanges[cg._id];
  }
  return cg.grade || '';
}

export default function AcademicProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSems, setExpandedSems] = useState({});
  const [gradeChanges, setGradeChanges] = useState({});
  const [numericChanges, setNumericChanges] = useState({});

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
        profileRes.data.data.courseGrades.forEach((cg) => {
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
      data.data.courseGrades?.forEach((cg) => {
        if (cg.semester?._id) sems[cg.semester._id] = true;
      });
      setExpandedSems(sems);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi');
    }
  }

  function handleNumericGradeChange(courseGradeId, value) {
    setNumericChanges((prev) => ({ ...prev, [courseGradeId]: value }));
    // Clear any manual letter grade change
    setGradeChanges((prev) => {
      const next = { ...prev };
      delete next[courseGradeId];
      return next;
    });
  }

  function handleLetterGradeChange(courseGradeId, grade) {
    setGradeChanges((prev) => ({ ...prev, [courseGradeId]: grade }));
    // Clear numeric change
    setNumericChanges((prev) => {
      const next = { ...prev };
      delete next[courseGradeId];
      return next;
    });
  }

  async function handleSaveGrades() {
    const grades = [];

    // Collect numeric changes
    for (const [courseGradeId, numericGrade] of Object.entries(numericChanges)) {
      grades.push({
        courseGradeId,
        numericGrade: numericGrade === '' ? null : parseFloat(numericGrade),
      });
    }

    // Collect letter-only changes
    for (const [courseGradeId, grade] of Object.entries(gradeChanges)) {
      grades.push({ courseGradeId, grade });
    }

    if (grades.length === 0) {
      toast.info('Không có thay đổi nào');
      return;
    }

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

  // Nhóm courseGrades theo semester
  function groupBySemester(courseGrades) {
    const groups = {};
    for (const cg of courseGrades || []) {
      const semId = cg.semester?._id || 'unknown';
      if (!groups[semId]) {
        groups[semId] = { semester: cg.semester, courses: [] };
      }
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
          {[1, 2, 3].map((i) => <div key={i} className="h-16 skeleton rounded-lg" />)}
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
          <p className="text-muted-foreground text-sm mt-1">Chọn CTĐT mẫu và nhập điểm các học phần</p>
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
            {programs.map((p) => (
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
          {semGroups.map(({ semester, courses }) => {
            const semId = semester?._id || 'unknown';
            const isExpanded = expandedSems[semId];
            const completedCount = courses.filter((c) => {
              const g = getEffectiveGrade(c, gradeChanges, numericChanges);
              return g && g !== '' && g !== 'F';
            }).length;

            // GPA HK
            const semesterGPA = calcGPA(courses, gradeChanges, numericChanges, 'excludeFromSemesterGPA');

            // Đếm TC HK
            const semCredits = courses.reduce((s, c) => s + (c.course?.credits || 0), 0);

            return (
              <div key={semId} className="rounded-xl border bg-card overflow-hidden">
                <button
                  onClick={() => setExpandedSems((prev) => ({ ...prev, [semId]: !prev[semId] }))}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span className="font-semibold">{semester?.name || 'Học kỳ'}</span>
                    <Badge variant="secondary">{courses.length} HP</Badge>
                    <span className="text-xs text-muted-foreground">{semCredits} TC</span>
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

                {isExpanded && (
                  <div className="border-t">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/20">
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs w-20">Mã HP</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Tên học phần</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground text-xs w-10">TC</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground text-xs w-16">Loại</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground text-xs w-20">Điểm số</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground text-xs w-20">Điểm chữ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((cg) => {
                          const numVal = numericChanges[cg._id] !== undefined ? numericChanges[cg._id] : (cg.numericGrade ?? '');
                          const currentGrade = getEffectiveGrade(cg, gradeChanges, numericChanges);
                          const isElective = cg.isRequired === false;

                          return (
                            <tr key={cg._id} className={`border-t hover:bg-muted/10 transition-colors ${isElective ? 'bg-amber-500/3' : ''}`}>
                              <td className="px-4 py-2 font-mono text-xs text-primary font-bold">{cg.course?.code}</td>
                              <td className="px-3 py-2 text-sm" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cg.course?.name}>
                                {cg.course?.name}
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
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  value={numVal}
                                  onChange={(e) => handleNumericGradeChange(cg._id, e.target.value)}
                                  placeholder="—"
                                  className="w-16 text-center text-sm font-semibold bg-transparent border rounded-md px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </td>
                              <td className="text-center px-2 py-2">
                                <select
                                  value={currentGrade || ''}
                                  onChange={(e) => handleLetterGradeChange(cg._id, e.target.value)}
                                  className={`w-16 text-center text-sm font-semibold bg-transparent border rounded-md px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary ${gradeColors[currentGrade] || 'text-muted-foreground'}`}
                                >
                                  {GRADES.map((g) => (
                                    <option key={g} value={g}>{g || '—'}</option>
                                  ))}
                                </select>
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
    </div>
  );
}

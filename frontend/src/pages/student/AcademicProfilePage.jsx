/**
 * AcademicProfilePage - Hồ sơ học tập
 * Chọn CTĐT → xem danh sách HP theo HK → nhập điểm
 */
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import {
  BookOpen, GraduationCap, ChevronDown, ChevronRight,
  Save, CheckCircle2, AlertCircle,
} from 'lucide-react';

const GRADES = ['', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
const gradeColors = {
  'A': 'text-emerald-600', 'B+': 'text-emerald-500', 'B': 'text-blue-500',
  'C+': 'text-blue-400', 'C': 'text-amber-500', 'D+': 'text-amber-600',
  'D': 'text-orange-500', 'F': 'text-red-500',
};

export default function AcademicProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSems, setExpandedSems] = useState({});
  const [gradeChanges, setGradeChanges] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [profileRes, programsRes] = await Promise.all([
        api.get('/student/academic-profile'),
        api.get('/curriculum-programs'),
      ]);
      setProfile(profileRes.data.data);
      setPrograms(programsRes.data.data);

      // Mở tất cả semesters theo default
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

  function handleGradeChange(courseGradeId, grade) {
    setGradeChanges((prev) => ({ ...prev, [courseGradeId]: grade }));
  }

  async function handleSaveGrades() {
    const grades = Object.entries(gradeChanges).map(([courseGradeId, grade]) => ({
      courseGradeId, grade,
    }));
    if (grades.length === 0) {
      toast.info('Không có thay đổi nào');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put('/student/academic-profile/grades', { grades });
      setProfile(data.data);
      setGradeChanges({});
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
        groups[semId] = {
          semester: cg.semester,
          courses: [],
        };
      }
      groups[semId].courses.push(cg);
    }
    return Object.values(groups).sort((a, b) => (a.semester?.order || 0) - (b.semester?.order || 0));
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <h1 className="text-2xl font-bold">Hồ sơ Học tập</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 skeleton rounded-lg" />)}
        </div>
      </div>
    );
  }

  const semGroups = groupBySemester(profile?.courseGrades);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hồ sơ Học tập</h1>
          <p className="text-muted-foreground text-sm mt-1">Chọn CTĐT và nhập điểm các học phần</p>
        </div>
        {Object.keys(gradeChanges).length > 0 && (
          <Button onClick={handleSaveGrades} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : `Lưu điểm (${Object.keys(gradeChanges).length})`}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">GPA</p>
          <p className="text-2xl font-bold">{profile?.gpa?.toFixed(2) || '—'}</p>
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
            const completedCount = courses.filter((c) =>
              (gradeChanges[c._id] || c.grade) && (gradeChanges[c._id] || c.grade) !== 'F'
            ).length;

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
                  </div>
                  <div className="flex items-center gap-2">
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
                          <th className="text-left px-5 py-2 font-medium text-muted-foreground text-xs">Mã HP</th>
                          <th className="text-left px-5 py-2 font-medium text-muted-foreground text-xs">Tên học phần</th>
                          <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs w-12">TC</th>
                          <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs w-20">Điểm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((cg) => {
                          const currentGrade = gradeChanges[cg._id] !== undefined ? gradeChanges[cg._id] : cg.grade;
                          return (
                            <tr key={cg._id} className="border-t hover:bg-muted/10 transition-colors">
                              <td className="px-5 py-2.5 font-mono text-xs text-primary">{cg.course?.code}</td>
                              <td className="px-5 py-2.5">{cg.course?.name}</td>
                              <td className="text-center px-3 py-2.5 text-muted-foreground">{cg.course?.credits}</td>
                              <td className="text-center px-3 py-2.5">
                                <select
                                  value={currentGrade || ''}
                                  onChange={(e) => handleGradeChange(cg._id, e.target.value)}
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

/**
 * LearningSessionPage - Chi tiết buổi học
 * Hiển thị nội dung kỹ năng, tài nguyên (từ Resource collection), bài tập, nút hoàn thành
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import {
  ArrowLeft, BookOpen, FileText, ExternalLink,
  CheckCircle2, Loader2, Clock, Pencil, Save,
  Video, Globe, BookMarked, Wrench, GraduationCap,
  ClipboardCheck, ChevronDown, ChevronUp,
  Dumbbell, HelpCircle, Calendar, Target,
} from 'lucide-react';

const resourceIcons = {
  video: Video, article: FileText, documentation: Globe,
  course: GraduationCap, book: BookMarked, tool: Wrench,
};

const resourceColor = {
  video: { bg: 'bg-red-500/10', icon: 'text-red-500' },
  article: { bg: 'bg-blue-500/10', icon: 'text-blue-500' },
  documentation: { bg: 'bg-sky-500/10', icon: 'text-sky-500' },
  course: { bg: 'bg-violet-500/10', icon: 'text-violet-500' },
  book: { bg: 'bg-amber-500/10', icon: 'text-amber-500' },
  tool: { bg: 'bg-emerald-500/10', icon: 'text-emerald-500' },
};

const DIFFICULTY_LABELS = {
  beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao',
  easy: 'Dễ', medium: 'Trung bình', hard: 'Khó',
};

const DIFF_CLS = {
  beginner: 'bg-emerald-500/10 text-emerald-600',
  easy: 'bg-emerald-500/10 text-emerald-600',
  intermediate: 'bg-amber-500/10  text-amber-600',
  medium: 'bg-amber-500/10  text-amber-600',
  advanced: 'bg-red-500/10    text-red-600',
  hard: 'bg-red-500/10    text-red-600',
};

export default function LearningSessionPage() {
  const { prId, sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState(null);

  function goBack() {
    if (location.state?.openPrId) {
      navigate('/student/my-roadmap', { state: { openPrId: location.state.openPrId } });
    } else {
      navigate(-1);
    }
  }

  useEffect(() => { loadSession(); }, [prId, sessionId]);

  async function loadSession() {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/student/my-roadmaps/${prId}/sessions/${sessionId}`);
      setData(res.data);
      setNotes(res.data.session.notes || '');
    } catch {
      toast.error('Không thể tải buổi học');
      goBack();
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      await api.patch(`/student/my-roadmaps/${prId}/sessions/${sessionId}/complete`);
      toast.success('Đã hoàn thành buổi học!');
      loadSession();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi');
    } finally {
      setCompleting(false);
    }
  }

  async function saveNotes() {
    setSavingNotes(true);
    try {
      await api.patch(`/student/my-roadmaps/${prId}/sessions/${sessionId}/notes`, { notes });
      toast.success('Đã lưu ghi chú');
    } catch {
      toast.error('Lỗi lưu ghi chú');
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-4 max-w-4xl mx-auto">
        <div className="h-36 skeleton rounded-2xl" />
        <div className="h-16 skeleton rounded-xl" />
        <div className="h-48 skeleton rounded-xl" />
        <div className="h-32 skeleton rounded-xl" />
      </div>
    );
  }
  if (!data) return null;

  const { session, skill, progress } = data;
  const isCompleted = session.status === 'completed';

  // Derive missed on frontend (backend may still return 'upcoming' for past sessions)
  const _isMissedFn = () => {
    if (session.status === 'missed') return true;
    if (session.status !== 'upcoming') return false;
    const [endH, endM] = (session.endTime || '23:59').split(':').map(Number);
    const end = new Date(session.date);
    end.setHours(endH, endM, 0, 0);
    return end < new Date();
  };
  const isMissed = !isCompleted && _isMissedFn();
  const pct = progress.percentage || 0;

  return (
    <div className="animate-fade-in space-y-5 max-w-4xl mx-auto">

      {/* ── Hero Header ── */}
      <div className={`relative overflow-hidden rounded-2xl border p-6
        ${isCompleted
          ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent'
          : isMissed
            ? 'bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent'
            : 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent'}`}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-sky-500/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <button
              onClick={goBack}
              className="mt-0.5 p-1.5 rounded-lg hover:bg-black/10 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Buổi học</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                <span className="text-2xl">{skill.icon}</span>
                {skill.name}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(session.date).toLocaleDateString('vi-VN')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {session.startTime} – {session.endTime}
                </span>
                {skill.category && (
                  <span className="flex items-center gap-1 capitalize">
                    <Target className="w-3.5 h-3.5" />
                    {skill.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status / Action */}
          {isCompleted ? (
            <span className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
              <CheckCircle2 className="w-4 h-4" />
              Đã hoàn thành
            </span>
          ) : isMissed ? (
            <div className="flex flex-col items-end gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-500/10 text-red-600">Đã bỏ lỡ</span>
              <Button size="sm" onClick={handleComplete} disabled={completing} className="gap-1.5">
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Đánh dấu hoàn thành
              </Button>
            </div>
          ) : (
            <Button onClick={handleComplete} disabled={completing} className="gap-2 shadow-md">
              {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Hoàn thành buổi học
            </Button>
          )}
        </div>
      </div>

      {/* ── Skill Progress ── */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Tiến độ kỹ năng</span>
          <span className={`text-sm font-bold ${pct === 100 ? 'text-emerald-500' : 'text-primary'}`}>{pct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-1.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{progress.completed}/{progress.total} buổi hoàn thành</span>
          {pct === 100 && (
            <Link to={`/student/my-roadmap/${prId}/test/${skill._id}`}>
              <button className="flex items-center gap-1 text-emerald-600 font-medium hover:underline">
                <ClipboardCheck className="w-3.5 h-3.5" /> Làm bài TEST
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Description ── */}
      {skill.description && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4 text-primary" /> Mô tả kỹ năng
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{skill.description}</p>
        </div>
      )}

      {/* ── Resources ── */}
      {skill.resources?.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
            <GraduationCap className="w-4 h-4 text-primary" />
            Tài nguyên học tập
            <span className="ml-auto text-xs font-normal text-muted-foreground">{skill.resources.length} tài nguyên</span>
          </h3>
          <div className="space-y-2">
            {skill.resources.map(res => {
              const IconComp = resourceIcons[res.category] || FileText;
              const colors = resourceColor[res.category] || { bg: 'bg-primary/10', icon: 'text-primary' };
              const diffCls = DIFF_CLS[res.difficulty] || '';
              return (
                <div key={res._id} className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 hover:bg-muted/20 transition-all group">
                  <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                    <IconComp className={`w-4 h-4 ${colors.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{res.title}</p>
                    {res.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{res.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {res.estimatedMinutes && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {res.estimatedMinutes}ph
                      </span>
                    )}
                    {res.difficulty && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${diffCls}`}>
                        {DIFFICULTY_LABELS[res.difficulty] || res.difficulty}
                      </span>
                    )}
                    {res.url && (
                      <a href={res.url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        onClick={e => e.stopPropagation()}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Exercises ── */}
      {skill.exercises?.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
            <Dumbbell className="w-4 h-4 text-primary" />
            Bài tập thực hành
            <span className="ml-auto text-xs font-normal text-muted-foreground">{skill.exercises.length} bài tập</span>
          </h3>
          <div className="space-y-2">
            {skill.exercises.map((ex, idx) => (
              <div key={ex._id} className="rounded-lg border overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors text-left"
                  onClick={() => setExpandedExercise(expandedExercise === idx ? null : idx)}
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{ex.title}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {ex.difficulty && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${DIFF_CLS[ex.difficulty] || 'bg-muted text-muted-foreground'}`}>
                          {DIFFICULTY_LABELS[ex.difficulty] || ex.difficulty}
                        </span>
                      )}
                      {ex.estimatedMinutes && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {ex.estimatedMinutes}ph
                        </span>
                      )}
                    </div>
                  </div>
                  {expandedExercise === idx
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {expandedExercise === idx && (
                  <div className="px-4 pb-4 border-t bg-muted/10 pt-3 space-y-2">
                    {ex.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{ex.description}</p>
                    )}
                    {ex.content && (
                      <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                        <span className="font-semibold text-foreground not-italic block mb-1">Hướng dẫn:</span>
                        {ex.content}
                      </div>
                    )}
                    {ex.url && (
                      <a href={ex.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                        <ExternalLink className="w-3 h-3" /> Xem bài tập
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Test unlock hint ── */}
      {skill.testResources?.length > 0 && (
        <div className={`rounded-xl border p-4 flex items-start gap-3
          ${pct === 100
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : 'bg-muted/30'}`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
            ${pct === 100 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {pct === 100 ? 'Mở khóa bài test!' : `Bài TEST ( ${skill.testResources.length} bài )`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pct === 100
                ? 'Bạn đã hoàn thành tất cả buổi học — có thể làm bài test ngay!'
                : 'Hoàn thành tất cả buổi học để mở khóa bài test.'}
            </p>
            {pct === 100 && (
              <Link to={`/student/my-roadmap/${prId}/test/${skill._id}`}>
                <button className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline">
                  <ClipboardCheck className="w-3.5 h-3.5" /> Làm bài TEST ngay
                </button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Notes ── */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Pencil className="w-4 h-4 text-primary" /> Ghi chú cá nhân
        </h3>
        <textarea
          className="w-full p-3 rounded-lg border bg-background text-sm resize-y min-h-[100px]
            focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
          placeholder="Ghi chú nội dung đã học, từ khóa quan trọng..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
        />
        <Button size="sm" variant="outline" className="mt-2 gap-1.5" onClick={saveNotes} disabled={savingNotes}>
          {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Lưu ghi chú
        </Button>
      </div>
    </div>
  );
}

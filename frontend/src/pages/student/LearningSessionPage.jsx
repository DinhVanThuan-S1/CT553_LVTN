/**
 * LearningSessionPage - Chi tiết buổi học
 * Hiển thị nội dung kỹ năng, tài nguyên, bài tập, nút hoàn thành
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import {
  ArrowLeft, BookOpen, Play, FileText, ExternalLink,
  CheckCircle2, Loader2, Clock, Pencil, Save,
  Video, Globe, BookMarked, Wrench, GraduationCap,
  ClipboardCheck, ChevronDown, ChevronUp, Award,
} from 'lucide-react';

const resourceIcons = {
  video: Video, article: FileText, documentation: Globe,
  course: GraduationCap, book: BookMarked, tool: Wrench,
};

export default function LearningSessionPage() {
  const { prId, sessionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState(null);

  useEffect(() => { loadSession(); }, [prId, sessionId]);

  async function loadSession() {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/student/my-roadmaps/${prId}/sessions/${sessionId}`);
      setData(res.data);
      setNotes(res.data.session.notes || '');
    } catch {
      toast.error('Không thể tải buổi học');
      navigate('/student/my-roadmap');
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
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!data) return null;

  const { session, skill, progress } = data;
  const isCompleted = session.status === 'completed';

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/student/my-roadmap')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-2xl">{skill.icon}</span> {skill.name}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            {new Date(session.date).toLocaleDateString('vi-VN')} • {session.startTime} - {session.endTime}
          </p>
        </div>
        {isCompleted ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành
          </Badge>
        ) : (
          <Button onClick={handleComplete} disabled={completing} className="gap-1.5">
            {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Hoàn thành buổi học
          </Button>
        )}
      </div>

      {/* Progress for this skill */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Tiến độ kỹ năng: {skill.name}</span>
          <span className="text-sm font-bold text-primary">{progress.percentage}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${progress.percentage}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {progress.completed}/{progress.total} buổi hoàn thành
          {progress.percentage === 100 && ' — Sẵn sàng làm bài test!'}
        </p>
        {progress.percentage === 100 && (
          <Link to={`/student/my-roadmap/${prId}/test/${skill._id}`}>
            <Button size="sm" variant="outline" className="gap-1.5 mt-2">
              <ClipboardCheck className="w-4 h-4" /> Làm bài Test
            </Button>
          </Link>
        )}
      </div>

      {/* Description */}
      {skill.description && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> Mô tả kỹ năng
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{skill.description}</p>
        </div>
      )}

      {/* Learning Resources */}
      {skill.resources?.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" /> Tài nguyên học tập ({skill.resources.length})
          </h3>
          <div className="space-y-2">
            {skill.resources.map((res) => {
              const IconComp = resourceIcons[res.type] || FileText;
              return (
                <a key={res._id} href={res.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <IconComp className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">
                      {res.title}
                    </span>
                    {res.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{res.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {res.duration && (
                      <Badge variant="secondary" className="text-[10px]">{res.duration}</Badge>
                    )}
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Exercises */}
      {skill.exercises?.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" /> Bài tập thực hành ({skill.exercises.length})
          </h3>
          <div className="space-y-2">
            {skill.exercises.map((ex,idx) => (
              <div key={ex._id} className="rounded-lg border overflow-hidden">
                <button className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors text-left"
                  onClick={() => setExpandedExercise(expandedExercise === idx ? null : idx)}>
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{ex.title}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px]">{ex.difficulty}</Badge>
                      {ex.estimatedTime && <span className="text-[10px] text-muted-foreground">{ex.estimatedTime}</span>}
                    </div>
                  </div>
                  {expandedExercise === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedExercise === idx && (
                  <div className="px-3 pb-3 border-t bg-muted/10">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{ex.description}</p>
                    {ex.instructions && (
                      <div className="mt-2 p-2 rounded bg-muted/30 text-xs text-muted-foreground">
                        <strong>Hướng dẫn:</strong> {ex.instructions}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Pencil className="w-4 h-4 text-primary" /> Ghi chú cá nhân
        </h3>
        <textarea
          className="w-full p-3 rounded-lg border bg-background text-sm resize-y min-h-[100px] focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          placeholder="Ghi chú nội dung đã học, từ khóa quan trọng..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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

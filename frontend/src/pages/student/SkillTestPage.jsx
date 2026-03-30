/**
 * SkillTestPage - Bài test kỹ năng
 * Quiz 5-10 câu, chấm điểm, cập nhật tiến độ
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import {
  ArrowLeft, ClipboardCheck, CheckCircle2, XCircle,
  Loader2, Trophy, RefreshCcw, ChevronRight, AlertCircle,
  BookOpen,
} from 'lucide-react';

export default function SkillTestPage() {
  const { prId, skillId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { loadTest(); }, [prId, skillId]);

  async function loadTest() {
    setLoading(true);
    setResult(null);
    setAnswers({});
    setCurrentQ(0);
    try {
      const { data } = await api.get(`/student/my-roadmaps/${prId}/skills/${skillId}/test`);
      setTestData(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải bài test');
      navigate('/student/my-roadmap');
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(questionId, optionId) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  async function handleSubmit() {
    if (!testData) return;
    const unanswered = testData.questions.filter((q) => !answers[q._id]);
    if (unanswered.length > 0) {
      toast.error(`Còn ${unanswered.length} câu chưa trả lời`);
      return;
    }
    setSubmitting(true);
    try {
      const payload = testData.questions.map((q) => ({
        questionId: q._id,
        selectedOption: answers[q._id],
      }));
      const { data } = await api.post(
        `/student/my-roadmaps/${prId}/skills/${skillId}/test`,
        { answers: payload }
      );
      setResult(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi khi nộp bài');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!testData) return null;

  const { skill, questions, passingScore } = testData;

  // Result screen
  if (result) {
    return (
      <div className="animate-fade-in space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/my-roadmap')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Kết quả Test: {skill.name}</h1>
        </div>

        {/* Score card */}
        <div className={`rounded-xl border p-8 text-center ${
          result.passed ? 'bg-emerald-500/5 border-emerald-200' : 'bg-red-500/5 border-red-200'
        }`}>
          <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
            result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          }`}>
            {result.passed ? <Trophy className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
          </div>
          <h2 className="text-3xl font-bold mb-1">{result.score}%</h2>
          <p className="text-sm text-muted-foreground mb-2">
            {result.correct}/{result.total} câu đúng
          </p>
          <p className={`text-sm font-medium ${result.passed ? 'text-emerald-600' : 'text-red-600'}`}>
            {result.message}
          </p>
        </div>

        {/* Detail results */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold mb-3">Chi tiết câu trả lời</h3>
          <div className="space-y-3">
            {result.results.map((r, i) => (
              <div key={r.questionId} className={`rounded-lg p-3 border ${
                r.correct ? 'bg-emerald-500/5 border-emerald-200' : 'bg-red-500/5 border-red-200'
              }`}>
                <div className="flex items-start gap-2">
                  {r.correct
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">Câu {i + 1}: {r.question}</p>
                    {!r.correct && r.correctAnswer && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Đáp án đúng: <strong className="text-emerald-600">{r.correctAnswer}</strong>
                      </p>
                    )}
                    {r.explanation && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{r.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-center">
          {!result.passed && (
            <Button variant="outline" className="gap-1.5" onClick={loadTest}>
              <RefreshCcw className="w-4 h-4" /> Thử lại
            </Button>
          )}
          <Button onClick={() => navigate('/student/my-roadmap')} className="gap-1.5">
            <BookOpen className="w-4 h-4" /> Về lộ trình
          </Button>
        </div>
      </div>
    );
  }

  // Quiz screen
  const question = questions[currentQ];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/student/my-roadmap')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span>{skill.icon}</span> Test: {skill.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {questions.length} câu hỏi • Cần đạt {passingScore}%
          </p>
        </div>
        <Badge variant="secondary">{answeredCount}/{questions.length}</Badge>
      </div>

      {/* Progress */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Question card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline">Câu {currentQ + 1}/{questions.length}</Badge>
          <Badge variant="secondary">{question.difficulty}</Badge>
        </div>

        <h3 className="text-lg font-semibold mb-5">{question.question}</h3>

        <div className="space-y-2.5">
          {question.options.map((opt) => {
            const selected = answers[question._id] === opt._id;
            return (
              <button key={opt._id}
                className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                  selected
                    ? 'border-primary bg-primary/[0.05] ring-1 ring-primary/30'
                    : 'border-transparent bg-muted/30 hover:bg-muted/50'
                }`}
                onClick={() => selectAnswer(question._id, opt._id)}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selected ? 'border-primary' : 'border-muted-foreground/30'
                  }`}>
                    {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm">{opt.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={currentQ === 0}
          onClick={() => setCurrentQ((p) => p - 1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Trước
        </Button>

        <div className="flex items-center gap-1.5">
          {questions.map((_, i) => (
            <button key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === currentQ ? 'bg-primary' : answers[questions[i]._id] ? 'bg-primary/40' : 'bg-muted'
            }`} onClick={() => setCurrentQ(i)} />
          ))}
        </div>

        {currentQ < questions.length - 1 ? (
          <Button variant="outline" size="sm" onClick={() => setCurrentQ((p) => p + 1)}>
            Tiếp <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button size="sm" disabled={submitting || answeredCount < questions.length}
            className="gap-1.5" onClick={handleSubmit}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
            Nộp bài
          </Button>
        )}
      </div>
    </div>
  );
}

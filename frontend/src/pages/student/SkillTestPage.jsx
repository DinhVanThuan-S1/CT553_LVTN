/**
 * SkillTestPage - Bài test kỹ năng
 * Quiz 5-10 câu, chấm điểm, cập nhật tiến độ
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import {
  ArrowLeft, ClipboardCheck, CheckCircle2, XCircle,
  Loader2, Trophy, RefreshCcw, BookOpen, AlertCircle,
  ChevronRight, ChevronLeft, Target,
} from 'lucide-react';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

const DIFF_CONFIG = {
  easy: { label: 'Dễ', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  medium: { label: 'Trung bình', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  hard: { label: 'Khó', cls: 'bg-red-500/10 text-red-600 border-red-500/20' },
  beginner: { label: 'Cơ bản', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  intermediate: { label: 'Trung bình', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  advanced: { label: 'Nâng cao', cls: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

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
    setAnswers((prev) => ({ ...prev, [String(questionId)]: String(optionId) }));
  }

  async function handleSubmit() {
    if (!testData) return;
    const unanswered = testData.questions.filter((q) => !answers[String(q._id)]);
    if (unanswered.length > 0) { toast.error(`Còn ${unanswered.length} câu chưa trả lời`); return; }
    setSubmitting(true);
    try {
      const payload = testData.questions.map((q) => ({
        questionId: String(q._id),
        selectedOption: answers[String(q._id)],
      }));
      const { data } = await api.post(`/student/my-roadmaps/${prId}/skills/${skillId}/test`, { answers: payload });
      setResult(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi khi nộp bài');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-4 max-w-2xl mx-auto">
        <div className="h-32 skeleton rounded-2xl" />
        <div className="h-4 skeleton rounded-full" />
        <div className="h-64 skeleton rounded-2xl" />
        <div className="h-12 skeleton rounded-xl" />
      </div>
    );
  }
  if (!testData) return null;

  const { skill, questions, passingScore } = testData;

  // ══════════════════════════════════════════
  // RESULT SCREEN
  // ══════════════════════════════════════════
  if (result) {
    const passed = result.passed;
    return (
      <div className="animate-fade-in space-y-5 max-w-2xl mx-auto">

        {/* Result Hero */}
        <div className={`relative overflow-hidden rounded-2xl border p-8 text-center ${
          passed
            ? 'bg-gradient-to-br from-emerald-500/12 via-emerald-500/5 to-transparent border-emerald-500/20'
            : 'bg-gradient-to-br from-red-500/12 via-red-500/5 to-transparent border-red-500/20'
        }`}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="relative">
            {/* Trophy / Error icon */}
            <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center shadow-lg ${
              passed ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-red-500 shadow-red-500/30'
            }`}>
              {passed
                ? <Trophy className="w-10 h-10 text-white" />
                : <AlertCircle className="w-10 h-10 text-white" />
              }
            </div>

            <div className={`text-5xl font-bold mb-1 ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
              {result.score}%
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {result.correct}/{result.total} câu đúng
            </p>
            <p className={`text-base font-semibold mt-2 ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
              {result.passed ? '🎉 Xuất sắc! Đã vượt qua bài test!' : '😔 Chưa đạt — hãy ôn luyện thêm'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Yêu cầu tối thiểu: {passingScore}%
            </p>
          </div>
        </div>

        {/* Detail results */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/20">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Chi tiết câu trả lời</h3>
            <span className="ml-auto text-xs text-muted-foreground">{result.total} câu hỏi</span>
          </div>
          <div className="p-4 space-y-3">
            {result.results.map((r, i) => (
              <div key={r.questionId} className={`rounded-xl p-4 border ${
                r.correct
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-red-500/5 border-red-500/20'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    r.correct ? 'bg-emerald-500' : 'bg-red-500'
                  }`}>
                    {r.correct
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      : <XCircle className="w-3.5 h-3.5 text-white" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Câu {i + 1}: {r.question}</p>
                    {!r.correct && r.correctAnswer && (
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <span>Đáp án đúng:</span>
                        <span className="font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {r.correctAnswer}
                        </span>
                      </p>
                    )}
                    {r.explanation && (
                      <p className="text-xs text-muted-foreground mt-1 italic bg-muted/30 rounded-lg px-2.5 py-1.5">
                        💡 {r.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-center pb-2">
          {!result.passed && (
            <Button variant="outline" className="gap-2" onClick={loadTest}>
              <RefreshCcw className="w-4 h-4" /> Thử lại
            </Button>
          )}
          <Button onClick={() => navigate('/student/my-roadmap')} className="gap-2 shadow-md">
            <BookOpen className="w-4 h-4" /> Về lộ trình
          </Button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // QUIZ SCREEN
  // ══════════════════════════════════════════
  const question = questions[currentQ];
  const answeredCount = Object.keys(answers).length;
  const progressPct = ((currentQ + 1) / questions.length) * 100;
  const diffCfg = DIFF_CONFIG[question.difficulty] || { label: question.difficulty, cls: 'bg-muted text-muted-foreground' };

  return (
    <div className="animate-fade-in space-y-5 max-w-2xl mx-auto">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-sky-500/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <button
            onClick={() => navigate('/student/my-roadmap')}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Bài Test</span>
            </div>
            <h1 className="text-lg font-bold truncate flex items-center gap-2">
              {skill.icon && <span>{skill.icon}</span>}
              {skill.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {questions.length} câu hỏi · Cần đạt {passingScore}%
            </p>
          </div>
          {/* Answered counter */}
          <div className="text-right shrink-0">
            <div className="text-xl font-bold text-primary">{answeredCount}<span className="text-sm text-muted-foreground font-normal">/{questions.length}</span></div>
            <p className="text-[10px] text-muted-foreground">đã trả lời</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative mt-4">
          <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Câu {currentQ + 1}</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
        </div>
      </div>

      {/* ── Question Card ── */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        {/* Question header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/20">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Câu {currentQ + 1}/{questions.length}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${diffCfg.cls}`}>
            {diffCfg.label}
          </span>
        </div>

        <div className="p-5 md:p-6">
          {/* Question text */}
          <h3 className="text-base font-semibold leading-relaxed mb-5">{question.question}</h3>

          {/* Options */}
          <div className="space-y-2.5">
            {question.options.map((opt, oi) => {
              const optId = String(opt.optionIndex ?? oi);
              const qId = String(question._id);
              const selected = answers[qId] === optId;
              const letter = OPTION_LETTERS[oi] || String(oi + 1);

              return (
                <button
                  key={optId}
                  onClick={() => selectAnswer(qId, optId)}
                  className={`w-full text-left rounded-xl border-2 transition-all duration-150 ${
                    selected
                      ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                      : 'border-border/50 hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3 p-3.5">
                    {/* Letter badge */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {letter}
                    </div>
                    <span className={`text-sm flex-1 text-left ${selected ? 'font-medium text-foreground' : 'text-foreground/90'}`}>
                      {opt.text}
                    </span>
                    {/* Radio circle */}
                    <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selected ? 'border-primary' : 'border-muted-foreground/30'
                    }`}>
                      {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline" size="sm"
          disabled={currentQ === 0}
          onClick={() => setCurrentQ((p) => p - 1)}
          className="gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" /> Trước
        </Button>

        {/* Dot navigator */}
        <div className="flex items-center gap-1.5">
          {questions.map((q, i) => {
            const isAnswered = !!answers[String(q._id)];
            const isCurrent = i === currentQ;
            return (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                title={`Câu ${i + 1}${isAnswered ? ' ✓' : ''}`}
                className={`rounded-full transition-all duration-200 ${
                  isCurrent
                    ? 'w-6 h-2.5 bg-primary'
                    : isAnswered
                      ? 'w-2.5 h-2.5 bg-primary/50 hover:bg-primary/70'
                      : 'w-2.5 h-2.5 bg-muted hover:bg-muted-foreground/30'
                }`}
              />
            );
          })}
        </div>

        {currentQ < questions.length - 1 ? (
          <Button variant="outline" size="sm" onClick={() => setCurrentQ((p) => p + 1)} className="gap-1.5">
            Tiếp <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={submitting || answeredCount < questions.length}
            className="gap-1.5 shadow-md"
            onClick={handleSubmit}
          >
            {submitting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <ClipboardCheck className="w-4 h-4" />
            }
            Nộp bài
          </Button>
        )}
      </div>

      {/* Unanswered warning */}
      {answeredCount < questions.length && currentQ === questions.length - 1 && (
        <p className="text-center text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-xl py-2.5 px-4">
          ⚠ Bạn còn <strong>{questions.length - answeredCount}</strong> câu chưa trả lời
        </p>
      )}
    </div>
  );
}

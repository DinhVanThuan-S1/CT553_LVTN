/**
 * AI Roadmap Page — Gợi ý lộ trình cá nhân hóa bằng AI
 */
import { useState } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Sparkles, Loader2, Brain, Target, TrendingUp, Clock,
  CheckCircle2, AlertTriangle, ChevronRight, Route, BookOpen,
  Lightbulb, ArrowRight, Zap,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

export default function AIRoadmapPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/ai/suggest-roadmap');
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || 'Không thể tạo gợi ý');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi kết nối tới AI. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Gợi ý Lộ Trình</h1>
            <p className="text-sm text-muted-foreground">Tạo lộ trình học tập cá nhân hóa bằng AI</p>
          </div>
        </div>
      </div>

      {/* CTA Card */}
      {!result && !loading && (
        <div className="rounded-2xl border bg-gradient-to-br from-card to-primary/[0.02] p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center mx-auto">
            <Brain className="w-10 h-10 text-violet-500" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-semibold">Phân tích toàn diện hồ sơ của bạn</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI sẽ phân tích <strong>hồ sơ học tập</strong>, <strong>kỹ năng</strong>, <strong>sở thích nghề nghiệp</strong> và các lộ trình có sẵn để tạo <strong>lộ trình cá nhân hóa</strong> riêng cho bạn.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-lg mx-auto">
            {[
              { icon: BookOpen, label: 'Hồ sơ học tập' },
              { icon: Target, label: 'Kỹ năng' },
              { icon: TrendingUp, label: 'Sở thích nghề' },
              { icon: Route, label: 'Lộ trình mẫu' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            onClick={handleGenerate}
            className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 px-8"
          >
            <Sparkles className="w-5 h-5" />
            Tạo lộ trình AI
          </Button>

          {error && (
            <p className="text-sm text-red-500 flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> {error}
            </p>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border bg-card p-12 text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center">
              <Brain className="w-8 h-8 text-violet-500" />
            </div>
            <div className="absolute -inset-2 rounded-2xl border-2 border-violet-500/20 animate-ping" />
          </div>
          <div>
            <p className="font-semibold">AI đang phân tích hồ sơ...</p>
            <p className="text-sm text-muted-foreground mt-1">Đang thu thập dữ liệu và tạo lộ trình cá nhân hóa</p>
          </div>
          <Loader2 className="w-5 h-5 text-violet-500 animate-spin mx-auto" />
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Warnings */}
          {result.warnings?.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              {result.warnings.map((w, i) => (
                <p key={i} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {w}
                </p>
              ))}
            </div>
          )}

          {/* Analysis */}
          {result.analysis && (
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-500" /> Phân tích hồ sơ
              </h2>
              <p className="text-sm text-muted-foreground">{result.analysis.summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Điểm mạnh
                  </h3>
                  <ul className="space-y-1">
                    {result.analysis.strengths?.map((s, i) => (
                      <li key={i} className="text-sm text-green-700/80 dark:text-green-400/80 flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Weaknesses */}
                <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Cần cải thiện
                  </h3>
                  <ul className="space-y-1">
                    {result.analysis.weaknesses?.map((w, i) => (
                      <li key={i} className="text-sm text-amber-700/80 dark:text-amber-400/80 flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Career Paths */}
          {result.suggestedCareerPaths?.length > 0 && (
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" /> Hướng nghề gợi ý
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.suggestedCareerPaths.map((cp, i) => (
                  <div key={i} className="rounded-lg border p-4 space-y-2 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{cp.title}</h3>
                      <Badge variant={cp.matchScore >= 80 ? 'success' : cp.matchScore >= 60 ? 'default' : 'warning'}>
                        {cp.matchScore}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{cp.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personalized Roadmap */}
          {result.personalizedRoadmap && (
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Route className="w-5 h-5 text-primary" /> Lộ trình cá nhân hóa
                </h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {result.personalizedRoadmap.estimatedMonths} tháng
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold">{result.personalizedRoadmap.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{result.personalizedRoadmap.description}</p>
              </div>

              {/* Adjustments */}
              {result.personalizedRoadmap.adjustments?.length > 0 && (
                <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 space-y-1.5">
                  <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Điều chỉnh cá nhân hóa
                  </h4>
                  {result.personalizedRoadmap.adjustments.map((a, i) => (
                    <p key={i} className="text-xs text-blue-700/80 dark:text-blue-400/80 flex items-start gap-1.5">
                      <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" /> {a}
                    </p>
                  ))}
                </div>
              )}

              {/* Phases */}
              {result.personalizedRoadmap.phases?.map((phase, pi) => (
                <div key={pi} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                        {pi + 1}
                      </span>
                      {phase.name}
                    </h4>
                    <span className="text-xs text-muted-foreground">{phase.duration}</span>
                  </div>
                  <div className="space-y-2">
                    {phase.skills?.map((skill, si) => (
                      <div key={si} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{skill.name}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {skill.level === 'beginner' ? 'Cơ bản' : skill.level === 'intermediate' ? 'Trung bình' : 'Nâng cao'}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{skill.sessions} buổi</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Advice */}
          {result.advice && (
            <div className="rounded-xl border bg-gradient-to-r from-amber-500/5 to-orange-500/5 p-6 space-y-2">
              <h2 className="font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Lightbulb className="w-5 h-5" /> Lời khuyên từ AI
              </h2>
              <p className="text-sm leading-relaxed">{result.advice}</p>
            </div>
          )}

          {/* Regenerate */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleGenerate} className="gap-2">
              <Sparkles className="w-4 h-4" /> Phân tích lại
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

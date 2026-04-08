/**
 * AI Job Suggestion Page — Gợi ý việc làm bằng AI
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Sparkles, Loader2, Briefcase, Target, TrendingUp,
  CheckCircle2, AlertTriangle, ChevronRight, MapPin,
  DollarSign, Clock, Lightbulb, BarChart3,
} from 'lucide-react';

export default function AIJobSuggestionPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/ai/suggest-jobs');
      if (data.success) setResult(data.data);
      else setError(data.message || 'Không thể phân tích');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi kết nối tới AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Gợi ý Việc Làm</h1>
          <p className="text-sm text-muted-foreground">Phân tích kỹ năng và đối chiếu với thị trường tuyển dụng</p>
        </div>
      </div>

      {/* CTA */}
      {!result && !loading && (
        <div className="rounded-2xl border bg-gradient-to-br from-card to-blue-500/[0.02] p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center mx-auto">
            <BarChart3 className="w-10 h-10 text-blue-500" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-semibold">Tìm việc phù hợp với bạn</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI sẽ đối chiếu <strong>kỹ năng</strong> và <strong>sở thích</strong> của bạn với các tin tuyển dụng hiện có, phân tích mức độ phù hợp và gợi ý cách cải thiện.
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleAnalyze}
            className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25 px-8"
          >
            <Sparkles className="w-5 h-5" /> Phân tích ngay
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-blue-500" />
            </div>
            <div className="absolute -inset-2 rounded-2xl border-2 border-blue-500/20 animate-ping" />
          </div>
          <div>
            <p className="font-semibold">AI đang phân tích...</p>
            <p className="text-sm text-muted-foreground mt-1">Đang đối chiếu kỹ năng với tin tuyển dụng</p>
          </div>
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin mx-auto" />
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Matched Jobs */}
          {result.matchedJobs?.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" /> Việc làm phù hợp ({result.matchedJobs.length})
              </h2>
              {result.matchedJobs.map((mj, i) => (
                <div key={i} className="rounded-xl border bg-card p-5 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{mj.job?.title || 'N/A'}</h3>
                      <p className="text-sm text-muted-foreground">{mj.job?.company?.name || 'N/A'}</p>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <div className={`text-2xl font-bold ${mj.matchScore >= 70 ? 'text-green-600' : mj.matchScore >= 50 ? 'text-blue-600' : 'text-amber-600'}`}>
                        {mj.matchScore}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">Phù hợp</div>
                    </div>
                  </div>

                  {/* Job meta */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {mj.job?.locationText && (
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {mj.job.locationText}</span>
                    )}
                    {mj.job?.jobType && (
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {mj.job.jobType}</span>
                    )}
                    {(mj.job?.salaryRange?.min > 0 || mj.job?.salaryRange?.max > 0) && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {mj.job.salaryRange.min}-{mj.job.salaryRange.max} triệu
                      </span>
                    )}
                  </div>

                  {/* Matched skills */}
                  {mj.matchedSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {mj.matchedSkills.map((s, si) => (
                        <Badge key={si} variant="success" className="text-[10px]">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> {s}
                        </Badge>
                      ))}
                      {mj.missingSkills?.map((s, si) => (
                        <Badge key={`m-${si}`} variant="warning" className="text-[10px]">
                          <AlertTriangle className="w-3 h-3 mr-1" /> {s}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Reason & Advice */}
                  <p className="text-sm text-muted-foreground">{mj.reason}</p>
                  {mj.advice && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {mj.advice}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Skill Gaps */}
          {result.skillGaps?.length > 0 && (
            <div className="rounded-xl border bg-card p-6 space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" /> Kỹ năng cần bổ sung
              </h2>
              <div className="space-y-2">
                {result.skillGaps.map((sg, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{sg.skill}</span>
                      <Badge variant={sg.importance === 'high' ? 'danger' : sg.importance === 'medium' ? 'warning' : 'secondary'} className="text-[10px]">
                        {sg.importance === 'high' ? 'Quan trọng' : sg.importance === 'medium' ? 'Trung bình' : 'Bổ sung'}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground max-w-[50%] text-right">{sg.suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall Advice */}
          {result.overallAdvice && (
            <div className="rounded-xl border bg-gradient-to-r from-blue-500/5 to-cyan-500/5 p-6 space-y-2">
              <h2 className="font-semibold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Lightbulb className="w-5 h-5" /> Lời khuyên từ AI
              </h2>
              <p className="text-sm leading-relaxed">{result.overallAdvice}</p>
              {result.marketInsight && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                  📊 {result.marketInsight}
                </p>
              )}
            </div>
          )}

          {/* Regenerate */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleAnalyze} className="gap-2">
              <Sparkles className="w-4 h-4" /> Phân tích lại
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

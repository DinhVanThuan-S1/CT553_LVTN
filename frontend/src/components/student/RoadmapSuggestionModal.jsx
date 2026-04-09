/**
 * RoadmapSuggestionModal
 * Gợi ý lộ trình CÁ NHÂN HÓA bằng AI (Python + OpenRouter)
 * Theo request_ai.md Section 1
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Sparkles, X, ChevronRight, Route, Clock, CheckCircle2,
  AlertCircle, Info, TrendingUp, Loader2, Star, BookOpen,
  Target, Briefcase,
} from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../ui/Toast';

const difficultyLabels = { beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' };

export default function RoadmapSuggestionModal({ isOpen, onClose }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [fromCache, setFromCache] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && !result) fetchAISuggestion();
  }, [isOpen]);

  const fetchAISuggestion = async () => {
    setLoading(true);
    setError('');
    setFromCache(false);
    try {
      const { data } = await api.post('/ai/suggest-roadmap', {}, { timeout: 180000 });
      if (data.success) {
        setResult(data.data);
        setFromCache(!!data.cached);
      } else {
        setError(data.message || 'Không thể phân tích');
      }
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('429') || msg.includes('rate limit') || msg.includes('Rate limit')) {
        setError('AI đang quá tải. Vui lòng thử lại sau vài phút.');
      } else if (msg.includes('timeout') || msg.includes('Timeout')) {
        setError('AI phản hồi quá lâu. Vui lòng thử lại.');
      } else {
        setError(msg || 'Không thể kết nối AI. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const { analysis, suggestedCareerPaths, personalizedRoadmap, advice } = result || {};

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-popover/95 backdrop-blur-xl rounded-2xl border shadow-2xl shadow-black/20 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 flex-shrink-0 bg-gradient-to-r from-primary/5 to-teal-500/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold">AI Gợi ý Lộ trình</h2>
              <p className="text-xs text-muted-foreground">Phân tích cá nhân hóa bằng AI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-teal-500/10 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div className="absolute -inset-1 rounded-2xl border-2 border-primary/20 animate-ping" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">AI đang phân tích hồ sơ...</p>
                <p className="text-xs text-muted-foreground mt-1">Thu thập dữ liệu học tập, kỹ năng, sở thích nghề nghiệp</p>
                <p className="text-xs text-muted-foreground mt-0.5">Quá trình này mất khoảng 15-30 giây</p>
              </div>
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <AlertCircle className="w-12 h-12 text-destructive/50" />
              <p className="font-medium text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchAISuggestion} className="gap-1.5 mt-2">
                <Sparkles className="w-3.5 h-3.5" /> Thử lại
              </Button>
            </div>
          ) : result ? (
            <div className="p-5 space-y-5">

              {/* Phân tích tổng quan */}
              {analysis && (
                <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" /> Phân tích hồ sơ
                  </h3>
                  <p className="text-xs text-muted-foreground">{analysis.summary}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {analysis.strengths?.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-medium text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Điểm mạnh
                        </p>
                        {analysis.strengths.map((s, i) => (
                          <p key={i} className="text-xs text-green-700 dark:text-green-400 pl-4">• {s}</p>
                        ))}
                      </div>
                    )}
                    {analysis.weaknesses?.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                          <Info className="w-3 h-3" /> Cần cải thiện
                        </p>
                        {analysis.weaknesses.map((w, i) => (
                          <p key={i} className="text-xs text-amber-700 dark:text-amber-400 pl-4">• {w}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hướng nghề gợi ý */}
              {suggestedCareerPaths?.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" /> Hướng nghề phù hợp
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestedCareerPaths.map((cp, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
                        <div className="text-center flex-shrink-0">
                          <div className={cn(
                            'text-lg font-bold',
                            cp.matchScore >= 80 ? 'text-green-600' :
                            cp.matchScore >= 60 ? 'text-primary' : 'text-amber-600'
                          )}>
                            {cp.matchScore}%
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{cp.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{cp.reason}</p>
                        </div>
                        {i === 0 && (
                          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                            ⭐ Tốt nhất
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lộ trình cá nhân hóa */}
              {personalizedRoadmap && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Route className="w-4 h-4 text-primary" /> Lộ trình cá nhân hóa
                  </h3>
                  <div className="rounded-xl border bg-gradient-to-br from-primary/[0.02] to-teal-500/[0.02] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-sm">{personalizedRoadmap.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{personalizedRoadmap.description}</p>
                      </div>
                      <Badge variant="default" className="flex-shrink-0 text-[10px]">
                        <Clock className="w-3 h-3 mr-1" /> {personalizedRoadmap.estimatedMonths} tháng
                      </Badge>
                    </div>

                    {/* Phases */}
                    {personalizedRoadmap.phases?.map((phase, pi) => (
                      <div key={pi} className="rounded-lg bg-muted/40 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold">
                              {pi + 1}
                            </span>
                            {phase.name}
                          </p>
                          <span className="text-[10px] text-muted-foreground">{phase.duration}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {phase.skills?.map((skill, si) => (
                            <span key={si} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-background border">
                              {skill.name}
                              <span className="text-muted-foreground">({skill.sessions || '?'} buổi)</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Adjustments */}
                    {personalizedRoadmap.adjustments?.length > 0 && (
                      <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 space-y-1.5">
                        <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Điều chỉnh cá nhân hóa
                        </p>
                        {personalizedRoadmap.adjustments.map((adj, ai) => (
                          <p key={ai} className="text-xs text-amber-700/80 dark:text-amber-400/80 pl-4">• {adj}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lời khuyên */}
              {advice && (
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-1.5">
                    <Star className="w-3.5 h-3.5" /> Lời khuyên từ AI
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{advice}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/30 flex-shrink-0 flex items-center justify-between bg-muted/30">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Phân tích bởi AI dựa trên hồ sơ cá nhân
          </p>
          <Button variant="ghost" size="sm" onClick={fetchAISuggestion} className="h-7 text-xs gap-1.5" disabled={loading}>
            <Sparkles className="w-3 h-3" /> Phân tích lại
          </Button>
        </div>
      </div>
    </div>
  );
}

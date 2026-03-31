/**
 * RoadmapSuggestionModal
 * Modal AI gợi ý lộ trình:
 * - Hiển thị top 5 lộ trình phù hợp nhất
 * - Match % với breakdown chi tiết
 * - Nút đăng ký / xem chi tiết
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Sparkles, X, ChevronRight, Route, Clock, CheckCircle2,
  AlertCircle, Info, TrendingUp, Loader2, Lock,
} from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../ui/Toast';

// Score → màu
function getScoreColor(score) {
  if (score >= 80) return { bar: 'bg-green-500', text: 'text-green-600', badge: 'success' };
  if (score >= 60) return { bar: 'bg-primary', text: 'text-primary', badge: 'default' };
  if (score >= 40) return { bar: 'bg-amber-500', text: 'text-amber-600', badge: 'warning' };
  return { bar: 'bg-muted-foreground', text: 'text-muted-foreground', badge: 'secondary' };
}

// Score label
function getScoreLabel(score) {
  if (score >= 80) return 'Rất phù hợp';
  if (score >= 60) return 'Phù hợp';
  if (score >= 40) return 'Khá phù hợp';
  return 'Ít phù hợp';
}

const difficultyLabels = { beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' };
const difficultyColors = { beginner: 'success', intermediate: 'warning', advanced: 'danger' };

export default function RoadmapSuggestionModal({ isOpen, onClose }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enrollingId, setEnrollingId] = useState(null);
  const [enrollData, setEnrollData] = useState({ roadmapId: null, step: null }); // null | 'duration' | 'schedule'
  const [durationMonths, setDurationMonths] = useState(6);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (isOpen) fetchSuggestions();
  }, [isOpen]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/student/roadmap-suggestions');
      if (data.success) setSuggestions(data.data);
    } catch {
      toast.error('Không thể tải gợi ý lộ trình');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (roadmapId) => {
    setEnrollingId(roadmapId);
    try {
      await api.post('/student/my-roadmaps/enroll', {
        roadmapId,
        durationMonths,
        freeTimeSlots: [],
        schoolSchedule: [],
      });
      toast.success('Đã đăng ký lộ trình thành công!');
      onClose();
      navigate('/student/my-roadmap');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setEnrollingId(null);
    }
  };

  if (!isOpen) return null;

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
              <p className="text-xs text-muted-foreground">Phân tích hồ sơ học tập & sở thích nghề nghiệp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-teal-500/10 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div className="absolute -inset-1 rounded-2xl border-2 border-primary/20 animate-ping" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">Đang phân tích hồ sơ...</p>
                <p className="text-xs text-muted-foreground mt-1">Hệ thống đang so khớp với các lộ trình phù hợp</p>
              </div>
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Route className="w-12 h-12 text-muted-foreground/30" />
              <p className="font-medium">Chưa có lộ trình để gợi ý</p>
              <p className="text-sm text-muted-foreground">Hãy cập nhật hồ sơ học tập và sở thích nghề nghiệp</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {suggestions.map((item, index) => {
                const { roadmap, matchScore, matchDetails, strengths, gaps, isEnrolled } = item;
                const colors = getScoreColor(matchScore);
                const isEnrollingThis = enrollingId === roadmap._id;

                return (
                  <div
                    key={roadmap._id}
                    className={cn(
                      'rounded-xl border p-4 transition-all duration-200',
                      index === 0
                        ? 'border-primary/30 bg-primary/[0.03] shadow-sm'
                        : 'border-border/50 hover:border-border hover:shadow-sm',
                      isEnrolled && 'opacity-70'
                    )}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {index === 0 && (
                            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              ⭐ Tốt nhất
                            </span>
                          )}
                          <Badge variant={difficultyColors[roadmap.difficulty]} className="text-[10px]">
                            {difficultyLabels[roadmap.difficulty]}
                          </Badge>
                          {isEnrolled && (
                            <span className="text-[10px] font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Đã đăng ký
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm">{roadmap.title}</h3>
                        <p className="text-xs text-muted-foreground">{roadmap.careerPath}</p>
                      </div>

                      {/* Match score */}
                      <div className="flex-shrink-0 text-center">
                        <div className={cn('text-2xl font-bold', colors.text)}>{matchScore}%</div>
                        <div className="text-[10px] text-muted-foreground">{getScoreLabel(matchScore)}</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', colors.bar)}
                        style={{ width: `${matchScore}%` }}
                      />
                    </div>

                    {/* Score breakdown */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { label: 'Hướng nghề', score: matchDetails?.careerPath || 0, max: 40 },
                        { label: 'Năng lực', score: matchDetails?.academic || 0, max: 30 },
                        { label: 'Kỹ năng', score: matchDetails?.skillCoverage || 0, max: 20 },
                        { label: 'Thời gian', score: matchDetails?.duration || 0, max: 10 },
                      ].map(({ label, score, max }) => (
                        <div key={label} className="text-center">
                          <div className="text-[10px] text-muted-foreground">{label}</div>
                          <div className="text-xs font-semibold">{score}/{max}</div>
                          <div className="h-1 rounded-full bg-muted mt-0.5 overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', getScoreColor(Math.round(score / max * 100)).bar)}
                              style={{ width: `${(score / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {roadmap.estimatedMonths} tháng
                      </span>
                      <span className="flex items-center gap-1">
                        <Route className="w-3.5 h-3.5" /> {roadmap.skills?.length || 0} kỹ năng
                      </span>
                    </div>

                    {/* Strengths & Gaps */}
                    {(strengths.length > 0 || gaps.length > 0) && (
                      <div className="rounded-lg bg-muted/40 p-2.5 mb-3 space-y-1.5">
                        {strengths.slice(0, 2).map((s, i) => (
                          <p key={i} className="text-xs text-green-700 dark:text-green-400 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            {s}
                          </p>
                        ))}
                        {gaps.slice(0, 1).map((g, i) => (
                          <p key={i} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            {g}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => { navigate(`/student/roadmaps/${roadmap._id}`); onClose(); }}
                      >
                        Xem chi tiết <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                      {!isEnrolled ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1.5"
                          onClick={() => handleEnroll(roadmap._id)}
                          disabled={isEnrollingThis}
                        >
                          {isEnrollingThis ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Đang đăng ký...</>
                          ) : (
                            <><TrendingUp className="w-3 h-3" /> Đăng ký ngay</>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 text-xs gap-1.5 text-green-600"
                          onClick={() => { navigate('/student/my-roadmap'); onClose(); }}
                        >
                          <CheckCircle2 className="w-3 h-3" /> Xem lộ trình của tôi
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/30 flex-shrink-0 flex items-center justify-between bg-muted/30">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Gợi ý dựa trên hồ sơ học tập & sở thích nghề nghiệp
          </p>
          <Button variant="ghost" size="sm" onClick={fetchSuggestions} className="h-7 text-xs gap-1.5">
            <Sparkles className="w-3 h-3" /> Phân tích lại
          </Button>
        </div>
      </div>
    </div>
  );
}

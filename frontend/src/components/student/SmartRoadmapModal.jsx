/**
 * SmartRoadmapModal — Gợi ý lộ trình bằng thuật toán (không AI)
 * Scoring: career, skills, academic, market, duration
 * Click "Xem chi tiết" → hiện phần trăm theo từng tiêu chí
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Compass, X, ChevronRight, Route, Clock, CheckCircle2,
  AlertTriangle, Loader2, TrendingUp, Users, Zap, BarChart3,
  BookOpen, Target, ChevronDown, ChevronUp, MapPin,
} from 'lucide-react';
import api from '../../lib/api';

const difficultyLabels = { beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' };
const difficultyColors = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

function ScoreBar({ label, value, max, icon: Icon }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground flex items-center gap-1">
          <Icon className="w-3 h-3" /> {label}
        </span>
        <span className={cn(
          'font-semibold',
          pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-blue-600' : 'text-amber-600'
        )}>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-blue-500' : 'bg-amber-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SmartRoadmapModal({ isOpen, onClose }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && suggestions.length === 0) fetchSuggestions();
  }, [isOpen]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/student/roadmap-suggestions');
      if (data.success) {
        setSuggestions(data.data || []);
      } else {
        setError(data.message || 'Không thể phân tích');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-popover/95 backdrop-blur-xl rounded-2xl border shadow-2xl shadow-black/20 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 flex-shrink-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Gợi ý lộ trình</h2>
              <p className="text-xs text-muted-foreground">Phân tích tự động dựa trên hồ sơ, kỹ năng & thị trường</p>
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
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center">
                  <Compass className="w-7 h-7 text-blue-500" />
                </div>
                <div className="absolute -inset-1 rounded-2xl border-2 border-blue-500/20 animate-ping" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">Đang phân tích hồ sơ...</p>
                <p className="text-xs text-muted-foreground mt-1">Kết hợp dữ liệu học tập, kỹ năng, thị trường việc làm</p>
              </div>
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <AlertTriangle className="w-12 h-12 text-destructive/50" />
              <p className="font-medium text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchSuggestions} className="gap-1.5 mt-2">
                <Compass className="w-3.5 h-3.5" /> Thử lại
              </Button>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="p-5 space-y-4">
              {suggestions.map((item, idx) => {
                const { roadmap: rm, matchScore, matchDetails, strengths, gaps, isEnrolled } = item;
                const isExpanded = expandedId === rm._id;
                return (
                  <div
                    key={rm._id}
                    className={cn(
                      'rounded-xl border p-4 space-y-3 transition-all',
                      idx === 0 && 'ring-2 ring-blue-500/20 border-blue-300 dark:border-blue-700'
                    )}
                  >
                    {/* Top */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {idx === 0 && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                              Phù hợp nhất
                            </span>
                          )}
                          <Badge className={cn('text-[10px]', difficultyColors[rm.difficulty])}>
                            {difficultyLabels[rm.difficulty]}
                          </Badge>
                          {isEnrolled && (
                            <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                              Đã đăng ký
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-sm">{rm.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{rm.careerPath}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={cn(
                          'text-xl font-bold',
                          matchScore >= 70 ? 'text-green-600' :
                          matchScore >= 45 ? 'text-blue-600' : 'text-amber-600'
                        )}>
                          {matchScore}%
                        </div>
                        <p className="text-[10px] text-muted-foreground">Phù hợp</p>
                      </div>
                    </div>

                    {/* Strengths & Gaps */}
                    <div className="grid grid-cols-2 gap-3">
                      {strengths?.length > 0 && (
                        <div className="space-y-1">
                          {strengths.slice(0, 2).map((s, i) => (
                            <p key={i} className="text-[11px] text-green-600 dark:text-green-400 flex items-start gap-1">
                              <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" /> {s}
                            </p>
                          ))}
                        </div>
                      )}
                      {gaps?.length > 0 && (
                        <div className="space-y-1">
                          {gaps.slice(0, 2).map((g, i) => (
                            <p key={i} className="text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-1">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {g}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Chi tiết điểm — expandable */}
                    {isExpanded && matchDetails && (
                      <div className="rounded-lg bg-muted/40 p-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <p className="text-[11px] font-semibold text-muted-foreground mb-2">Chi tiết phân tích</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <ScoreBar label="Nghề nghiệp" value={matchDetails.careerPath || 0} max={30} icon={Target} />
                          <ScoreBar label="Kỹ năng" value={matchDetails.skillMatch || 0} max={25} icon={Zap} />
                          <ScoreBar label="Học tập" value={matchDetails.academic || 0} max={20} icon={BookOpen} />
                          <ScoreBar label="Thị trường" value={matchDetails.marketFit || 0} max={15} icon={BarChart3} />
                          <ScoreBar label="Thời lượng" value={matchDetails.duration || 0} max={10} icon={Clock} />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => { onClose(); navigate(`/student/roadmaps/${rm._id}`, { state: { from: 'smart-suggestion' } }); }}
                      >
                        Xem lộ trình <ChevronRight className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 text-muted-foreground"
                        onClick={() => setExpandedId(isExpanded ? null : rm._id)}
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                      </Button>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground ml-auto">
                        <Clock className="w-3 h-3" /> {rm.estimatedMonths} tháng
                        <span className="mx-0.5">•</span>
                        <Users className="w-3 h-3" /> {rm.enrolledCount || 0}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <Route className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu để phân tích</p>
              <p className="text-xs text-muted-foreground">Hãy cập nhật hồ sơ học tập và sở thích nghề nghiệp</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/30 flex-shrink-0 flex items-center justify-between bg-muted/30">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <Compass className="w-3 h-3" />
            Phân tích tự động dựa trên dữ liệu hồ sơ & thị trường
          </p>
          <Button variant="ghost" size="sm" onClick={() => { setSuggestions([]); fetchSuggestions(); }} className="h-7 text-xs gap-1.5" disabled={loading}>
            <TrendingUp className="w-3 h-3" /> Phân tích lại
          </Button>
        </div>
      </div>
    </div>
  );
}

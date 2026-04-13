/**
 * SmartJobModal — Gợi ý việc làm bằng thuật toán (không AI)
 * Scoring: career, skills, jobType, salary, location, academic
 * Click "Xem chi tiết" → hiện phần trăm theo từng tiêu chí
 */
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Compass, X, Briefcase, MapPin, DollarSign, Clock,
  CheckCircle2, AlertTriangle, Loader2, Building2, Send,
  Target, Zap, BookOpen, BarChart3, TrendingUp,
  ChevronDown, ChevronUp, Users,
} from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../ui/Toast';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../ui/Dialog';
import { FileText } from 'lucide-react';

const jobTypeLabels = {
  'full-time': 'Toàn thời gian', 'part-time': 'Bán thời gian',
  'internship': 'Thực tập', 'freelance': 'Freelance', 'remote': 'Remote',
};

function formatSalary(range) {
  if (!range || (!range.min && !range.max)) return 'Thỏa thuận';
  if (range.isNegotiable) return 'Thương lượng';
  return `${range.min}–${range.max} triệu`;
}

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

export default function SmartJobModal({ isOpen, onClose }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showApply, setShowApply] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [cvs, setCvs] = useState([]);
  const [selectedCvId, setSelectedCvId] = useState('');
  const [applying, setApplying] = useState(false);
  const [hasData, setHasData] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && suggestions.length === 0) fetchSuggestions();
  }, [isOpen]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/student/job-suggestions');
      if (data.success) {
        setSuggestions(data.data || []);
        setHasData(data.hasData !== false);
      } else {
        setError(data.message || 'Không thể phân tích');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = async (job) => {
    setSelectedJob(job);
    try {
      const { data } = await api.get('/student/cvs');
      setCvs(data.data || []);
      const def = (data.data || []).find(c => c.isDefault);
      setSelectedCvId(def?._id || '');
    } catch { /* silent */ }
    setShowApply(true);
  };

  const submitApplication = async () => {
    if (!selectedCvId) return;
    setApplying(true);
    try {
      await api.post('/student/applications', { jobPostingId: selectedJob._id, cvId: selectedCvId });
      toast.success('Đã gửi đơn ứng tuyển thành công!');
      setShowApply(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi gửi đơn. Thử lại.');
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-popover/95 backdrop-blur-xl rounded-2xl border shadow-2xl shadow-black/20 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 flex-shrink-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Gợi ý việc làm</h2>
                <p className="text-xs text-muted-foreground">Phân tích kỹ năng & đối chiếu yêu cầu tuyển dụng</p>
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
                  <p className="font-medium text-sm">Đang đối chiếu hồ sơ...</p>
                  <p className="text-xs text-muted-foreground mt-1">Phân tích kỹ năng, sở thích, yêu cầu tuyển dụng</p>
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
              <div className="p-5 space-y-3">
                {!hasData && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-medium text-amber-700 dark:text-amber-400">Hồ sơ chưa có dữ liệu</p>
                      <p className="text-amber-600/80 dark:text-amber-300/70">
                        Cập nhật Sở thích nghề nghiệp, Kỹ năng, Hồ sơ học tập để nhận gợi ý chính xác hơn.
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  Công việc phù hợp ({suggestions.length})
                </p>

                {suggestions.map((item, idx) => {
                  const { job, matchScore, matchDetails, strengths, gaps } = item;
                  const isExpanded = expandedId === job._id;
                  return (
                    <div
                      key={job._id}
                      className={cn(
                        'rounded-xl border p-4 space-y-3 transition-all',
                        idx === 0 && 'ring-2 ring-blue-500/20 border-blue-300 dark:border-blue-700'
                      )}
                    >
                      {/* Top */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            {job.company?.logo ? (
                              <img src={job.company.logo} className="w-8 h-8 rounded object-cover" alt="" />
                            ) : (
                              <Building2 className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              {idx === 0 && (
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                                  Tốt nhất
                                </span>
                              )}
                              <Badge variant="secondary" className="text-[10px]">
                                {jobTypeLabels[job.jobType] || job.jobType}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-sm">{job.title}</h4>
                            <p className="text-xs text-muted-foreground">{job.company?.name}</p>
                          </div>
                        </div>
                        <div className={cn(
                          'text-right flex-shrink-0',
                        )}>
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

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> {formatSalary(job.salaryRange)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {job.locationText || 'Chưa rõ'}
                        </span>
                      </div>

                      {/* Strengths & Gaps */}
                      {(strengths?.length > 0 || gaps?.length > 0) && (
                        <div className="space-y-1">
                          {strengths?.slice(0, 2).map((s, i) => (
                            <p key={i} className="text-[11px] text-green-600 dark:text-green-400 flex items-start gap-1">
                              <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" /> {s}
                            </p>
                          ))}
                          {gaps?.slice(0, 2).map((g, i) => (
                            <p key={i} className="text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-1">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {g}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Chi tiết điểm — expandable */}
                      {isExpanded && matchDetails && (
                        <div className="rounded-lg bg-muted/40 p-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                          <p className="text-[11px] font-semibold text-muted-foreground mb-2">Chi tiết phân tích</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <ScoreBar label="Nghề nghiệp" value={matchDetails.careerPath || 0} max={30} icon={Target} />
                            <ScoreBar label="Kỹ năng" value={matchDetails.skillMatch || 0} max={25} icon={Zap} />
                            <ScoreBar label="Loại hình" value={matchDetails.jobType || 0} max={15} icon={Briefcase} />
                            <ScoreBar label="Mức lương" value={matchDetails.salary || 0} max={10} icon={DollarSign} />
                            <ScoreBar label="Khu vực" value={matchDetails.location || 0} max={10} icon={MapPin} />
                            <ScoreBar label="Học vấn" value={matchDetails.academic || 0} max={10} icon={BookOpen} />
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                          onClick={() => handleApplyClick(job)}
                        >
                          <Send className="w-3 h-3" /> Ứng tuyển ngay
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 text-muted-foreground"
                          onClick={() => setExpandedId(isExpanded ? null : job._id)}
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                <Briefcase className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
                <p className="text-xs text-muted-foreground">Hãy cập nhật hồ sơ & sở thích nghề nghiệp</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border/30 flex-shrink-0 flex items-center justify-between bg-muted/30">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Compass className="w-3 h-3" />
              Phân tích tự động dựa trên kỹ năng & sở thích
            </p>
            <Button variant="ghost" size="sm" onClick={() => { setSuggestions([]); fetchSuggestions(); }} className="h-7 text-xs gap-1.5" disabled={loading}>
              <TrendingUp className="w-3 h-3" /> Phân tích lại
            </Button>
          </div>
        </div>
      </div>

      {/* Apply Dialog */}
      {showApply && selectedJob && (
        <Dialog open={showApply} onClose={() => setShowApply(false)} zIndex={70}>
          <DialogHeader>
            <h3 className="font-semibold">Ứng tuyển {selectedJob.title}</h3>
            <p className="text-xs text-muted-foreground">{selectedJob.company?.name}</p>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-3">
              <p className="text-sm">Chọn CV để gửi:</p>
              {cvs.length === 0 ? (
                <p className="text-xs text-muted-foreground">Bạn chưa có CV. Hãy tạo CV trước.</p>
              ) : (
                <div className="space-y-2">
                  {cvs.map(cv => (
                    <label
                      key={cv._id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                        selectedCvId === cv._id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'hover:border-muted-foreground/30'
                      )}
                    >
                      <input
                        type="radio"
                        name="cv"
                        value={cv._id}
                        checked={selectedCvId === cv._id}
                        onChange={() => setSelectedCvId(cv._id)}
                        className="accent-blue-500"
                      />
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cv.title}</p>
                        {cv.isDefault && <span className="text-[10px] text-blue-600">CV mặc định</span>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApply(false)}>Hủy</Button>
            <Button
              onClick={submitApplication}
              disabled={!selectedCvId || applying}
              className="gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-500"
            >
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Gửi đơn
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </>
  );
}

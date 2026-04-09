/**
 * JobSuggestionModal
 * Gợi ý việc làm bằng AI (Python + OpenRouter)
 * Theo request_ai.md Section 2
 */
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Sparkles, X, Briefcase, MapPin, DollarSign, Clock,
  CheckCircle2, Info, TrendingUp, Loader2, Building2, Send,
  AlertCircle, Star, Target,
} from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../ui/Toast';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../ui/Dialog';
import { FileText } from 'lucide-react';

const jobTypeLabels = {
  'full-time': 'Toàn thời gian', 'part-time': 'Bán thời gian',
  'internship': 'Thực tập', 'freelance': 'Freelance', 'remote': 'Remote',
};
const jobTypeColors = {
  'full-time': 'default', 'part-time': 'secondary',
  'internship': 'success', 'freelance': 'warning', 'remote': 'danger',
};

function formatSalary(range) {
  if (!range || (!range.min && !range.max)) return 'Thỏa thuận';
  if (range.isNegotiable) return 'Thương lượng';
  return `${range.min}–${range.max} triệu`;
}

export default function JobSuggestionModal({ isOpen, onClose }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showApply, setShowApply] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [cvs, setCvs] = useState([]);
  const [selectedCvId, setSelectedCvId] = useState('');
  const [applying, setApplying] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && !result) fetchAISuggestion();
  }, [isOpen]);

  const fetchAISuggestion = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/ai/suggest-jobs', {}, { timeout: 180000 });
      if (data.success) {
        setResult(data.data);
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

  const openApplyDialog = async (job) => {
    setSelectedJob(job);
    setShowApply(true);
    try {
      const { data } = await api.get('/student/cvs');
      setCvs(data.data || []);
      const def = (data.data || []).find(c => c.isDefault);
      setSelectedCvId(def?._id || data.data?.[0]?._id || '');
    } catch {
      toast.error('Không thể tải CV');
    }
  };

  const handleApply = async () => {
    if (!selectedCvId) { toast.error('Vui lòng chọn CV'); return; }
    setApplying(true);
    try {
      await api.post('/student/applications', {
        jobPostingId: selectedJob._id,
        cvId: selectedCvId,
      });
      toast.success('Ứng tuyển thành công!');
      setShowApply(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi khi ứng tuyển');
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  const { matchedJobs, skillGaps, overallAdvice, marketInsight } = result || {};

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-popover/95 backdrop-blur-xl rounded-2xl border shadow-2xl shadow-black/20 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 flex-shrink-0 bg-gradient-to-r from-primary/5 to-teal-500/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold">AI Gợi ý Việc làm</h2>
                <p className="text-xs text-muted-foreground">Phân tích kỹ năng & đối chiếu công việc</p>
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
                    <Briefcase className="w-7 h-7 text-primary" />
                  </div>
                  <div className="absolute -inset-1 rounded-2xl border-2 border-primary/20 animate-ping" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">AI đang phân tích việc làm...</p>
                  <p className="text-xs text-muted-foreground mt-1">Đối chiếu kỹ năng với {result?.jobs?.length || 'hàng chục'} công việc</p>
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

                {/* Matched Jobs */}
                {matchedJobs?.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      Công việc phù hợp ({matchedJobs.length})
                    </h3>
                    <div className="space-y-2.5">
                      {matchedJobs.map((item, index) => {
                        const job = item.job || {};
                        const matchScore = item.matchScore || item.matchPercent || 0;

                        return (
                          <div
                            key={item.jobId || index}
                            className={cn(
                              'rounded-xl border p-4 transition-all duration-200',
                              index === 0
                                ? 'border-primary/30 bg-primary/[0.03] shadow-sm'
                                : 'border-border/50 hover:border-border hover:shadow-sm'
                            )}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                  <Building2 className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    {index === 0 && (
                                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        ⭐ Tốt nhất
                                      </span>
                                    )}
                                    <Badge variant={jobTypeColors[job.jobType] || 'secondary'} className="text-[10px]">
                                      {jobTypeLabels[job.jobType] || job.jobType || 'N/A'}
                                    </Badge>
                                  </div>
                                  <h4 className="font-semibold text-sm line-clamp-1">{job.title || item.title || 'N/A'}</h4>
                                  <p className="text-xs text-muted-foreground">{job.company?.name || item.companyName || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="flex-shrink-0 text-center">
                                <div className={cn(
                                  'text-xl font-bold',
                                  matchScore >= 80 ? 'text-green-600' :
                                  matchScore >= 60 ? 'text-primary' : 'text-amber-600'
                                )}>
                                  {matchScore}%
                                </div>
                                <div className="text-[10px] text-muted-foreground">Phù hợp</div>
                              </div>
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5" />{formatSalary(job.salaryRange)}
                              </span>
                              {(job.locationText || item.location) && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />{job.locationText || item.location}
                                </span>
                              )}
                            </div>

                            {/* AI Reason */}
                            {item.reason && (
                              <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 mb-2">
                                💡 {item.reason}
                              </p>
                            )}

                            {/* Missing skills */}
                            {item.missingSkills?.length > 0 && (
                              <div className="flex items-center gap-1.5 mb-2">
                                <Info className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                  Cần bổ sung: {item.missingSkills.join(', ')}
                                </p>
                              </div>
                            )}

                            {/* Action */}
                            {job._id && (
                              <Button size="sm" className="h-7 text-xs gap-1.5" onClick={() => openApplyDialog(job)}>
                                <Send className="w-3 h-3" /> Ứng tuyển ngay
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Skill Gaps */}
                {skillGaps?.length > 0 && (
                  <div className="rounded-xl border bg-amber-500/5 p-4 space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-600" /> Kỹ năng cần bổ sung
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {skillGaps.map((skill, i) => (
                        <span key={i} className="text-[11px] px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          {typeof skill === 'string' ? skill : skill.name || skill.skillName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Market Insight */}
                {marketInsight && (
                  <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-4">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Xu hướng thị trường
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{marketInsight}</p>
                  </div>
                )}

                {/* Overall Advice */}
                {overallAdvice && (
                  <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                    <p className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-1.5">
                      <Star className="w-3.5 h-3.5" /> Lời khuyên từ AI
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{overallAdvice}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border/30 flex-shrink-0 flex items-center justify-between bg-muted/30">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Phân tích bởi AI dựa trên kỹ năng & sở thích
            </p>
            <Button variant="ghost" size="sm" onClick={fetchAISuggestion} className="h-7 text-xs gap-1.5" disabled={loading}>
              <Sparkles className="w-3 h-3" /> Phân tích lại
            </Button>
          </div>
        </div>
      </div>

      {/* Apply Dialog */}
      <Dialog open={showApply} onClose={() => setShowApply(false)} className="max-w-md" style={{ zIndex: 70 }}>
        <DialogHeader onClose={() => setShowApply(false)}>
          Ứng tuyển: {selectedJob?.title}
        </DialogHeader>
        <DialogBody className="space-y-4">
          {cvs.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Bạn chưa có CV nào</p>
              <p className="text-xs text-muted-foreground">Truy cập mục <strong>CV</strong> để tạo CV trước khi ứng tuyển</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Chọn CV để gửi kèm:</p>
              <div className="space-y-2">
                {cvs.map((cv) => (
                  <label key={cv._id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedCvId === cv._id
                        ? 'border-primary bg-primary/[0.03]'
                        : 'border-transparent bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <input type="radio" name="cv-apply" value={cv._id}
                      checked={selectedCvId === cv._id}
                      onChange={() => setSelectedCvId(cv._id)}
                      className="accent-primary" />
                    <div>
                      <p className="text-sm font-medium">{cv.title}</p>
                      <p className="text-xs text-muted-foreground">{(cv.skills || []).length} kỹ năng</p>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setShowApply(false)}>Hủy</Button>
          {cvs.length > 0 && (
            <Button size="sm" disabled={applying || !selectedCvId} onClick={handleApply} className="gap-1.5">
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {applying ? 'Đang gửi...' : 'Gửi đơn ứng tuyển'}
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    </>
  );
}

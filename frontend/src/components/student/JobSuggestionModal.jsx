/**
 * JobSuggestionModal
 * AI gợi ý việc làm phù hợp với hồ sơ sinh viên
 */
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Sparkles, X, Briefcase, MapPin, DollarSign, Clock,
  CheckCircle2, Info, TrendingUp, Loader2, Building2, Send,
  AlertCircle, ChevronRight,
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

function getScoreColor(score) {
  if (score >= 80) return { bar: 'bg-green-500', text: 'text-green-600' };
  if (score >= 60) return { bar: 'bg-primary', text: 'text-primary' };
  if (score >= 40) return { bar: 'bg-amber-500', text: 'text-amber-600' };
  return { bar: 'bg-muted-foreground', text: 'text-muted-foreground' };
}

function getScoreLabel(score) {
  if (score >= 80) return 'Rất phù hợp';
  if (score >= 60) return 'Phù hợp';
  if (score >= 40) return 'Khá phù hợp';
  return 'Ít phù hợp';
}

function formatSalary(range) {
  if (!range || (!range.min && !range.max)) return 'Thỏa thuận';
  if (range.isNegotiable) return 'Thương lượng';
  return `${range.min}–${range.max} triệu`;
}

export default function JobSuggestionModal({ isOpen, onClose }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApply, setShowApply] = useState(false);
  const [cvs, setCvs] = useState([]);
  const [selectedCvId, setSelectedCvId] = useState('');
  const [applying, setApplying] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) fetchSuggestions();
  }, [isOpen]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/student/job-suggestions');
      if (data.success) setSuggestions(data.data);
    } catch {
      toast.error('Không thể tải gợi ý việc làm');
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
                <p className="text-xs text-muted-foreground">Phân tích hồ sơ, kỹ năng & sở thích nghề nghiệp</p>
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
                    <Briefcase className="w-7 h-7 text-primary" />
                  </div>
                  <div className="absolute -inset-1 rounded-2xl border-2 border-primary/20 animate-ping" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">Đang tìm kiếm cơ hội...</p>
                  <p className="text-xs text-muted-foreground mt-1">Hệ thống đang so khớp với hàng chục công việc</p>
                </div>
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground/30" />
                <p className="font-medium">Không tìm thấy công việc phù hợp</p>
                <p className="text-sm text-muted-foreground">Hãy cập nhật sở thích nghề nghiệp và hoàn thành lộ trình học</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {suggestions.map((item, index) => {
                  const { job, matchScore, matchDetails, strengths, gaps } = item;
                  const colors = getScoreColor(matchScore);

                  return (
                    <div
                      key={job._id}
                      className={cn(
                        'rounded-xl border p-4 transition-all duration-200',
                        index === 0
                          ? 'border-primary/30 bg-primary/[0.03] shadow-sm'
                          : 'border-border/50 hover:border-border hover:shadow-sm'
                      )}
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
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
                                {jobTypeLabels[job.jobType]}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-sm line-clamp-1">{job.title}</h3>
                            <p className="text-xs text-muted-foreground">{job.company?.name}</p>
                          </div>
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
                      <div className="grid grid-cols-5 gap-1.5 mb-3">
                        {[
                          { label: 'Hướng nghề', score: matchDetails?.careerPath || 0, max: 35 },
                          { label: 'Kỹ năng', score: matchDetails?.skillMatch || 0, max: 30 },
                          { label: 'Loại hình', score: matchDetails?.jobType || 0, max: 15 },
                          { label: 'Lương', score: matchDetails?.salary || 0, max: 10 },
                          { label: 'Địa điểm', score: matchDetails?.location || 0, max: 10 },
                        ].map(({ label, score, max }) => (
                          <div key={label} className="text-center">
                            <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
                            <div className="text-[11px] font-semibold">{score}/{max}</div>
                            <div className="h-1 rounded-full bg-muted mt-0.5 overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', getScoreColor(Math.round(score / max * 100)).bar)}
                                style={{ width: `${(score / max) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />{formatSalary(job.salaryRange)}
                        </span>
                        {job.locationText && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />{job.locationText}
                          </span>
                        )}
                        {job.deadline && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Hạn: {new Date(job.deadline).toLocaleDateString('vi-VN')}
                          </span>
                        )}
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

                      {/* Action */}
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => openApplyDialog(job)}
                      >
                        <Send className="w-3 h-3" /> Ứng tuyển ngay
                      </Button>
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
              Gợi ý dựa trên kỹ năng, lộ trình và sở thích nghề nghiệp
            </p>
            <Button variant="ghost" size="sm" onClick={fetchSuggestions} className="h-7 text-xs gap-1.5">
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

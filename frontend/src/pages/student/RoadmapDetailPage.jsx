/**
 * RoadmapDetailPage - Chi tiết lộ trình mẫu
 * Xem skills, mô tả + đăng ký lộ trình cá nhân
 * Thời gian tự tính từ số slot rảnh được chọn
 */
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  ArrowLeft, Route, Clock, Users, Star, Target, CheckCircle2,
  BookOpen, Loader2, Calendar, MessageSquare, Send, Lock,
} from 'lucide-react';

const difficultyLabels = { beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' };
const difficultyColors = { beginner: 'success', intermediate: 'warning', advanced: 'danger' };
const levelLabels = { beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' };

const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function RoadmapDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [freeSlots, setFreeSlots] = useState([]);
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);

  useEffect(() => {
    loadRoadmap();
    loadReviews();
  }, [id]);

  async function loadRoadmap() {
    setLoading(true);
    try {
      const { data } = await api.get(`/roadmaps/${id}`);
      setRoadmap(data.data);
    } catch {
      toast.error('Không thể tải lộ trình');
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews() {
    try {
      const { data } = await api.get(`/roadmaps/${id}/reviews`);
      setReviews(data.data);
      if (data.myReview) {
        setMyReview(data.myReview);
        setReviewRating(data.myReview.rating);
        setReviewComment(data.myReview.comment);
      }
    } catch {
      // ok — reviews optional
    }
  }

  // Load occupied slots khi mở dialog đăng ký
  async function openEnrollDialog() {
    setShowEnroll(true);
    setFreeSlots([]);
    try {
      const { data } = await api.get('/student/my-roadmaps-occupied-slots');
      setOccupiedSlots(data.data || []);
    } catch {
      setOccupiedSlots([]);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    if (reviewRating === 0) { toast.error('Vui lòng chọn số sao'); return; }
    setSubmittingReview(true);
    try {
      await api.post(`/student/roadmaps/${id}/reviews`, { rating: reviewRating, comment: reviewComment });
      toast.success('Cảm ơn đánh giá của bạn!');
      loadReviews();
      loadRoadmap();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi');
    } finally {
      setSubmittingReview(false);
    }
  }

  function isSlotOccupied(dayOfWeek, startTime) {
    return occupiedSlots.some(s => s.dayOfWeek === dayOfWeek && s.startTime === startTime);
  }

  function toggleSlot(dayOfWeek, startTime) {
    if (isSlotOccupied(dayOfWeek, startTime)) return;
    const endHour = parseInt(startTime.split(':')[0]) + 2;
    const endTime = `${endHour.toString().padStart(2, '0')}:00`;
    const exists = freeSlots.findIndex(
      (s) => s.dayOfWeek === dayOfWeek && s.startTime === startTime
    );
    if (exists >= 0) {
      setFreeSlots((prev) => prev.filter((_, i) => i !== exists));
    } else {
      setFreeSlots((prev) => [...prev, { dayOfWeek, startTime, endTime }]);
    }
  }

  function isSlotSelected(dayOfWeek, startTime) {
    return freeSlots.some((s) => s.dayOfWeek === dayOfWeek && s.startTime === startTime);
  }

  // Tự tính thời gian học
  const totalHours = roadmap?.skills?.reduce((sum, s) => sum + (s.estimatedHours || 0), 0) || 0;
  const hoursPerWeek = freeSlots.length * 2;
  const weeksNeeded = hoursPerWeek > 0 ? Math.ceil(totalHours / hoursPerWeek) : 0;
  const estimatedMonths = hoursPerWeek > 0 ? Math.max(1, Math.ceil(weeksNeeded / 4)) : 0;

  async function handleEnroll(e) {
    e.preventDefault();
    if (freeSlots.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 khung giờ rảnh');
      return;
    }
    setEnrolling(true);
    try {
      await api.post('/student/my-roadmaps/enroll', {
        roadmapId: id,
        freeTimeSlots: freeSlots,
      });
      toast.success('Đăng ký lộ trình thành công!');
      setShowEnroll(false);
      navigate('/student/my-roadmap');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="animate-fade-in text-center py-20">
        <Route className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Không tìm thấy lộ trình</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/student/roadmaps')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl">
      {/* Back + Header */}
      <button onClick={() => navigate('/student/roadmaps')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </button>

      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Hero */}
        <div className="h-36 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent flex items-center px-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={difficultyColors[roadmap.difficulty]}>
                {difficultyLabels[roadmap.difficulty]}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">{roadmap.title}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Target className="w-4 h-4" /> {roadmap.careerPath}
            </p>
          </div>
          <Button onClick={openEnrollDialog} className="gap-2 shrink-0">
            <Calendar className="w-4 h-4" /> Đăng ký lộ trình
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border p-3 text-center">
              <Clock className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold">{roadmap.estimatedMonths}</p>
              <p className="text-xs text-muted-foreground">tháng</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <BookOpen className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold">{roadmap.skills?.length || 0}</p>
              <p className="text-xs text-muted-foreground">kỹ năng</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <Target className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold">{totalHours}</p>
              <p className="text-xs text-muted-foreground">giờ học</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <Users className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold">{roadmap.enrollmentCount || 0}</p>
              <p className="text-xs text-muted-foreground">đã đăng ký</p>
            </div>
          </div>

          {/* Description */}
          {roadmap.description && (
            <div>
              <h3 className="font-medium text-sm mb-2">Giới thiệu</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{roadmap.description}</p>
            </div>
          )}

          {/* Skills Timeline */}
          <div>
            <h3 className="font-medium text-sm mb-3">Lộ trình kỹ năng ({roadmap.skills?.length})</h3>
            <div className="space-y-0">
              {(roadmap.skills || [])
                .sort((a, b) => a.order - b.order)
                .map((s, i) => (
                  <div key={s._id} className="flex items-stretch group">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center mr-4 w-8">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        i === 0 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground border'
                      }`}>
                        {s.order}
                      </div>
                      {i < roadmap.skills.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border my-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className={`flex-1 rounded-lg border p-3 mb-2 group-hover:border-primary/30 transition-colors ${
                      i === 0 ? 'border-primary/20 bg-primary/[0.02]' : ''
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{s.skill?.icon || '📘'}</span>
                          <span className="font-medium">{s.skill?.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{s.estimatedHours}h</span>
                          <Badge variant="secondary" className="text-[10px]">{levelLabels[s.targetLevel]}</Badge>
                        </div>
                      </div>
                      {s.skill?.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{s.skill.description}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Đánh giá ({reviews.length})
          </h3>
          {roadmap.averageRating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold">{roadmap.averageRating}</span>
              <span className="text-xs text-muted-foreground">/ 5</span>
            </div>
          )}
        </div>

        {/* Write review */}
        <form onSubmit={submitReview} className="rounded-lg border p-4 bg-muted/10">
          <h4 className="text-sm font-medium mb-2">
            {myReview ? 'Cập nhật đánh giá' : 'Viết đánh giá'}
          </h4>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button"
                onMouseEnter={() => setHoverStar(star)}
                onMouseLeave={() => setHoverStar(0)}
                onClick={() => setReviewRating(star)}
                className="p-0.5 transition-transform hover:scale-110">
                <Star className={`w-6 h-6 ${
                  (hoverStar || reviewRating) >= star
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-muted-foreground/30'
                }`} />
              </button>
            ))}
            {reviewRating > 0 && (
              <span className="text-sm font-medium ml-2">{reviewRating}/5</span>
            )}
          </div>
          <textarea
            className="w-full p-2.5 rounded-lg border bg-background text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            placeholder="Chia sẻ trải nghiệm của bạn về lộ trình này..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={2}
          />
          <Button type="submit" size="sm" className="mt-2 gap-1.5"
            disabled={submittingReview || reviewRating === 0}>
            {submittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {myReview ? 'Cập nhật' : 'Gửi đánh giá'}
          </Button>
        </form>

        {/* Reviews list */}
        {reviews.length > 0 && (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r._id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {r.student?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{r.student?.fullName || 'Ẩn danh'}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${
                          r.rating >= s ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/20'
                        }`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-muted-foreground ml-9">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enroll Dialog */}
      <Dialog open={showEnroll} onClose={() => setShowEnroll(false)} className="max-w-2xl">
        <DialogHeader onClose={() => setShowEnroll(false)}>
          Đăng ký lộ trình: {roadmap.title}
        </DialogHeader>
        <form onSubmit={handleEnroll}>
          <DialogBody className="space-y-5">
            {/* Auto-calculated duration */}
            <div className="rounded-lg border bg-muted/10 p-4">
              <label className="text-sm font-medium mb-2 block">Thời gian học (tự tính)</label>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-card border p-2">
                  <p className="text-xl font-bold text-primary">{totalHours}</p>
                  <p className="text-[10px] text-muted-foreground">giờ cần học</p>
                </div>
                <div className="rounded-lg bg-card border p-2">
                  <p className="text-xl font-bold text-primary">{hoursPerWeek || '—'}</p>
                  <p className="text-[10px] text-muted-foreground">giờ/tuần</p>
                </div>
                <div className="rounded-lg bg-card border p-2">
                  <p className={`text-xl font-bold ${estimatedMonths > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {estimatedMonths > 0 ? `~${estimatedMonths}` : '—'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">tháng</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {freeSlots.length === 0
                  ? 'Chọn khung giờ rảnh bên dưới để tính thời gian'
                  : `Với ${freeSlots.length} buổi/tuần × 2h, bạn cần khoảng ${estimatedMonths} tháng`
                }
              </p>
            </div>

            {/* Free time picker */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Chọn khung giờ rảnh ({freeSlots.length} đã chọn)
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Chọn các khung giờ bạn có thể học (mỗi buổi 2 tiếng).
                {occupiedSlots.length > 0 && (
                  <span className="text-amber-600"> Ô 🔒 đã được sử dụng bởi lộ trình khác.</span>
                )}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="px-2 py-2 text-left font-medium text-muted-foreground">Giờ</th>
                      {dayLabels.map((d, i) => (
                        <th key={i} className="px-2 py-2 text-center font-medium text-muted-foreground">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {['07:00', '09:00', '13:00', '15:00', '17:00', '19:00'].map((time) => (
                      <tr key={time} className="border-t">
                        <td className="px-2 py-1.5 text-muted-foreground font-mono">{time}</td>
                        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                          const occupied = isSlotOccupied(day, time);
                          const selected = isSlotSelected(day, time);
                          return (
                            <td key={day} className="px-1 py-1 text-center">
                              <button
                                type="button"
                                onClick={() => toggleSlot(day, time)}
                                disabled={occupied}
                                className={`w-full py-1.5 rounded text-[10px] font-medium transition-all ${
                                  occupied
                                    ? 'bg-amber-500/15 text-amber-600 cursor-not-allowed border border-amber-500/20'
                                    : selected
                                      ? 'bg-primary text-white shadow-sm'
                                      : 'bg-muted/30 text-muted-foreground hover:bg-primary/10'
                                }`}
                              >
                                {occupied ? '🔒' : selected ? '✓' : '—'}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowEnroll(false)}>Hủy</Button>
            <Button type="submit" size="sm" disabled={enrolling || freeSlots.length === 0}>
              {enrolling ? 'Đang đăng ký...' : `Xác nhận (~${estimatedMonths || '?'} tháng, ${freeSlots.length} buổi/tuần)`}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

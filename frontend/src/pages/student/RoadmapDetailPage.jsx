/**
 * RoadmapDetailPage - Chi tiết lộ trình mẫu
 * Xem skills, mô tả + đăng ký lộ trình cá nhân
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  ArrowLeft, Route, Clock, Users, Star, Target, CheckCircle2,
  BookOpen, Loader2, Calendar,
} from 'lucide-react';

const difficultyLabels = { beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' };
const difficultyColors = { beginner: 'success', intermediate: 'warning', advanced: 'danger' };
const levelLabels = { beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' };

const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const timeOptions = ['07:00', '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

export default function RoadmapDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [duration, setDuration] = useState(6);
  const [freeSlots, setFreeSlots] = useState([]);

  useEffect(() => {
    loadRoadmap();
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

  function toggleSlot(dayOfWeek, startTime) {
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
        durationMonths: duration,
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

  const totalHours = roadmap?.skills?.reduce((sum, s) => sum + (s.estimatedHours || 0), 0) || 0;

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
          <Button onClick={() => setShowEnroll(true)} className="gap-2 shrink-0">
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

      {/* Enroll Dialog */}
      <Dialog open={showEnroll} onClose={() => setShowEnroll(false)} className="max-w-2xl">
        <DialogHeader onClose={() => setShowEnroll(false)}>
          Đăng ký lộ trình: {roadmap.title}
        </DialogHeader>
        <form onSubmit={handleEnroll}>
          <DialogBody className="space-y-5">
            {/* Duration */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Thời gian học</label>
              <Select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                <option value={6}>6 tháng (nhanh)</option>
                <option value={9}>9 tháng (vừa phải)</option>
                <option value={12}>12 tháng (thoải mái)</option>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Tổng {totalHours} giờ học — trung bình {Math.ceil(totalHours / (duration * 4))} giờ/tuần
              </p>
            </div>

            {/* Free time picker */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Chọn khung giờ rảnh ({freeSlots.length} đã chọn)
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Chọn các khung giờ bạn có thể học (mỗi buổi 2 tiếng)
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
                        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                          <td key={day} className="px-1 py-1 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSlot(day, time)}
                              className={`w-full py-1.5 rounded text-[10px] font-medium transition-all ${
                                isSlotSelected(day, time)
                                  ? 'bg-primary text-white shadow-sm'
                                  : 'bg-muted/30 text-muted-foreground hover:bg-primary/10'
                              }`}
                            >
                              {isSlotSelected(day, time) ? '✓' : '—'}
                            </button>
                          </td>
                        ))}
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
              {enrolling ? 'Đang đăng ký...' : `Xác nhận đăng ký (${freeSlots.length} slot)`}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

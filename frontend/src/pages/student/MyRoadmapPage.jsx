/**
 * MyRoadmapPage - Lộ trình của tôi
 * Danh sách lộ trình cá nhân + tiến độ + lịch học
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  Route, Clock, Calendar, CheckCircle2, Loader2,
  Target, Play, BookOpen, TrendingUp, ChevronRight,
  Circle, Flame, Pause, RotateCcw, AlertTriangle, Trash2,
} from 'lucide-react';

const statusLabels = { active: 'Đang học', completed: 'Hoàn thành', paused: 'Tạm dừng', cancelled: 'Đã hủy' };
const statusColors = { active: 'success', completed: 'default', paused: 'warning', cancelled: 'danger' };

export default function MyRoadmapPage() {
  const toast = useToast();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [detailPR, setDetailPR] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [completing, setCompleting] = useState(null);
  const [conflictData, setConflictData] = useState(null); // { prId, conflicts }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/student/my-roadmaps');
      setRoadmaps(data.data);
    } catch {
      toast.error('Không thể tải lộ trình');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openDetail(pr) {
    setDetailLoading(true);
    setShowDetail(true);
    try {
      const { data } = await api.get(`/student/my-roadmaps/${pr._id}`);
      setDetailPR(data.data);
    } catch {
      toast.error('Không thể tải chi tiết');
      setShowDetail(false);
    } finally {
      setDetailLoading(false);
    }
  }

  async function completeSession(prId, sessionId) {
    setCompleting(sessionId);
    try {
      const { data } = await api.patch(`/student/my-roadmaps/${prId}/sessions/${sessionId}/complete`);
      setDetailPR(data.data);
      toast.success('Đã hoàn thành buổi học!');
      load(); // refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi');
    } finally {
      setCompleting(null);
    }
  }

  async function pauseRoadmap(prId) {
    try {
      await api.patch(`/student/my-roadmaps/${prId}/pause`);
      toast.success('Đã tạm dừng lộ trình');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  async function cancelRoadmap(prId) {
    if (!window.confirm('Bạn có chắc muốn hủy đăng ký lộ trình này? Thao tác này không thể hoàn tác.')) return;
    try {
      await api.patch(`/student/my-roadmaps/${prId}/cancel`);
      toast.success('Đã hủy đăng ký lộ trình');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  async function resumeRoadmap(prId) {
    try {
      await api.patch(`/student/my-roadmaps/${prId}/resume`);
      toast.success('Đã tiếp tục lộ trình');
      load();
    } catch (error) {
      const resp = error.response?.data;
      if (resp?.conflicts?.length > 0) {
        setConflictData({ prId, conflicts: resp.conflicts, message: resp.message });
      } else {
        toast.error(resp?.message || 'Có lỗi xảy ra');
      }
    }
  }

  async function pauseAndResume(conflictPrId) {
    try {
      await api.patch(`/student/my-roadmaps/${conflictPrId}/pause`);
      toast.success('Đã tạm dừng lộ trình xung đột');
      // Thử resume lại
      await api.patch(`/student/my-roadmaps/${conflictData.prId}/resume`);
      toast.success('Đã tiếp tục lộ trình thành công!');
      setConflictData(null);
      load();
    } catch (error) {
      const resp = error.response?.data;
      if (resp?.conflicts?.length > 0) {
        setConflictData({ prId: conflictData.prId, conflicts: resp.conflicts, message: resp.message });
      } else {
        toast.error(resp?.message || 'Có lỗi xảy ra');
      }
      load();
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Upcoming sessions across all active roadmaps
  const upcomingSessions = roadmaps
    .filter((pr) => pr.status === 'active')
    .map((pr) => pr._id);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lộ trình của tôi</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {roadmaps.length === 0 ? 'Chưa đăng ký lộ trình nào' : `${roadmaps.length} lộ trình`}
          </p>
        </div>
        <Link to="/student/roadmaps">
          <Button variant="outline" className="gap-2">
            <Route className="w-4 h-4" /> Khám phá lộ trình
          </Button>
        </Link>
      </div>

      {roadmaps.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <Route className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-1">Chưa có lộ trình nào</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Hãy khám phá và đăng ký một lộ trình phù hợp với mục tiêu nghề nghiệp của bạn
          </p>
          <Link to="/student/roadmaps">
            <Button className="gap-2">
              <Route className="w-4 h-4" /> Xem danh sách lộ trình
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {roadmaps.map((pr) => {
            const isActive = pr.status === 'active';
            return (
              <div key={pr._id}
                className={`rounded-xl border bg-card overflow-hidden transition-all ${
                  isActive ? 'card-hover' : 'opacity-75'
                }`}>
                {/* Progress bar on top */}
                <div className="h-1 bg-muted">
                  <div
                    className={`h-full transition-all duration-500 ${
                      pr.progress === 100 ? 'bg-emerald-500' : 'bg-primary'
                    }`}
                    style={{ width: `${pr.progress || 0}%` }}
                  />
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{pr.roadmap?.title || 'Lộ trình'}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" /> {pr.roadmap?.careerPath}
                      </p>
                    </div>
                    <Badge variant={statusColors[pr.status]}>{statusLabels[pr.status]}</Badge>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="rounded-lg bg-muted/30 p-2.5 text-center">
                      <p className="text-xl font-bold text-primary">{pr.progress || 0}%</p>
                      <p className="text-[10px] text-muted-foreground">Tiến độ</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2.5 text-center">
                      <p className="text-xl font-bold">{pr.totalHoursLearned || 0}h</p>
                      <p className="text-[10px] text-muted-foreground">Đã học</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2.5 text-center">
                      <p className="text-xl font-bold">{pr.durationMonths}</p>
                      <p className="text-[10px] text-muted-foreground">tháng</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Bắt đầu: {new Date(pr.startDate).toLocaleDateString('vi-VN')}
                    </span>
                    {pr.expectedEndDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Dự kiến: {new Date(pr.expectedEndDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="gap-1 flex-1"
                      onClick={() => openDetail(pr)}>
                      <BookOpen className="w-3.5 h-3.5" /> Xem chi tiết
                    </Button>
                    {pr.status === 'active' && pr.progress < 100 && (
                      <Button size="sm" variant="outline" className="gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                        onClick={() => pauseRoadmap(pr._id)}>
                        <Pause className="w-3.5 h-3.5" /> Tạm dừng
                      </Button>
                    )}
                    {pr.status === 'paused' && (
                      <Button size="sm" variant="outline" className="gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                        onClick={() => resumeRoadmap(pr._id)}>
                        <RotateCcw className="w-3.5 h-3.5" /> Tiếp tục
                      </Button>
                    )}
                    {(pr.status === 'active' || pr.status === 'paused') && pr.status !== 'completed' && (
                      <Button size="sm" variant="outline" className="gap-1 text-red-500 border-red-500/30 hover:bg-red-500/10"
                        onClick={() => cancelRoadmap(pr._id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog with Sessions */}
      <Dialog open={showDetail} onClose={() => setShowDetail(false)} className="max-w-3xl">
        <DialogHeader onClose={() => setShowDetail(false)}>
          Chi tiết lộ trình: {detailPR?.roadmap?.title}
        </DialogHeader>
        {detailLoading ? (
          <DialogBody className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </DialogBody>
        ) : detailPR ? (
          <DialogBody className="space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Progress overview */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/20 border">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-muted" strokeDasharray="100, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="3" />
                  <path className="text-primary" strokeDasharray={`${detailPR.progress || 0}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  {detailPR.progress || 0}%
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{detailPR.roadmap?.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {detailPR.totalHoursLearned || 0}h đã học •
                  {detailPR.sessions?.filter((s) => s.status === 'completed').length || 0} / {detailPR.sessions?.length || 0} buổi
                </p>
              </div>
              <Badge variant={statusColors[detailPR.status]}>{statusLabels[detailPR.status]}</Badge>
            </div>

            {/* Skill progress */}
            <div>
              <h4 className="font-medium text-sm mb-3">Tiến độ kỹ năng</h4>
              <div className="space-y-2">
                {(detailPR.roadmap?.skills || [])
                  .sort((a, b) => a.order - b.order)
                  .map((rSkill) => {
                    const skillSessions = (detailPR.sessions || []).filter(
                      (s) => (s.skill?._id || s.skill) === (rSkill.skill?._id || rSkill.skill)
                    );
                    const completed = skillSessions.filter((s) => s.status === 'completed').length;
                    const total = skillSessions.length;
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                      <div key={rSkill._id} className="flex items-center gap-3 rounded-lg border p-2.5">
                        <span className="text-lg">{rSkill.skill?.icon || '📘'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">{rSkill.skill?.name}</span>
                            <span className="text-xs text-muted-foreground">{completed}/{total}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Upcoming sessions */}
            <div>
              <h4 className="font-medium text-sm mb-3">Buổi học sắp tới</h4>
              <div className="space-y-1.5">
                {(detailPR.sessions || [])
                  .filter((s) => s.status === 'upcoming')
                  .slice(0, 10)
                  .map((session) => (
                    <div key={session._id} className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-muted/20 transition-colors">
                      <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <Link to={`/student/my-roadmap/${detailPR._id}/session/${session._id}`}
                        className="flex-1 min-w-0 hover:text-primary transition-colors cursor-pointer">
                        <span className="text-sm font-medium">{session.skill?.name || 'Kỹ năng'}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(session.date).toLocaleDateString('vi-VN')} • {session.startTime}-{session.endTime}
                        </span>
                      </Link>
                      <Button size="sm" variant="outline" className="text-xs gap-1 shrink-0"
                        disabled={completing === session._id}
                        onClick={() => completeSession(detailPR._id, session._id)}>
                        {completing === session._id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        Hoàn thành
                      </Button>
                    </div>
                  ))}
                {(detailPR.sessions || []).filter((s) => s.status === 'upcoming').length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">
                    {detailPR.progress === 100 ? '🎉 Đã hoàn thành tất cả!' : 'Không có buổi học sắp tới'}
                  </p>
                )}
              </div>
            </div>

            {/* Completed sessions */}
            {(detailPR.sessions || []).filter((s) => s.status === 'completed').length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Đã hoàn thành ({(detailPR.sessions || []).filter((s) => s.status === 'completed').length})
                </h4>
                <div className="space-y-1">
                  {(detailPR.sessions || [])
                    .filter((s) => s.status === 'completed')
                    .slice(-5)
                    .reverse()
                    .map((session) => (
                      <div key={session._id} className="flex items-center gap-3 rounded-lg p-2 text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-sm">{session.skill?.name || 'Kỹ năng'}</span>
                        <span className="text-xs ml-auto">
                          {new Date(session.completedAt || session.date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </DialogBody>
        ) : null}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
        </DialogFooter>
      </Dialog>
      {/* Conflict Resolution Dialog */}
      <Dialog open={!!conflictData} onClose={() => setConflictData(null)} className="max-w-md">
        <DialogHeader onClose={() => setConflictData(null)}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Xung đột lịch học
          </div>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {conflictData?.message}
          </p>
          <p className="text-sm font-medium">Bạn có thể tạm dừng lộ trình xung đột để tiếp tục:</p>
          <div className="space-y-2">
            {(conflictData?.conflicts || []).map((c) => (
              <div key={c.roadmapId} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{c.roadmapTitle}</p>
                  <p className="text-xs text-muted-foreground">Đang hoạt động</p>
                </div>
                <Button size="sm" variant="outline"
                  className="gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                  onClick={() => pauseAndResume(c.roadmapId)}>
                  <Pause className="w-3 h-3" /> Tạm dừng & tiếp tục
                </Button>
              </div>
            ))}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setConflictData(null)}>Đóng</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

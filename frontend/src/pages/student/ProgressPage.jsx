/**
 * ProgressPage - Tổng quan tiến độ học tập
 * Hiển thị thống kê tổng, streak, skill radar
 */
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import {
  TrendingUp, Clock, CheckCircle2, Loader2,
  Target, Flame, Calendar, BookOpen, Route,
  BarChart3, Award,
} from 'lucide-react';

export default function ProgressPage() {
  const toast = useToast();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data } = await api.get('/student/my-roadmaps');
      setRoadmaps(data.data);
    } catch {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  // Aggregate stats
  const totalRoadmaps = roadmaps.length;
  const activeRoadmaps = roadmaps.filter((r) => r.status === 'active').length;
  const completedRoadmaps = roadmaps.filter((r) => r.status === 'completed').length;
  const totalHours = roadmaps.reduce((sum, r) => sum + (r.totalHoursLearned || 0), 0);
  const totalSessions = roadmaps.reduce((sum, r) => sum + (r.sessions?.length || 0), 0);
  const completedSessions = roadmaps.reduce(
    (sum, r) => sum + (r.sessions?.filter((s) => s.status === 'completed')?.length || 0), 0
  );
  const avgProgress = totalRoadmaps > 0
    ? Math.round(roadmaps.reduce((sum, r) => sum + (r.progress || 0), 0) / totalRoadmaps)
    : 0;
  const avgReadiness = totalRoadmaps > 0
    ? Math.round(roadmaps.reduce((sum, r) => sum + (r.readinessScore || 0), 0) / totalRoadmaps)
    : 0;

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tiến độ học tập</h1>
        <p className="text-muted-foreground text-sm mt-1">Tổng quan quá trình học và rèn luyện kỹ năng</p>
      </div>

      {totalRoadmaps === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <BarChart3 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-1">Chưa có dữ liệu</h3>
          <p className="text-sm text-muted-foreground">
            Đăng ký một lộ trình để bắt đầu theo dõi tiến độ
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icon={<Route className="w-5 h-5 text-primary" />}
              value={`${activeRoadmaps}/${totalRoadmaps}`}
              label="Lộ trình đang học"
              accent="primary"
            />
            <StatCard
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              value={`${totalHours}h`}
              label="Tổng giờ đã học"
              accent="amber"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              value={`${completedSessions}/${totalSessions}`}
              label="Buổi hoàn thành"
              accent="emerald"
            />
            <StatCard
              icon={<Target className="w-5 h-5 text-blue-500" />}
              value={`${avgProgress}%`}
              label="Tiến độ TB"
              accent="blue"
            />
          </div>

          {/* Roadmap Progress Cards */}
          <div>
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Chi tiết từng lộ trình
            </h2>
            <div className="space-y-3">
              {roadmaps.map((pr) => {
                const sessions = pr.sessions || [];
                const done = sessions.filter((s) => s.status === 'completed').length;
                const total = sessions.length;
                const pct = pr.progress || 0;

                return (
                  <div key={pr._id} className="rounded-xl border bg-card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{pr.roadmap?.title}</h3>
                        <p className="text-xs text-muted-foreground">{pr.roadmap?.careerPath}</p>
                      </div>
                      <Badge variant={pr.status === 'active' ? 'success' : pr.status === 'completed' ? 'default' : 'warning'}>
                        {pr.status === 'active' ? 'Đang học' : pr.status === 'completed' ? 'Hoàn thành' : 'Tạm dừng'}
                      </Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{done} / {total} buổi</span>
                        <span className="font-medium text-foreground">{pct}%</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-primary' : 'bg-amber-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {pr.totalHoursLearned || 0}h đã học
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {pr.durationMonths} tháng
                      </span>
                      {pr.readinessScore > 0 && (
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" /> Sẵn sàng: {pr.readinessScore}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completed Roadmaps */}
          {completedRoadmaps > 0 && (
            <div className="rounded-xl border bg-gradient-to-br from-emerald-500/5 to-transparent p-6">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-emerald-500" /> Lộ trình đã hoàn thành ({completedRoadmaps})
              </h3>
              <div className="flex flex-wrap gap-2">
                {roadmaps.filter((r) => r.status === 'completed').map((r) => (
                  <Badge key={r._id} variant="success" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {r.roadmap?.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, accent }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

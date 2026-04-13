/**
 * RoadmapListPage - Danh sách lộ trình mẫu
 * Browse, search, filter + button "Gợi ý lộ trình" (AI)
 */
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import SmartRoadmapModal from '../../components/student/SmartRoadmapModal';
import {
  Search, Route, Clock, Users, Star, ChevronRight,
  Heart, Target, Compass,
} from 'lucide-react';

const difficultyLabels = { beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' };
const difficultyColors = { beginner: 'success', intermediate: 'warning', advanced: 'danger' };

export default function RoadmapListPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [favorites, setFavorites] = useState({});
  const [showSmart, setShowSmart] = useState(false);

  const loadRoadmaps = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (difficulty) params.difficulty = difficulty;
      const { data } = await api.get('/roadmaps', { params });
      setRoadmaps(data.data);
    } catch {
      toast.error('Không thể tải lộ trình');
    } finally {
      setLoading(false);
    }
  }, [search, difficulty]);

  useEffect(() => { loadRoadmaps(); }, [loadRoadmaps]);

  // Auto-open smart modal when navigated back from detail page
  useEffect(() => {
    if (location.state?.openSmart) {
      setShowSmart(true);
      // Clear state to prevent re-triggering on refresh
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // Load trạng thái yêu thích (chỉ khi đã đăng nhập)
  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/student/favorites', { params: { type: 'roadmap' } })
      .then(({ data }) => {
        const map = {};
        (data.data || []).forEach(f => {
          if (f.roadmap?._id) map[f.roadmap._id] = true;
        });
        setFavorites(map);
      })
      .catch(() => { });
  }, [isAuthenticated]);

  async function toggleFavorite(roadmapId) {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    try {
      const { data } = await api.post('/student/favorites/toggle', {
        type: 'roadmap', itemId: roadmapId,
      });
      setFavorites((prev) => ({ ...prev, [roadmapId]: data.added }));
      toast.success(data.message);
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <SmartRoadmapModal isOpen={showSmart} onClose={() => setShowSmart(false)} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Danh Sách Lộ Trình</h1>
          <p className="text-muted-foreground text-sm mt-1">Khám phá các lộ trình học tập phù hợp</p>
        </div>
        <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30 shadow-sm"
            onClick={() => {
              if (!isAuthenticated) { navigate(`/login?next=${encodeURIComponent(location.pathname)}`); return; }
              setShowSmart(true);
            }}
          >
            <Compass className="w-3.5 h-3.5" /> Gợi ý lộ trình
          </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm lộ trình, hướng nghề nghiệp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-36">
          <option value="">Tất cả mức độ</option>
          {Object.entries(difficultyLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <div className="h-5 w-32 skeleton mb-2" />
              <div className="h-4 w-48 skeleton mb-4" />
              <div className="h-3 w-24 skeleton" />
            </div>
          ))}
        </div>
      ) : roadmaps.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Route className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Không tìm thấy lộ trình nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roadmaps.map((roadmap) => (
            <div key={roadmap._id} className="rounded-xl border bg-card overflow-hidden card-hover group">
              {/* Thumbnail */}
              <div className="h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center">
                <Route className="w-10 h-10 text-primary/30" />
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge variant={difficultyColors[roadmap.difficulty]}>
                      {difficultyLabels[roadmap.difficulty]}
                    </Badge>
                  </div>
                  <button
                    onClick={() => toggleFavorite(roadmap._id)}
                    className={`p-1 rounded-md transition-colors ${favorites[roadmap._id]
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-muted-foreground hover:text-red-500'
                      }`}
                  >
                    <Heart className={`w-4 h-4 ${favorites[roadmap._id] ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                  {roadmap.title}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                  <Target className="w-3.5 h-3.5" /> {roadmap.careerPath}
                </p>

                {roadmap.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{roadmap.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {roadmap.estimatedMonths} tháng
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {roadmap.enrollmentCount || 0}
                  </span>
                  {roadmap.averageRating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {roadmap.averageRating.toFixed(1)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {roadmap.skills?.length || 0} kỹ năng
                  </span>
                  <div className="flex-1" />
                  <Link
                    to={`/roadmaps/${roadmap._id}`}
                    className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    Xem chi tiết <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

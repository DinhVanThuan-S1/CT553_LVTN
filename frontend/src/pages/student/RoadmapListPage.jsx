/**
 * RoadmapListPage - Danh sách lộ trình mẫu
 * Browse, search, filter + button "Gợi ý lộ trình" (AI)
 * Filters persisted in URL params để giữ state khi navigate back
 */
import { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import SmartRoadmapModal from '../../components/student/SmartRoadmapModal';

import {
  Search, Route, Clock, Users, Star, ChevronDown,
  Heart, Target, ChevronRight, Sparkles, ArrowRight,
} from 'lucide-react';


const DIFFICULTY = {
  beginner: { label: 'Cơ bản', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  intermediate: { label: 'Trung bình', cls: 'bg-amber-500/10  text-amber-600  border-amber-500/20' },
  advanced: { label: 'Nâng cao', cls: 'bg-red-500/10    text-red-600    border-red-500/20' },
};

const CARD_GRADIENT = {
  beginner: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
  intermediate: 'from-amber-500/10  via-amber-500/5  to-transparent',
  advanced: 'from-red-500/10    via-red-500/5    to-transparent',
};

export default function RoadmapListPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // ── Persist filters in URL so browser Back restores state ──
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') || '';
  const difficulty = searchParams.get('d') || '';
  const careerPath = searchParams.get('c') || '';

  function setParam(key, value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    }, { replace: true });
  }

  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState({});
  const [showSmart, setShowSmart] = useState(false);
  const [showDiffMenu, setShowDiffMenu] = useState(false);
  const [showCareerMenu, setShowCareerMenu] = useState(false);
  const diffRef = useRef(null);
  const careerRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (diffRef.current && !diffRef.current.contains(e.target)) setShowDiffMenu(false);
      if (careerRef.current && !careerRef.current.contains(e.target)) setShowCareerMenu(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);


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

  useEffect(() => {
    if (location.state?.openSmart) {
      setShowSmart(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/student/favorites', { params: { type: 'roadmap' } })
      .then(({ data }) => {
        const map = {};
        (data.data || []).forEach(f => { if (f.roadmap?._id) map[f.roadmap._id] = true; });
        setFavorites(map);
      })
      .catch(() => { });
  }, [isAuthenticated]);

  // ── Career path options (derived from loaded data) ──
  const careerPathOptions = useMemo(() => {
    const set = new Set(roadmaps.map(r => r.careerPath).filter(Boolean));
    return [...set].sort();
  }, [roadmaps]);

  // ── Client-side filter by careerPath ──
  const filtered = useMemo(() => {
    if (!careerPath) return roadmaps;
    return roadmaps.filter(r => r.careerPath === careerPath);
  }, [roadmaps, careerPath]);

  async function toggleFavorite(roadmapId) {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    try {
      const { data } = await api.post('/student/favorites/toggle', { type: 'roadmap', itemId: roadmapId });
      setFavorites(prev => ({ ...prev, [roadmapId]: data.added }));
      toast.success(data.message);
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  }

  const activeFilters = [search, difficulty, careerPath].filter(Boolean).length;

  return (
    <div className="animate-fade-in space-y-6">
      <SmartRoadmapModal isOpen={showSmart} onClose={() => setShowSmart(false)} />

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-sky-500/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/8 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Route className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Danh sách lộ trình</span>
            </div>
            {/* <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Danh Sách Lộ Trình</h1> */}
            <p className="text-muted-foreground text-sm mt-1.5">
              Khám phá các lộ trình học tập phù hợp với mục tiêu của bạn
            </p>
            {!loading && (
              <p className="text-xs text-muted-foreground/60 mt-2">
                {filtered.length} lộ trình
                {activeFilters > 0 && ` · ${activeFilters} bộ lọc đang áp dụng`}
              </p>
            )}
          </div>
          <Button
            className="gap-2 shadow-md"
            onClick={() => {
              if (!isAuthenticated) { navigate(`/login?next=${encodeURIComponent(location.pathname)}`); return; }
              setShowSmart(true);
            }}
          >
            <Sparkles className="w-4 h-4" />
            Gợi ý lộ trình
          </Button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm lộ trình, hướng nghề nghiệp..."
            value={search}
            onChange={e => setParam('q', e.target.value)}
            className="pl-9"
          />
        </div>
        {/* Difficulty */}
        <div className="relative shrink-0" ref={diffRef}>
          <button
            onClick={() => { setShowDiffMenu(v => !v); setShowCareerMenu(false); }}
            className={`h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all w-40 ${showDiffMenu || difficulty
                ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1'
                : 'border-input bg-background text-foreground hover:border-primary/60'
              }`}
          >
            <span className="flex-1 text-left truncate">
              {difficulty ? DIFFICULTY[difficulty]?.label : 'Tất cả mức độ'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${showDiffMenu ? 'rotate-180 text-primary' : 'text-muted-foreground'
              }`} />
          </button>
          {showDiffMenu && (
            <div className="absolute left-0 top-full mt-1.5 z-30 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden w-44 animate-fade-in">
              <div className="py-1.5">
                {[{ value: '', label: 'Tất cả mức độ' }, ...Object.entries(DIFFICULTY).map(([k, { label }]) => ({ value: k, label }))]
                  .map(({ value, label }) => (
                    <button key={value}
                      onClick={() => { setParam('d', value); setShowDiffMenu(false); }}
                      className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${difficulty === value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted/50'
                        }`}
                    >
                      {difficulty === value && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      <span className={difficulty === value ? '' : 'ml-3.5'}>{label}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
        {/* Career path */}
        <div className="relative shrink-0" ref={careerRef}>
          <button
            onClick={() => { setShowCareerMenu(v => !v); setShowDiffMenu(false); }}
            disabled={loading || careerPathOptions.length === 0}
            className={`h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all w-48 disabled:opacity-50 disabled:cursor-not-allowed ${showCareerMenu || careerPath
                ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1'
                : 'border-input bg-background text-foreground hover:border-primary/60'
              }`}
          >
            <span className="flex-1 text-left truncate">
              {careerPath || 'Tất cả hướng nghề'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${showCareerMenu ? 'rotate-180 text-primary' : 'text-muted-foreground'
              }`} />
          </button>
          {showCareerMenu && (
            <div className="absolute right-0 top-full mt-1.5 z-30 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden w-52 animate-fade-in">
              <div className="py-1.5 max-h-64 overflow-y-auto">
                {[{ value: '', label: 'Tất cả hướng nghề' }, ...careerPathOptions.map(cp => ({ value: cp, label: cp }))]
                  .map(({ value, label }) => (
                    <button key={value}
                      onClick={() => { setParam('c', value); setShowCareerMenu(false); }}
                      className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${careerPath === value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted/50'
                        }`}
                    >
                      {careerPath === value && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      <span className={careerPath === value ? '' : 'ml-3.5'}>{label}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-xl border bg-card overflow-hidden">
              <div className="h-28 skeleton" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-20 skeleton rounded-full" />
                <div className="h-5 w-3/4 skeleton" />
                <div className="h-3 w-1/2 skeleton" />
                <div className="h-3 w-full skeleton" />
                <div className="h-3 w-full skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
            <Route className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-muted-foreground">Không tìm thấy lộ trình nào</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(roadmap => {
            const diff = DIFFICULTY[roadmap.difficulty] || DIFFICULTY.beginner;
            const grad = CARD_GRADIENT[roadmap.difficulty] || CARD_GRADIENT.beginner;
            const isFav = favorites[roadmap._id];

            return (
              <div
                key={roadmap._id}
                className="rounded-xl border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col"
              >
                {/* Thumbnail */}
                <div className={`h-28 bg-gradient-to-br ${grad} flex items-center justify-center relative`}>
                  <Route className="w-10 h-10 text-foreground/10" />
                  {/* Favorite */}
                  <button
                    onClick={() => toggleFavorite(roadmap._id)}
                    className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-sm transition-all ${isFav
                      ? 'bg-red-500/15 text-red-500 hover:bg-red-500/25'
                      : 'bg-black/10 text-white/60 hover:bg-black/20 hover:text-white'
                      }`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                  {/* Difficulty badge */}
                  <span className={`absolute bottom-3 left-3 text-[11px] font-bold px-2 py-0.5 rounded-full border ${diff.cls}`}>
                    {diff.label}
                  </span>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors leading-snug">
                    {roadmap.title}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2.5">
                    <Target className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{roadmap.careerPath}</span>
                  </p>

                  {roadmap.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed flex-1">
                      {roadmap.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {roadmap.estimatedMonths} tháng
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {roadmap.enrollmentCount || 0}
                    </span>
                    {roadmap.averageRating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {roadmap.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/60">
                    <span className="text-xs text-muted-foreground">
                      {roadmap.skills?.length || 0} kỹ năng
                    </span>
                    <Link
                      to={`/roadmaps/${roadmap._id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-150 group/btn"
                    >
                      Xem chi tiết
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

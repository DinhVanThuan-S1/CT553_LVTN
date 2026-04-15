/**
 * FavoritesPage - Danh sách yêu thích
 * Xem công việc & lộ trình đã lưu
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import {
  Heart, Loader2, Briefcase, Route, Trash2, Clock,
  Target, Building2, MapPin, ExternalLink, BookOpen,
} from 'lucide-react';

export default function FavoritesPage() {
  const toast = useToast();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/student/favorites');
      setFavorites(data.data);
    } catch {
      toast.error('Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function removeFavorite(fav) {
    try {
      await api.post('/student/favorites/toggle', {
        type: fav.type,
        itemId: fav.type === 'job' ? fav.jobPosting?._id : fav.roadmap?._id,
      });
      toast.success('Đã bỏ yêu thích');
      load();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  }

  const filtered = tab === 'all' ? favorites : favorites.filter(f => f.type === tab);
  const jobCount = favorites.filter(f => f.type === 'job').length;
  const roadmapCount = favorites.filter(f => f.type === 'roadmap').length;

  const tabs = [
    { key: 'all', label: 'Tất cả', count: favorites.length, icon: Heart },
    { key: 'job', label: 'Công việc', count: jobCount, icon: Briefcase },
    { key: 'roadmap', label: 'Lộ trình', count: roadmapCount, icon: Route },
  ];

  if (loading) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="h-32 skeleton rounded-2xl" />
        <div className="flex gap-2">{[1, 2, 3].map(i => <div key={i} className="h-9 w-28 skeleton rounded-full" />)}</div>
        {[1, 2, 3].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-teal-500/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Yêu Thích</span>
          </div>
          {/* <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Yêu Thích</h1> */}
          <p className="text-muted-foreground text-sm mt-1.5">
            {favorites.length} mục đã lưu
            {jobCount > 0 && ` · ${jobCount} công việc`}
            {roadmapCount > 0 && ` · ${roadmapCount} lộ trình`}
          </p>
        </div>
      </div>

      {/* ── Tab Filter ── */}
      <div className="flex items-center gap-2">
        {tabs.map(({ key, label, count, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${tab === key
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50'
              }`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
              }`}>{count}</span>
          </button>
        ))}
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Chưa có mục yêu thích</h3>
          <p className="text-sm text-muted-foreground">Lưu công việc hoặc lộ trình để xem lại sau</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(fav => {
            const isJob = fav.type === 'job';
            const item = isJob ? fav.jobPosting : fav.roadmap;
            return (
              <div key={fav._id}
                className="group rounded-xl border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden">
                {/* type strip */}
                <div className={`h-1 ${isJob ? 'bg-gradient-to-r from-blue-400 to-sky-400' : 'bg-gradient-to-r from-primary/60 to-sky-500/40'}`} />

                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${isJob
                        ? 'bg-blue-500/10 text-blue-600 border-blue-300/30'
                        : 'bg-primary/10 text-primary border-primary/15'
                      }`}>
                      {isJob ? <Briefcase className="w-4 h-4" /> : <Route className="w-4 h-4" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {!item ? (
                        <p className="text-sm text-muted-foreground italic">Mục này không còn tồn tại</p>
                      ) : (
                        <>
                          <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">
                            {item.title}
                          </h3>
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                            {isJob ? (
                              <>
                                {item.company?.name && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{item.company.name}</span>}
                                {item.locationText && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.locationText}</span>}
                              </>
                            ) : (
                              <>
                                <span className="flex items-center gap-1"><Target className="w-3 h-3" />{item.careerPath}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.estimatedMonths} tháng</span>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Type badge */}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${isJob
                        ? 'bg-blue-500/10 text-blue-600 border-blue-300/30'
                        : 'bg-primary/8 text-primary border-primary/15'
                      }`}>
                      {isJob ? 'Công việc' : 'Lộ trình'}
                    </span>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/40">
                    {!isJob && item && (
                      <Link to={`/student/roadmaps/${item._id}`}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" /> Xem lộ trình
                      </Link>
                    )}
                    <button onClick={() => removeFavorite(fav)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors ml-auto">
                      <Trash2 className="w-3.5 h-3.5" /> Bỏ lưu
                    </button>
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

/**
 * FavoritesPage - Danh sách yêu thích
 * Xem công việc & lộ trình đã lưu
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import {
  Heart, Loader2, Briefcase, Route, Trash2, Clock,
  Target, Building2, MapPin, ExternalLink,
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

  const filtered = tab === 'all' ? favorites
    : favorites.filter((f) => f.type === tab);
  const jobCount = favorites.filter((f) => f.type === 'job').length;
  const roadmapCount = favorites.filter((f) => f.type === 'roadmap').length;

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
        <h1 className="text-2xl font-bold">Yêu Thích</h1>
        <p className="text-muted-foreground text-sm mt-1">{favorites.length} mục đã lưu</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {[
          { key: 'all', label: `Tất cả (${favorites.length})` },
          { key: 'job', label: `Công việc (${jobCount})`, icon: Briefcase },
          { key: 'roadmap', label: `Lộ trình (${roadmapCount})`, icon: Route },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${tab === key ? 'bg-primary text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}>
            {Icon && <Icon className="w-3.5 h-3.5" />} {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <Heart className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-1">Chưa có mục yêu thích</h3>
          <p className="text-sm text-muted-foreground">Lưu công việc hoặc lộ trình để xem lại sau</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fav) => (
            <div key={fav._id} className="rounded-xl border bg-card p-4 card-hover">
              <div className="flex items-center gap-4">
                {/* Type icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${fav.type === 'job' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'
                  }`}>
                  {fav.type === 'job' ? <Briefcase className="w-5 h-5" /> : <Route className="w-5 h-5" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {fav.type === 'job' && fav.jobPosting ? (
                    <>
                      <h3 className="font-semibold truncate">{fav.jobPosting.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {fav.jobPosting.company?.name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {fav.jobPosting.company.name}
                          </span>
                        )}
                        {fav.jobPosting.locationText && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {fav.jobPosting.locationText}
                          </span>
                        )}
                      </div>
                    </>
                  ) : fav.type === 'roadmap' && fav.roadmap ? (
                    <>
                      <h3 className="font-semibold truncate">{fav.roadmap.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" /> {fav.roadmap.careerPath}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {fav.roadmap.estimatedMonths} tháng
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Mục này không còn tồn tại</p>
                  )}
                </div>

                {/* Badge + Actions */}
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {fav.type === 'job' ? 'Công việc' : 'Lộ trình'}
                </Badge>

                {fav.type === 'roadmap' && fav.roadmap && (
                  <Link to={`/student/roadmaps/${fav.roadmap._id}`}>
                    <button className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </Link>
                )}
                <button onClick={() => removeFavorite(fav)}
                  className="p-2 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

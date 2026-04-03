/**
 * AdminResourcesPage — Trang Quản lý Tài nguyên học tập
 * Admin quản lý các tài nguyên:
 * - Links ngoài (YouTube, Udemy, Coursera, docs...)
 * - Phân loại theo category (Video / Article / Course / Tool / Book)
 * - Gắn tag kỹ năng, lộ trình
 * - CRUD: Thêm / Sửa / Xóa / Bật-tắt hiển thị
 * - Tìm kiếm & lọc
 *
 * NOTE: Đây là dữ liệu local state (mock) — chưa cần backend riêng vì
 * resources thường được lưu trong Roadmap.skills hoặc Session
 */
import { useState, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  Plus, Search, BookOpen, Video, Globe, Wrench, BookMarked,
  Edit3, Trash2, Eye, EyeOff, Link, ExternalLink, Tag,
  ChevronRight, Filter, LayoutGrid, List, Star,
} from 'lucide-react';

const CATEGORIES = [
  { key: 'video', label: 'Video', icon: Video, color: 'danger' },
  { key: 'article', label: 'Bài viết', icon: BookOpen, color: 'default' },
  { key: 'course', label: 'Khóa học', icon: BookMarked, color: 'success' },
  { key: 'tool', label: 'Công cụ', icon: Wrench, color: 'warning' },
  { key: 'documentation', label: 'Tài liệu', icon: Globe, color: 'secondary' },
];

const INITIAL_RESOURCES = [
  {
    id: '1', title: 'The Odin Project — Full Stack', category: 'course', url: 'https://www.theodinproject.com',
    description: 'Lộ trình học lập trình web miễn phí toàn diện', tags: ['JavaScript', 'HTML', 'CSS', 'React'],
    isActive: true, isFeatured: true, views: 1240,
  },
  {
    id: '2', title: 'freeCodeCamp — JavaScript Algorithms', category: 'course', url: 'https://www.freecodecamp.org',
    description: 'Học JavaScript và thuật toán qua thực hành', tags: ['JavaScript', 'Algorithm'],
    isActive: true, isFeatured: false, views: 890,
  },
  {
    id: '3', title: 'MDN Web Docs', category: 'documentation', url: 'https://developer.mozilla.org',
    description: 'Tài liệu chính thức cho HTML, CSS, JavaScript', tags: ['JavaScript', 'HTML', 'CSS', 'Web'],
    isActive: true, isFeatured: true, views: 2100,
  },
  {
    id: '4', title: 'Traversy Media — Python Crash Course', category: 'video', url: 'https://youtube.com',
    description: 'Khóa học Python cơ bản từ YouTube', tags: ['Python', 'Backend'],
    isActive: true, isFeatured: false, views: 670,
  },
  {
    id: '5', title: 'Docker — Official Quickstart', category: 'documentation', url: 'https://docs.docker.com',
    description: 'Bắt đầu nhanh với Docker và containerization', tags: ['Docker', 'DevOps'],
    isActive: false, isFeatured: false, views: 340,
  },
];

const emptyForm = { title: '', category: 'article', url: '', description: '', tags: '', isFeatured: false };

export default function AdminResourcesPage() {
  const toast = useToast();
  const [resources, setResources] = useState(INITIAL_RESOURCES);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // ─── Filtered list ───
  const filtered = useMemo(() => {
    return resources.filter(r => {
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())
        && !r.description.toLowerCase().includes(search.toLowerCase())
        && !r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
      ) return false;
      if (filterCat && r.category !== filterCat) return false;
      if (filterActive === 'active' && !r.isActive) return false;
      if (filterActive === 'inactive' && r.isActive) return false;
      return true;
    });
  }, [resources, search, filterCat, filterActive]);

  // ─── Stats ───
  const stats = useMemo(() => ({
    total: resources.length,
    active: resources.filter(r => r.isActive).length,
    featured: resources.filter(r => r.isFeatured).length,
    totalViews: resources.reduce((s, r) => s + r.views, 0),
  }), [resources]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditTarget(r.id);
    setForm({ ...r, tags: r.tags.join(', ') });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('Tên tài nguyên là bắt buộc'); return; }
    if (!form.url.trim()) { toast.error('URL là bắt buộc'); return; }
    setSaving(true);
    setTimeout(() => {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      if (editTarget) {
        setResources(rs => rs.map(r => r.id === editTarget ? { ...r, ...form, tags } : r));
        toast.success('Cập nhật tài nguyên thành công!');
      } else {
        const newR = {
          ...form, id: Date.now().toString(), tags,
          isActive: true, isFeatured: form.isFeatured, views: 0,
        };
        setResources(rs => [newR, ...rs]);
        toast.success('Thêm tài nguyên thành công!');
      }
      setShowModal(false);
      setSaving(false);
    }, 500);
  };

  const toggleActive = (id) => {
    setResources(rs => rs.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    toast.success('Cập nhật trạng thái thành công');
  };

  const toggleFeatured = (id) => {
    setResources(rs => rs.map(r => r.id === id ? { ...r, isFeatured: !r.isFeatured } : r));
  };

  const handleDelete = (id) => {
    setResources(rs => rs.filter(r => r.id !== id));
    toast.success('Xóa tài nguyên thành công');
  };

  const getCatConfig = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[1];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Tài Nguyên</h1>
          <p className="text-muted-foreground text-sm mt-1">Tài nguyên học tập bổ trợ cho sinh viên</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Thêm tài nguyên
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng tài nguyên', value: stats.total, icon: BookOpen },
          { label: 'Đang hiển thị', value: stats.active, icon: Eye },
          { label: 'Nổi bật', value: stats.featured, icon: Star },
          { label: 'Lượt xem', value: stats.totalViews.toLocaleString(), icon: Globe },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Category quick filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCat('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
            ${filterCat === '' ? 'bg-primary text-primary-foreground' : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'}`}
        >
          Tất cả
        </button>
        {CATEGORIES.map(c => {
          const CatIcon = c.icon;
          return (
            <button
              key={c.key}
              onClick={() => setFilterCat(filterCat === c.key ? '' : c.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filterCat === c.key ? 'bg-primary text-primary-foreground' : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              <CatIcon className="w-3.5 h-3.5" /> {c.label}
            </button>
          );
        })}
      </div>

      {/* Filters + view mode */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, mô tả, tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterActive} onChange={e => setFilterActive(e.target.value)} className="w-40">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hiển thị</option>
          <option value="inactive">Đã ẩn</option>
        </Select>
        <div className="flex gap-1 border rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-muted' : 'hover:bg-muted/40'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-muted' : 'hover:bg-muted/40'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Resource Grid / List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Không tìm thấy tài nguyên nào</p>
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Thêm tài nguyên đầu tiên
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => <ResourceCard key={r.id} resource={r} getCatConfig={getCatConfig}
            onEdit={() => openEdit(r)} onToggle={() => toggleActive(r.id)}
            onToggleFeatured={() => toggleFeatured(r.id)} onDelete={() => handleDelete(r.id)} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => <ResourceRow key={r.id} resource={r} getCatConfig={getCatConfig}
            onEdit={() => openEdit(r)} onToggle={() => toggleActive(r.id)}
            onToggleFeatured={() => toggleFeatured(r.id)} onDelete={() => handleDelete(r.id)} />)}
        </div>
      )}

      {/* Modal Create / Edit */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} className="max-w-lg">
        <DialogHeader onClose={() => setShowModal(false)}>
          {editTarget ? 'Chỉnh sửa tài nguyên' : 'Thêm tài nguyên mới'}
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Tên tài nguyên *</label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="VD: React Documentation..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Loại *</label>
              <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Tags (phân cách bằng dấu phẩy)</label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="JavaScript, React, ..." />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">URL *</label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://..." className="pl-9" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Mô tả</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Mô tả ngắn gọn về tài nguyên..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isFeatured}
              onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
              className="accent-primary w-4 h-4" />
            <div>
              <p className="text-sm font-medium">Đánh dấu nổi bật</p>
              <p className="text-xs text-muted-foreground">Hiển thị ưu tiên trong danh sách gợi ý</p>
            </div>
          </label>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Hủy</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? 'Đang lưu...' : editTarget ? 'Cập nhật' : 'Thêm tài nguyên'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

// — Resource card (grid view) —
function ResourceCard({ resource: r, getCatConfig, onEdit, onToggle, onToggleFeatured, onDelete }) {
  const cat = getCatConfig(r.category);
  const CatIcon = cat.icon;

  return (
    <div className={`rounded-xl border bg-card p-5 space-y-3 transition-all hover:shadow-sm ${!r.isActive ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <CatIcon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-sm line-clamp-1">{r.title}</p>
              {r.isFeatured && <Star className="w-3.5 h-3.5 text-amber-500 fill-current flex-shrink-0" />}
            </div>
            <Badge variant={cat.color} className="text-[10px] mt-0.5">{cat.label}</Badge>
          </div>
        </div>
        <a href={r.url} target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>

      <div className="flex flex-wrap gap-1">
        {r.tags.slice(0, 3).map(t => (
          <span key={t} className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded-md flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" />{t}
          </span>
        ))}
        {r.tags.length > 3 && (
          <span className="text-[10px] text-muted-foreground">+{r.tags.length - 3}</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border/40">
        <span className="text-xs text-muted-foreground">{r.views} lượt xem</span>
        <div className="flex gap-1">
          <button onClick={onToggleFeatured}
            className={`p-1.5 rounded hover:bg-muted transition-colors ${r.isFeatured ? 'text-amber-500' : 'text-muted-foreground'}`}
            title="Nổi bật">
            <Star className="w-3.5 h-3.5" fill={r.isFeatured ? 'currentColor' : 'none'} />
          </button>
          <button onClick={onToggle}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title={r.isActive ? 'Ẩn' : 'Hiện'}>
            {r.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onEdit}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Sửa">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete}
            className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
            title="Xóa">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// — Resource row (list view) —
function ResourceRow({ resource: r, getCatConfig, onEdit, onToggle, onToggleFeatured, onDelete }) {
  const cat = getCatConfig(r.category);
  const CatIcon = cat.icon;

  return (
    <div className={`rounded-xl border bg-card px-4 py-3 flex items-center gap-4 transition-all hover:shadow-sm ${!r.isActive ? 'opacity-60' : ''}`}>
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <CatIcon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{r.title}</p>
          {r.isFeatured && <Star className="w-3 h-3 text-amber-500 fill-current flex-shrink-0" />}
          <Badge variant={cat.color} className="text-[10px] flex-shrink-0">{cat.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{r.description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
        <Eye className="w-3 h-3" /> {r.views}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onToggle} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          {r.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <a href={r.url} target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button onClick={onEdit} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * SkillMapPage - Bản đồ kỹ năng
 * Hiển thị tất cả kỹ năng theo nhóm + mức độ thành thạo
 * + Biểu đồ kỹ năng + Click xem chi tiết + tài nguyên
 * + 3 nguồn kỹ năng: roadmap (verified), academic (verified), self
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  Search, Loader2, Zap, BookOpen, ExternalLink, FileText,
  Clock, BarChart3, ChevronRight, ChevronDown, Play, HelpCircle, X,
  Plus, Shield, GraduationCap, Route, User, RefreshCw, Trash2,
  CheckCircle2, Star, LayoutGrid,
} from 'lucide-react';
import { useRef } from 'react';

const categoryLabels = {
  programming: 'Ngôn ngữ lập trình',
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Cơ sở dữ liệu',
  devops: 'DevOps & Tools',
  mobile: 'Mobile',
  ai_ml: 'AI / Machine Learning',
  software_engineering: 'Kỹ thuật phần mềm',
  networking: 'Mạng & Bảo mật',
  soft_skills: 'Kỹ năng mềm',
  game_development: 'Phát triển Game',
  embedded: 'Hệ thống nhúng',
  testing: 'Testing & QA',
};

const categoryIcons = {
  programming: '💻', frontend: '🌐', backend: '⚙️', database: '📊',
  devops: '🐳', mobile: '📱', ai_ml: '🤖', software_engineering: '🏗️',
  networking: '🔒', soft_skills: '🤝',
};

const sourceLabels = { roadmap: 'Lộ trình', academic: 'Học phần', self: 'Tự khai báo' };
const sourceIcons = { roadmap: Route, academic: GraduationCap, self: User };
const sourceColors = {
  roadmap: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  academic: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  self: 'bg-muted text-muted-foreground border-muted-foreground/20',
};

const resourceTypeLabels = { content: 'Nội dung', exercise: 'Bài tập', test: 'Bài test' };
const resourceTypeIcons = { content: BookOpen, exercise: FileText, test: HelpCircle };
const categoryFormatLabels = { video: 'Video', article: 'Bài viết', course: 'Khóa học', documentation: 'Docs', tool: 'Công cụ', book: 'Sách' };
const difficultyLabels = { beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' };
const difficultyColors = { beginner: 'success', intermediate: 'warning', advanced: 'danger' };

export default function SkillMapPage() {
  const toast = useToast();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillProgress, setSkillProgress] = useState({});
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillDetail, setSkillDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  // Student Skills (3 sources)
  const [mySkills, setMySkills] = useState([]);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showMyDetails, setShowMyDetails] = useState(true);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const categoryMenuRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setShowCategoryMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [skillsRes, roadmapsRes, mySkillsRes] = await Promise.all([
        api.get('/skills/all'),
        api.get('/student/my-roadmaps'),
        api.get('/student/skills'),
      ]);
      setSkills(skillsRes.data.data);
      setMySkills(mySkillsRes.data.data || []);

      // Tính % hoàn thành cho mỗi kỹ năng (chỉ từ roadmaps active/completed)
      const progress = {};
      (roadmapsRes.data.data || [])
        .filter((pr) => pr.status === 'active' || pr.status === 'completed')
        .forEach((pr) => {
          (pr.sessions || []).forEach((s) => {
            const sid = s.skill?._id || s.skill;
            if (!sid) return;
            if (!progress[sid]) progress[sid] = { total: 0, completed: 0 };
            progress[sid].total += 1;
            if (s.status === 'completed') progress[sid].completed += 1;
          });
        });
      setSkillProgress(progress);
    } catch {
      toast.error('Không thể tải kỹ năng');
    } finally {
      setLoading(false);
    }
  }

  // Map mySkills theo skillId để tra nhanh
  const mySkillMap = useMemo(() => {
    const map = {};
    for (const ms of mySkills) {
      const id = ms.skill?._id || ms.skill;
      if (id) map[id] = ms;
    }
    return map;
  }, [mySkills]);

  // Click xem chi tiết kỹ năng
  const openSkillDetail = useCallback(async (skill) => {
    setSelectedSkill(skill);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/skills/${skill._id}`);
      setSkillDetail(data.data);
    } catch {
      toast.error('Không thể tải chi tiết kỹ năng');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  function closeDetail() {
    setSelectedSkill(null);
    setSkillDetail(null);
  }

  // Thêm skill tự khai báo
  async function handleAddSelfSkills() {
    if (selectedToAdd.length === 0) return;
    setAdding(true);
    try {
      const { data } = await api.post('/student/skills/self', { skillIds: selectedToAdd });
      setMySkills(data.data || []);
      toast.success(`Đã thêm ${selectedToAdd.length} kỹ năng`);
      setShowAddSkill(false);
      setSelectedToAdd([]);
      setAddSearch('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi');
    } finally {
      setAdding(false);
    }
  }

  // Xóa skill tự khai báo
  async function handleRemoveSelfSkill(skillId) {
    try {
      const { data } = await api.delete(`/student/skills/self/${skillId}`);
      setMySkills(data.data || []);
      toast.success('Đã xóa kỹ năng');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi');
    }
  }

  // Sync từ hồ sơ học tập
  async function handleSyncAcademic() {
    setSyncing(true);
    try {
      const { data } = await api.post('/student/skills/sync-academic');
      setMySkills(data.data || []);
      toast.success(data.message || 'Đã đồng bộ kỹ năng');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi');
    } finally {
      setSyncing(false);
    }
  }

  // Group by category (với filter)
  const filtered = skills.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
    return matchSearch && matchCat;
  });
  const grouped = {};
  for (const skill of filtered) {
    const cat = skill.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(skill);
  }

  // All categories in skills list
  const allCategories = [...new Set(skills.map(s => s.category).filter(Boolean))];

  // Stats
  const totalSkills = skills.length;
  const verifiedSkills = mySkills.filter(s => s.isVerified);
  const selfSkills = mySkills.filter(s => !s.isVerified);
  const roadmapSkills = mySkills.filter(s => s.sources?.includes('roadmap'));
  const academicSkills = mySkills.filter(s => s.sources?.includes('academic'));

  const learnedSkillIds = Object.keys(skillProgress).filter(id => skillProgress[id]?.completed > 0);
  const learnedCount = learnedSkillIds.length;

  // Top skills cho biểu đồ
  const chartSkills = useMemo(() => {
    return skills
      .filter(s => skillProgress[s._id])
      .map(s => ({
        ...s,
        percent: Math.round((skillProgress[s._id].completed / skillProgress[s._id].total) * 100),
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 10);
  }, [skills, skillProgress]);

  function getProgressColor(pct) {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-primary';
    if (pct >= 20) return 'bg-amber-500';
    return 'bg-muted-foreground/30';
  }

  // Kỹ năng chưa thêm (cho picker)
  const availableToAdd = skills.filter(s => {
    const id = s._id;
    return !mySkillMap[id] && (!addSearch || s.name.toLowerCase().includes(addSearch.toLowerCase()));
  });

  if (loading) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="h-32 skeleton rounded-2xl" />
        <div className="h-12 skeleton rounded-xl" />
        <div className="h-48 skeleton rounded-xl" />
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/8 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Skill Map</span>
            </div>
            <p className="text-muted-foreground text-sm mt-1.5">
              Tổng quan <strong className="text-foreground">{totalSkills}</strong> kỹ năng &bull;&nbsp;
              <strong className="text-foreground">{mySkills.length}</strong> kỹ năng của tôi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleSyncAcademic} disabled={syncing}>
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Sync từ HSHT
            </Button>
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowAddSkill(true)}>
              <Plus className="w-3.5 h-3.5" /> Thêm kỹ năng
            </Button>
          </div>
        </div>
      </div>

      {/* ── Search + Category Filter ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm kỹ năng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="relative shrink-0" ref={categoryMenuRef}>
          <button
            onClick={() => setShowCategoryMenu(v => !v)}
            className={`h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all min-w-[160px] ${showCategoryMenu
              ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1'
              : 'border-input bg-background text-foreground hover:border-primary/60'
              }`}
          >
            <span className="flex-1 text-left truncate">
              {categoryFilter === 'all' ? 'Tất cả danh mục' : (categoryLabels[categoryFilter] || categoryFilter)}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${showCategoryMenu ? 'rotate-180 text-primary' : 'text-muted-foreground'
              }`} />
          </button>

          {showCategoryMenu && (
            <div className="absolute right-0 top-full mt-1.5 z-30 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden w-52 animate-fade-in">
              <div className="py-1.5 max-h-72 overflow-y-auto">
                {[{ value: 'all', label: 'Tất cả danh mục' }, ...allCategories.map(cat => ({ value: cat, label: categoryLabels[cat] || cat }))].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => { setCategoryFilter(value); setShowCategoryMenu(false); }}
                    className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${categoryFilter === value
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-foreground hover:bg-muted/50'
                      }`}
                  >
                    {categoryFilter === value && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    <span className={categoryFilter === value ? '' : 'ml-3.5'}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Chi tiết kỹ năng (collapsible) ── */}
      {(mySkills.length > 0 || chartSkills.length > 0) && (
        <div className="rounded-xl border bg-card overflow-hidden">

          {/* Toggle header */}
          <button
            onClick={() => setShowMyDetails(v => !v)}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Chi Tiết Kỹ Năng</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap mt-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/8 text-primary">
                  <Shield className="w-2.5 h-2.5" /> {mySkills.length} kỹ năng
                </span>
                {verifiedSkills.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="w-2.5 h-2.5" /> {verifiedSkills.length} xác thực
                  </span>
                )}
                {chartSkills.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                    <BarChart3 className="w-2.5 h-2.5" /> {chartSkills.length} đang học
                  </span>
                )}
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 shrink-0 ${showMyDetails ? 'rotate-180' : ''}`} />
          </button>

          {showMyDetails && (
            <div className="border-t divide-y divide-border/50">

              {/* ── Kỹ năng của tôi ── */}
              {mySkills.length > 0 && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-primary shrink-0" />
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-foreground">Kỹ năng của tôi</span>
                  </div>

                  {/* Stats 3 cột */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-4 text-center">
                      <Route className="w-8 h-8 text-emerald-500/20 absolute -bottom-1 -right-1" />
                      <span className="text-[11px] font-medium text-emerald-600 block mb-1.5">Lộ Trình</span>
                      <p className="text-3xl font-bold text-emerald-600">{roadmapSkills.length}</p>
                    </div>
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 p-4 text-center">
                      <GraduationCap className="w-8 h-8 text-amber-500/20 absolute -bottom-1 -right-1" />
                      <span className="text-[11px] font-medium text-amber-600 block mb-1.5">Học Phần</span>
                      <p className="text-3xl font-bold text-amber-600">{academicSkills.length}</p>
                    </div>
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-muted/60 to-muted/20 border p-4 text-center">
                      <User className="w-8 h-8 text-muted-foreground/20 absolute -bottom-1 -right-1" />
                      <span className="text-[11px] font-medium text-muted-foreground block mb-1.5">Tự Khai Báo</span>
                      <p className="text-3xl font-bold">{selfSkills.length}</p>
                    </div>
                  </div>

                  {/* Skill pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {mySkills.map(ms => {
                      const skill = ms.skill;
                      if (!skill) return null;
                      const primary = ms.sources?.[0] || 'self';
                      const SrcIcon = sourceIcons[primary];
                      return (
                        <div key={skill._id + primary}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:shadow-sm ${sourceColors[primary]}`}>
                          <SrcIcon className="w-2.5 h-2.5" />
                          <span>{skill.icon} {skill.name}</span>
                          {ms.isVerified && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />}
                          {primary === 'self' && (
                            <button onClick={e => { e.stopPropagation(); handleRemoveSelfSkill(skill._id); }}
                              className="hover:text-red-500 transition-colors ml-0.5 rounded-full hover:bg-red-500/10 p-0.5 -mr-0.5">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Tiến độ kỹ năng ── */}
              {chartSkills.length > 0 && (
                <div className="p-5 space-y-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 rounded-full bg-amber-500 shrink-0" />
                    <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-foreground">Tiến độ kỹ năng</span>
                    <span className="ml-auto text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">Top {chartSkills.length}</span>
                  </div>
                  {chartSkills.map((skill, idx) => {
                    const prog = skillProgress[skill._id];
                    const pct = skill.percent;
                    const rankColor = idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-400 text-white' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-muted text-muted-foreground';
                    return (
                      <button
                        key={skill._id}
                        onClick={() => openSkillDetail(skill)}
                        className="w-full flex items-center gap-3 group hover:bg-muted/30 rounded-xl px-3 py-2.5 transition-colors text-left"
                      >
                        <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${rankColor}`}>
                          {idx + 1}
                        </span>
                        <span className="text-base shrink-0">{skill.icon || '📘'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                              {skill.name}
                            </span>
                            <span className={`text-[10px] font-bold shrink-0 ${pct === 100 ? 'text-emerald-500' : 'text-foreground'}`}>
                              {pct}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${getProgressColor(pct)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{prog.completed}/{prog.total} buổi</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary shrink-0 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Skill Groups ── */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, catSkills]) => {
          const learnedInCat = catSkills.filter(s => mySkillMap[s._id]).length;
          const pctCat = catSkills.length > 0 ? Math.round((learnedInCat / catSkills.length) * 100) : 0;
          return (
            <div key={category} className="rounded-xl border bg-card overflow-hidden">
              {/* Category header */}
              <div className="flex items-center gap-3 px-5 py-3.5 bg-muted/20 border-b">
                <span className="text-xl">{categoryIcons[category] || '📘'}</span>
                <h3 className="font-semibold text-sm flex-1">
                  {categoryLabels[category] || category}
                </h3>
                {/* Mini progress */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:flex items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pctCat}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{pctCat}%</span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full font-medium">
                    {learnedInCat}/{catSkills.length}
                  </span>
                </div>
              </div>

              {/* Skill cards grid */}
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                  {catSkills.map((skill) => {
                    const prog = skillProgress[skill._id];
                    const pct = prog ? Math.round((prog.completed / prog.total) * 100) : 0;
                    const hasProgress = !!prog;
                    const isCompleted = pct === 100;
                    const ms = mySkillMap[skill._id];
                    const isOwned = !!ms;

                    return (
                      <button
                        key={skill._id}
                        onClick={() => openSkillDetail(skill)}
                        className={`relative rounded-xl border p-3.5 text-center transition-all duration-200 cursor-pointer group hover:shadow-md ${isOwned && ms.isVerified
                          ? 'border-emerald-500/30 bg-emerald-500/[0.04] shadow-sm hover:border-emerald-500/50'
                          : isOwned
                            ? 'border-primary/30 bg-primary/[0.04] shadow-sm hover:border-primary/50'
                            : hasProgress
                              ? 'border-primary/20 bg-primary/[0.02] hover:border-primary/40'
                              : 'hover:border-muted-foreground/30'
                          }`}
                      >
                        {/* Badge trạng thái */}
                        {isOwned && ms.isVerified && (
                          <div className="absolute -top-1.5 -right-1.5">
                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                        {isOwned && !ms.isVerified && (
                          <div className="absolute -top-1.5 -right-1.5">
                            <div className="w-5 h-5 rounded-full bg-muted-foreground/80 flex items-center justify-center shadow-sm">
                              <User className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                        {!isOwned && hasProgress && (
                          <div className="absolute -top-1.5 -right-1.5">
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
                              <span className="text-[9px] font-bold text-white">{pct}%</span>
                            </div>
                          </div>
                        )}

                        <span className="text-2xl block mb-1.5">{skill.icon || '📘'}</span>
                        <p className={`text-xs font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2 ${isOwned && ms.isVerified ? 'text-emerald-600' : isOwned ? 'text-primary' : ''
                          }`}>
                          {skill.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{skill.estimatedHours}h</p>

                        {/* Source indicator */}
                        {isOwned && ms.sources && (
                          <div className="flex items-center justify-center gap-0.5 mt-1.5">
                            {ms.sources.map(src => {
                              const Ic = sourceIcons[src];
                              return <Ic key={src} className={`w-2.5 h-2.5 ${src === 'self' ? 'text-muted-foreground' : 'text-emerald-500'}`} />;
                            })}
                          </div>
                        )}

                        {/* Mini progress bar */}
                        {hasProgress && (
                          <div className="h-1 bg-muted/40 rounded-full overflow-hidden mt-2">
                            <div
                              className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Self-Skill Dialog */}
      <Dialog open={showAddSkill} onClose={() => setShowAddSkill(false)} className="max-w-xl">
        <DialogHeader onClose={() => setShowAddSkill(false)}>
          Thêm kỹ năng tự khai báo
        </DialogHeader>
        <DialogBody className="space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-muted-foreground">
            Kỹ năng tự khai báo sẽ <strong>không được highlight</strong> trên CV. Chỉ kỹ năng từ lộ trình hoàn thành hoặc học phần điểm cao mới được xác thực.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={addSearch} onChange={(e) => setAddSearch(e.target.value)}
              placeholder="Tìm kỹ năng..." className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableToAdd.map(skill => (
              <button key={skill._id} type="button"
                onClick={() => setSelectedToAdd(prev =>
                  prev.includes(skill._id)
                    ? prev.filter(id => id !== skill._id)
                    : [...prev, skill._id]
                )}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedToAdd.includes(skill._id)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/60'
                  }`}>
                {skill.icon} {skill.name}
              </button>
            ))}
            {availableToAdd.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center w-full">
                {addSearch ? 'Không tìm thấy kỹ năng' : 'Đã thêm tất cả kỹ năng'}
              </p>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => { setShowAddSkill(false); setSelectedToAdd([]); }}>Hủy</Button>
          <Button size="sm" disabled={adding || selectedToAdd.length === 0} onClick={handleAddSelfSkills}>
            {adding ? 'Đang thêm...' : `Thêm ${selectedToAdd.length} kỹ năng`}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Skill Detail Dialog */}
      <Dialog open={!!selectedSkill} onClose={closeDetail} className="max-w-lg">
        <DialogHeader onClose={closeDetail}>Chi tiết kỹ năng</DialogHeader>
        <DialogBody className="max-h-[70vh] overflow-y-auto">
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : skillDetail ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-3xl shrink-0">
                  {skillDetail.icon || '📘'}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{skillDetail.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {categoryLabels[skillDetail.category] || skillDetail.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {skillDetail.estimatedHours}h
                    </span>
                  </div>
                </div>
                {/* Progress circle */}
                {skillProgress[skillDetail._id] && (() => {
                  const prog = skillProgress[skillDetail._id];
                  const pct = Math.round((prog.completed / prog.total) * 100);
                  return (
                    <div className="text-center shrink-0">
                      <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${pct === 100 ? 'border-emerald-500 text-emerald-600' : 'border-primary text-primary'
                        }`}>
                        <span className="text-sm font-bold">{pct}%</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {prog.completed}/{prog.total}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Ownership info */}
              {mySkillMap[skillDetail._id] && (
                <div className="rounded-lg border p-3 bg-muted/10">
                  <p className="text-xs font-medium mb-1">Nguồn kỹ năng</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mySkillMap[skillDetail._id].sources?.map(src => {
                      const Ic = sourceIcons[src];
                      return (
                        <div key={src} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${sourceColors[src]}`}>
                          <Ic className="w-3 h-3" /> {sourceLabels[src]}
                          {src !== 'self' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                        </div>
                      );
                    })}
                  </div>
                  {mySkillMap[skillDetail._id].metadata?.courseCode && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Từ HP: {mySkillMap[skillDetail._id].metadata.courseCode} — {mySkillMap[skillDetail._id].metadata.courseName} (Điểm: {mySkillMap[skillDetail._id].metadata.grade})
                    </p>
                  )}
                </div>
              )}

              {/* Description */}
              {skillDetail.description && (
                <p className="text-sm text-muted-foreground">{skillDetail.description}</p>
              )}

              {/* Resources */}
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Tài nguyên ({skillDetail.linkedResources?.length || 0})
                </h4>
                {(!skillDetail.linkedResources || skillDetail.linkedResources.length === 0) ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <BookOpen className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Chưa có tài nguyên</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {['content', 'exercise', 'test'].map(type => {
                      const resources = skillDetail.linkedResources.filter(r => r.type === type);
                      if (!resources.length) return null;
                      const TypeIcon = resourceTypeIcons[type];
                      return (
                        <div key={type}>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                            {resourceTypeLabels[type]} ({resources.length})
                          </p>
                          <div className="space-y-1.5">
                            {resources.map(res => (
                              <div
                                key={res._id}
                                className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/20 transition-colors group"
                              >
                                <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${type === 'content' ? 'bg-blue-500/10 text-blue-500'
                                  : type === 'exercise' ? 'bg-amber-500/10 text-amber-500'
                                    : 'bg-emerald-500/10 text-emerald-500'
                                  }`}>
                                  <TypeIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{res.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {res.category && (
                                      <span className="text-[10px] text-muted-foreground">
                                        {categoryFormatLabels[res.category] || res.category}
                                      </span>
                                    )}
                                    <Badge variant={difficultyColors[res.difficulty]} className="text-[9px] px-1 py-0">
                                      {difficultyLabels[res.difficulty]}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5" /> {res.estimatedMinutes}p
                                    </span>
                                    {res.isFeatured && (
                                      <Badge variant="warning" className="text-[9px] px-1 py-0">⭐</Badge>
                                    )}
                                  </div>
                                </div>
                                {res.url && (
                                  <a
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors shrink-0"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                                {type === 'test' && res.testQuestions?.length > 0 && (
                                  <span className="text-[10px] text-muted-foreground shrink-0">
                                    {res.testQuestions.length} câu
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogBody>
      </Dialog>
    </div>
  );
}



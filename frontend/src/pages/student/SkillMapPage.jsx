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
  Clock, BarChart3, ChevronRight, Play, HelpCircle, X,
  Plus, Shield, GraduationCap, Route, User, RefreshCw, Trash2,
  CheckCircle2, Star,
} from 'lucide-react';

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
  academic: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
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

  // Group by category
  const filtered = skills.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );
  const grouped = {};
  for (const skill of filtered) {
    const cat = skill.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(skill);
  }

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
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Skill Map</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tổng quan {totalSkills} kỹ năng • {mySkills.length} kỹ năng của tôi
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

      {/* My Skills Summary */}
      {mySkills.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-muted/20 border-b">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Kỹ năng của tôi</h3>
            <span className="text-xs text-muted-foreground ml-auto">
              {verifiedSkills.length} xác thực • {selfSkills.length} tự khai báo
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 p-4 border-b">
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1"><Route className="w-3.5 h-3.5 text-emerald-600" /><span className="text-xs font-medium text-emerald-600">Lộ trình</span></div>
              <p className="text-xl font-bold text-emerald-600">{roadmapSkills.length}</p>
            </div>
            <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1"><GraduationCap className="w-3.5 h-3.5 text-blue-600" /><span className="text-xs font-medium text-blue-600">Học phần</span></div>
              <p className="text-xl font-bold text-blue-600">{academicSkills.length}</p>
            </div>
            <div className="rounded-lg bg-muted/30 border p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1"><User className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">Tự khai báo</span></div>
              <p className="text-xl font-bold">{selfSkills.length}</p>
            </div>
          </div>

          {/* Skill pills */}
          <div className="p-4">
            <div className="flex flex-wrap gap-1.5">
              {mySkills.map((ms) => {
                const skill = ms.skill;
                if (!skill) return null;
                const primary = ms.sources?.[0] || 'self';
                const SrcIcon = sourceIcons[primary];
                return (
                  <div key={skill._id + primary}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${sourceColors[primary]}`}>
                    <SrcIcon className="w-3 h-3" />
                    <span>{skill.icon} {skill.name}</span>
                    {ms.isVerified && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                    {primary === 'self' && (
                      <button onClick={(e) => { e.stopPropagation(); handleRemoveSelfSkill(skill._id); }}
                        className="hover:text-red-500 transition-colors ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Biểu đồ kỹ năng */}
      {chartSkills.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-muted/20 border-b">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Tiến độ kỹ năng</h3>
            <span className="text-xs text-muted-foreground ml-auto">Top {chartSkills.length} kỹ năng đang học</span>
          </div>
          <div className="p-5 space-y-3">
            {chartSkills.map(skill => {
              const prog = skillProgress[skill._id];
              const pct = skill.percent;
              return (
                <button
                  key={skill._id}
                  onClick={() => openSkillDetail(skill)}
                  className="w-full flex items-center gap-3 group hover:bg-muted/20 rounded-lg px-2 py-1.5 -mx-2 transition-colors text-left"
                >
                  <span className="text-lg shrink-0">{skill.icon || '📘'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {skill.name}
                      </span>
                      <span className={`text-xs font-semibold ml-2 ${pct === 100 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {prog.completed}/{prog.total} buổi học
                      </span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="rounded-xl border bg-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kỹ năng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Skill Groups */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, catSkills]) => {
          const learnedInCat = catSkills.filter(s => mySkillMap[s._id]).length;
          return (
            <div key={category} className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-muted/20 border-b">
                <span className="text-lg">{categoryIcons[category] || '📘'}</span>
                <h3 className="font-semibold text-sm">
                  {categoryLabels[category] || category}
                </h3>
                <span className="text-xs text-muted-foreground ml-auto">
                  {learnedInCat}/{catSkills.length}
                </span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
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
                        className={`relative rounded-lg border p-3 text-center transition-all cursor-pointer group ${isOwned && ms.isVerified
                          ? 'border-emerald-500/30 bg-emerald-500/[0.04] shadow-sm'
                          : isOwned
                            ? 'border-primary/30 bg-primary/[0.04] shadow-sm'
                            : hasProgress
                              ? 'border-primary/20 bg-primary/[0.02]'
                              : 'hover:border-muted-foreground/30 hover:shadow-sm'
                          }`}
                      >
                        {/* Badge trạng thái */}
                        {isOwned && ms.isVerified && (
                          <div className="absolute -top-1 -right-1">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                        )}
                        {isOwned && !ms.isVerified && (
                          <div className="absolute -top-1 -right-1">
                            <div className="w-4 h-4 rounded-full bg-muted-foreground flex items-center justify-center">
                              <User className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                        )}
                        {!isOwned && hasProgress && (
                          <div className="absolute -top-1 -right-1">
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white">{pct}%</span>
                            </div>
                          </div>
                        )}

                        <span className="text-2xl block mb-1">{skill.icon || '📘'}</span>
                        <p className={`text-xs font-medium truncate group-hover:text-primary transition-colors ${
                          isOwned && ms.isVerified ? 'text-emerald-600' : isOwned ? 'text-primary' : ''
                        }`}>
                          {skill.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{skill.estimatedHours}h</p>

                        {/* Source indicator */}
                        {isOwned && ms.sources && (
                          <div className="flex items-center justify-center gap-0.5 mt-1">
                            {ms.sources.map(src => {
                              const Ic = sourceIcons[src];
                              return <Ic key={src} className={`w-2.5 h-2.5 ${src === 'self' ? 'text-muted-foreground' : 'text-emerald-500'}`} />;
                            })}
                          </div>
                        )}

                        {/* Mini progress bar */}
                        {hasProgress && (
                          <div className="h-1 bg-muted/40 rounded-full overflow-hidden mt-1.5">
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
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedToAdd.includes(skill._id)
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
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-3xl">
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
                {/* Progress */}
                {skillProgress[skillDetail._id] && (() => {
                  const prog = skillProgress[skillDetail._id];
                  const pct = Math.round((prog.completed / prog.total) * 100);
                  return (
                    <div className="text-center">
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
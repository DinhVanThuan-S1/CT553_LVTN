/**
 * SkillMapPage - Bản đồ kỹ năng
 * Hiển thị tất cả kỹ năng theo nhóm + mức độ thành thạo
 * + Biểu đồ kỹ năng + Click xem chi tiết + tài nguyên
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog, DialogHeader, DialogBody } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
  Search, Loader2, Zap, BookOpen, ExternalLink, FileText,
  Clock, BarChart3, ChevronRight, Play, HelpCircle, X,
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
};

const categoryIcons = {
  programming: '💻', frontend: '🌐', backend: '⚙️', database: '📊',
  devops: '🐳', mobile: '📱', ai_ml: '🤖', software_engineering: '🏗️',
  networking: '🔒', soft_skills: '🤝',
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

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [skillsRes, roadmapsRes] = await Promise.all([
        api.get('/skills/all'),
        api.get('/student/my-roadmaps'),
      ]);
      setSkills(skillsRes.data.data);

      // Tính % hoàn thành cho mỗi kỹ năng
      const progress = {};
      (roadmapsRes.data.data || []).forEach((pr) => {
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
  const learnedSkillIds = Object.keys(skillProgress).filter(id => skillProgress[id]?.completed > 0);
  const learnedCount = learnedSkillIds.length;
  const inProgressCount = Object.keys(skillProgress).filter(id =>
    skillProgress[id]?.total > 0 && skillProgress[id]?.completed < skillProgress[id]?.total
  ).length;

  // Top skills cho biểu đồ (lấy skill đang học/đã học)
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
            Tổng quan {totalSkills} kỹ năng • {learnedCount} đã học • {inProgressCount} đang học
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" className="gap-1">
            <Zap className="w-3 h-3" /> {learnedCount} skill
          </Badge>
        </div>
      </div>

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
          const learnedInCat = catSkills.filter(s => skillProgress[s._id]?.completed > 0).length;
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

                    return (
                      <button
                        key={skill._id}
                        onClick={() => openSkillDetail(skill)}
                        className={`relative rounded-lg border p-3 text-center transition-all cursor-pointer group ${
                          isCompleted
                            ? 'border-emerald-500/30 bg-emerald-500/[0.04] shadow-sm'
                            : hasProgress
                              ? 'border-primary/30 bg-primary/[0.04] shadow-sm'
                              : 'hover:border-muted-foreground/30 hover:shadow-sm'
                        }`}
                      >
                        {/* Badge trạng thái */}
                        {isCompleted && (
                          <div className="absolute -top-1 -right-1">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Zap className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                        )}
                        {hasProgress && !isCompleted && (
                          <div className="absolute -top-1 -right-1">
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white">{pct}%</span>
                            </div>
                          </div>
                        )}

                        <span className="text-2xl block mb-1">{skill.icon || '📘'}</span>
                        <p className={`text-xs font-medium truncate group-hover:text-primary transition-colors ${
                          isCompleted ? 'text-emerald-600' : hasProgress ? 'text-primary' : ''
                        }`}>
                          {skill.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{skill.estimatedHours}h</p>

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
                      <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${
                        pct === 100 ? 'border-emerald-500 text-emerald-600' : 'border-primary text-primary'
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
                    {/* Nhóm theo type */}
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
                                <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                                  type === 'content' ? 'bg-blue-500/10 text-blue-500'
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

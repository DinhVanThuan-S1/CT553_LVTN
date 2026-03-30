/**
 * SkillMapPage - Bản đồ kỹ năng
 * Hiển thị tất cả kỹ năng theo nhóm + mức độ thành thạo
 */
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { Search, Loader2, Target, BookOpen, Zap, Award } from 'lucide-react';

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
  programming: '💻',
  frontend: '🌐',
  backend: '⚙️',
  database: '📊',
  devops: '🐳',
  mobile: '📱',
  ai_ml: '🤖',
  software_engineering: '🏗️',
  networking: '🔒',
  soft_skills: '🤝',
};

export default function SkillMapPage() {
  const toast = useToast();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [learnedSkills, setLearnedSkills] = useState(new Set());

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [skillsRes, roadmapsRes] = await Promise.all([
        api.get('/skills/all'),
        api.get('/student/my-roadmaps'),
      ]);
      setSkills(skillsRes.data.data);

      // Collect all skills from enrolled roadmaps
      const learned = new Set();
      (roadmapsRes.data.data || []).forEach((pr) => {
        (pr.sessions || [])
          .filter((s) => s.status === 'completed')
          .forEach((s) => {
            if (s.skill?._id) learned.add(s.skill._id);
            else if (s.skill) learned.add(s.skill);
          });
      });
      setLearnedSkills(learned);
    } catch {
      toast.error('Không thể tải kỹ năng');
    } finally {
      setLoading(false);
    }
  }

  // Group by category
  const grouped = {};
  const filtered = skills.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );
  for (const skill of filtered) {
    const cat = skill.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(skill);
  }

  const totalSkills = skills.length;
  const learnedCount = learnedSkills.size;

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
            Tổng quan {totalSkills} kỹ năng • {learnedCount} đã học
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" className="gap-1">
            <Zap className="w-3 h-3" /> {learnedCount} skill
          </Badge>
        </div>
      </div>

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
        {Object.entries(grouped).map(([category, catSkills]) => (
          <div key={category} className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-muted/20 border-b">
              <span className="text-lg">{categoryIcons[category] || '📘'}</span>
              <h3 className="font-semibold text-sm">
                {categoryLabels[category] || category}
              </h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {catSkills.filter((s) => learnedSkills.has(s._id)).length}/{catSkills.length}
              </span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {catSkills.map((skill) => {
                  const isLearned = learnedSkills.has(skill._id);
                  return (
                    <div
                      key={skill._id}
                      className={`relative rounded-lg border p-3 text-center transition-all ${
                        isLearned
                          ? 'border-primary/30 bg-primary/[0.04] shadow-sm'
                          : 'hover:border-muted-foreground/20'
                      }`}
                    >
                      {isLearned && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <Zap className="w-2.5 h-2.5 text-white" />
                          </div>
                        </div>
                      )}
                      <span className="text-2xl block mb-1">{skill.icon || '📘'}</span>
                      <p className={`text-xs font-medium truncate ${isLearned ? 'text-primary' : ''}`}>
                        {skill.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{skill.estimatedHours}h</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

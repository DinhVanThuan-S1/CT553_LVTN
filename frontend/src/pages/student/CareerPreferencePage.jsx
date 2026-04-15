/**
 * CareerPreferencePage - Sở thích nghề nghiệp
 * Chọn hướng đi, khu vực, mức lương, loại hình
 */
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import {
  Target, MapPin, DollarSign, Briefcase, Building2,
  Save, X, Plus, Check, Star, StickyNote,
} from 'lucide-react';

const CAREER_OPTIONS = [
  'Frontend Developer', 'Backend Developer', 'Full-stack Developer',
  'Mobile Developer', 'Data Engineer', 'Data Scientist',
  'AI/ML Engineer', 'DevOps Engineer', 'QA/Tester',
  'UI/UX Designer', 'Project Manager', 'Business Analyst',
  'Cybersecurity Engineer', 'Game Developer', 'Embedded Systems',
];

const LOCATION_OPTIONS = [
  'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Huế', 'Nha Trang', 'Cần Thơ', 'Remote', 'Nước ngoài',
];

const JOB_TYPES = [
  { value: 'full-time', label: 'Toàn thời gian', desc: 'Cố định, 8h/ngày', emoji: '💼' },
  { value: 'part-time', label: 'Bán thời gian', desc: 'Linh hoạt giờ giấc', emoji: '⏰' },
  { value: 'internship', label: 'Thực tập', desc: 'Tích lũy kinh nghiệm', emoji: '🎓' },
  { value: 'freelance', label: 'Freelance', desc: 'Dự án tự do', emoji: '🚀' },
  { value: 'remote', label: 'Remote', desc: 'Làm việc từ xa', emoji: '🌐' },
];

export default function CareerPreferencePage() {
  const toast = useToast();
  const [pref, setPref] = useState({
    careerPaths: [],
    preferredLocations: [],
    expectedSalary: { min: 0, max: 0 },
    jobTypes: [],
    interestedCompanies: [],
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCompany, setNewCompany] = useState('');

  useEffect(() => { loadPref(); }, []);

  async function loadPref() {
    try {
      const { data } = await api.get('/student/career-preferences');
      if (data.data) setPref(data.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  function toggleCareer(career) {
    setPref(prev => ({
      ...prev,
      careerPaths: prev.careerPaths.includes(career)
        ? prev.careerPaths.filter(c => c !== career)
        : [...prev.careerPaths, career],
    }));
  }

  function toggleLocation(loc) {
    setPref(prev => ({
      ...prev,
      preferredLocations: prev.preferredLocations.includes(loc)
        ? prev.preferredLocations.filter(l => l !== loc)
        : [...prev.preferredLocations, loc],
    }));
  }

  function toggleJobType(type) {
    setPref(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter(t => t !== type)
        : [...prev.jobTypes, type],
    }));
  }

  function addCompany() {
    if (!newCompany.trim()) return;
    if (pref.interestedCompanies.includes(newCompany.trim())) return;
    setPref(prev => ({
      ...prev,
      interestedCompanies: [...prev.interestedCompanies, newCompany.trim()],
    }));
    setNewCompany('');
  }

  function removeCompany(company) {
    setPref(prev => ({
      ...prev,
      interestedCompanies: prev.interestedCompanies.filter(c => c !== company),
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { data } = await api.put('/student/career-preferences', pref);
      setPref(data.data);
      toast.success('Đã lưu sở thích nghề nghiệp');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="h-32 skeleton rounded-2xl" />
        {[1, 2, 3].map(i => <div key={i} className="h-28 skeleton rounded-xl" />)}
      </div>
    );
  }

  const totalSelected = pref.careerPaths.length + pref.preferredLocations.length + pref.jobTypes.length;

  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-rose-500/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Sở thích nghề nghiệp</span>
            </div>
            {/* <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sở Thích Nghề Nghiệp</h1> */}
            <p className="text-muted-foreground text-sm mt-1.5">
              Thiết lập để nhận gợi ý lộ trình và công việc phù hợp hơn.
            </p>

          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-md">
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      {/* ── Hướng nghề nghiệp ── */}
      <div className="rounded-xl border bg-card overflow-hidden border-l-4 border-l-primary/60">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Hướng nghề nghiệp</h2>
              <p className="text-xs text-muted-foreground">Chọn các hướng bạn quan tâm</p>
            </div>
          </div>
          {pref.careerPaths.length > 0 && (
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              {pref.careerPaths.length} đã chọn
            </span>
          )}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {CAREER_OPTIONS.map(career => {
              const selected = pref.careerPaths.includes(career);
              return (
                <button
                  key={career}
                  onClick={() => toggleCareer(career)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${selected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                    : 'border-border/70 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {career}
                  {selected && <Check className="w-3.5 h-3.5 opacity-80" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Khu vực làm việc ── */}
      <div className="rounded-xl border bg-card overflow-hidden border-l-4 border-l-emerald-500/60">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-emerald-500/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Khu vực làm việc</h2>
              <p className="text-xs text-muted-foreground">Nơi bạn muốn làm việc</p>
            </div>
          </div>
          {pref.preferredLocations.length > 0 && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              {pref.preferredLocations.length} đã chọn
            </span>
          )}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {LOCATION_OPTIONS.map(loc => {
              const selected = pref.preferredLocations.includes(loc);
              return (
                <button
                  key={loc}
                  onClick={() => toggleLocation(loc)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${selected
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20'
                    : 'border-border/70 hover:border-emerald-400/50 hover:bg-emerald-500/5 text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {loc}
                  {selected && <Check className="w-3.5 h-3.5 opacity-80" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Mức lương mong muốn ── */}
      <div className="rounded-xl border bg-card overflow-hidden border-l-4 border-l-amber-500/60">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-amber-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Mức lương mong muốn</h2>
              <p className="text-xs text-muted-foreground">Triệu VND / Tháng</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground shrink-0 w-7">Min</label>
              <Input
                type="number" min={0}
                value={pref.expectedSalary?.min || 0}
                onChange={e => setPref(prev => ({
                  ...prev,
                  expectedSalary: { ...prev.expectedSalary, min: Number(e.target.value) },
                }))}
                className="w-32"
              />
            </div>
            <span className="text-muted-foreground/50 text-sm">—</span>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground shrink-0 w-8">Max</label>
              <Input
                type="number" min={0}
                value={pref.expectedSalary?.max || 0}
                onChange={e => setPref(prev => ({
                  ...prev,
                  expectedSalary: { ...prev.expectedSalary, max: Number(e.target.value) },
                }))}
                className="w-32"
              />
            </div>
          </div>
          {(pref.expectedSalary?.min > 0 || pref.expectedSalary?.max > 0) && (
            <p className="text-xs text-amber-600 font-medium mt-3 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              Kỳ vọng: {pref.expectedSalary?.min || 0}M – {pref.expectedSalary?.max || 0}M VND / Tháng
            </p>
          )}
        </div>
      </div>

      {/* ── Loại hình công việc ── */}
      <div className="rounded-xl border bg-card overflow-hidden border-l-4 border-l-sky-500/60">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-sky-500/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-sky-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Loại hình công việc</h2>
              <p className="text-xs text-muted-foreground">Bạn muốn làm theo hình thức nào?</p>
            </div>
          </div>
          {pref.jobTypes.length > 0 && (
            <span className="text-xs font-bold text-sky-600 bg-sky-500/10 px-2.5 py-0.5 rounded-full">
              {pref.jobTypes.length} đã chọn
            </span>
          )}
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {JOB_TYPES.map(({ value, label, desc, emoji }) => {
              const selected = pref.jobTypes.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => toggleJobType(value)}
                  className={`relative flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-xl border text-center transition-all duration-150 ${selected
                    ? 'bg-sky-500/10 border-sky-500/50 text-sky-700 shadow-sm'
                    : 'border-border/70 hover:border-sky-400/40 hover:bg-sky-500/5 text-muted-foreground'
                    }`}
                >
                  {selected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <span className="text-xl">{emoji}</span>
                  <span className="text-xs font-semibold">{label}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Công ty quan tâm ── */}
      <div className="rounded-xl border bg-card overflow-hidden border-l-4 border-l-rose-500/60">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-rose-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Công ty quan tâm</h2>
              <p className="text-xs text-muted-foreground">Danh sách công ty bạn muốn làm việc</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={newCompany}
                onChange={e => setNewCompany(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCompany()}
                placeholder="Nhập tên công ty..."
                className="pl-9"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addCompany} className="gap-1.5">
              <Plus className="w-4 h-4" /> Thêm
            </Button>
          </div>
          {pref.interestedCompanies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {pref.interestedCompanies.map(company => (
                <span key={company} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-rose-500/5 border-rose-500/20 text-sm font-medium text-rose-700">
                  <Building2 className="w-3 h-3 opacity-60" />
                  {company}
                  <button
                    onClick={() => removeCompany(company)}
                    className="ml-0.5 text-rose-400 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/60">Chưa thêm công ty nào...</p>
          )}
        </div>
      </div>

      {/* ── Ghi chú ── */}
      <div className="rounded-xl border bg-card overflow-hidden border-l-4 border-l-violet-500/60">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-violet-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <StickyNote className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Ghi chú thêm</h2>
              <p className="text-xs text-muted-foreground">Mô tả thêm về mong muốn nghề nghiệp</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <Textarea
            value={pref.notes}
            onChange={e => setPref(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="VD: Tôi muốn làm trong môi trường startup, có cơ hội học hỏi về AI..."
            rows={3}
            className="resize-none"
          />
        </div>
      </div>


    </div>
  );
}

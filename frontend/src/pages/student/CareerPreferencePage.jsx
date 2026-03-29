/**
 * CareerPreferencePage - Sở thích nghề nghiệp
 * Chọn hướng đi, khu vực, mức lương, loại hình
 */
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { Target, MapPin, DollarSign, Briefcase, Building2, Save, X, Plus } from 'lucide-react';

const CAREER_OPTIONS = [
  'Frontend Developer', 'Backend Developer', 'Full-stack Developer',
  'Mobile Developer', 'Data Engineer', 'Data Scientist',
  'AI/ML Engineer', 'DevOps Engineer', 'QA/Tester',
  'UI/UX Designer', 'Project Manager', 'Business Analyst',
  'Cybersecurity Engineer', 'Game Developer', 'Embedded Systems',
];

const LOCATION_OPTIONS = [
  'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Remote', 'Nước ngoài',
];

const JOB_TYPES = [
  { value: 'full-time', label: 'Toàn thời gian' },
  { value: 'part-time', label: 'Bán thời gian' },
  { value: 'internship', label: 'Thực tập' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'remote', label: 'Remote' },
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

  useEffect(() => {
    loadPref();
  }, []);

  async function loadPref() {
    try {
      const { data } = await api.get('/student/career-preferences');
      if (data.data) setPref(data.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  function toggleCareer(career) {
    setPref((prev) => ({
      ...prev,
      careerPaths: prev.careerPaths.includes(career)
        ? prev.careerPaths.filter((c) => c !== career)
        : [...prev.careerPaths, career],
    }));
  }

  function toggleLocation(loc) {
    setPref((prev) => ({
      ...prev,
      preferredLocations: prev.preferredLocations.includes(loc)
        ? prev.preferredLocations.filter((l) => l !== loc)
        : [...prev.preferredLocations, loc],
    }));
  }

  function toggleJobType(type) {
    setPref((prev) => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter((t) => t !== type)
        : [...prev.jobTypes, type],
    }));
  }

  function addCompany() {
    if (!newCompany.trim()) return;
    setPref((prev) => ({
      ...prev,
      interestedCompanies: [...prev.interestedCompanies, newCompany.trim()],
    }));
    setNewCompany('');
  }

  function removeCompany(company) {
    setPref((prev) => ({
      ...prev,
      interestedCompanies: prev.interestedCompanies.filter((c) => c !== company),
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
        <h1 className="text-2xl font-bold">Sở thích Nghề nghiệp</h1>
        {[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sở thích Nghề nghiệp</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Thiết lập để nhận gợi ý lộ trình và công việc phù hợp hơn
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      {/* Hướng nghề nghiệp */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-1 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> Hướng nghề nghiệp
        </h2>
        <p className="text-xs text-muted-foreground mb-4">Chọn các hướng nghề nghiệp bạn quan tâm</p>
        <div className="flex flex-wrap gap-2">
          {CAREER_OPTIONS.map((career) => (
            <button
              key={career}
              onClick={() => toggleCareer(career)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                pref.careerPaths.includes(career)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-muted border-border'
              }`}
            >
              {career}
            </button>
          ))}
        </div>
      </div>

      {/* Khu vực */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-1 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-500" /> Khu vực làm việc
        </h2>
        <p className="text-xs text-muted-foreground mb-4">Nơi bạn muốn làm việc</p>
        <div className="flex flex-wrap gap-2">
          {LOCATION_OPTIONS.map((loc) => (
            <button
              key={loc}
              onClick={() => toggleLocation(loc)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                pref.preferredLocations.includes(loc)
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'hover:bg-muted border-border'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Mức lương */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-1 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-amber-500" /> Mức lương mong muốn
        </h2>
        <p className="text-xs text-muted-foreground mb-4">Đơn vị: triệu VNĐ/tháng</p>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Tối thiểu</label>
            <Input
              type="number" min={0}
              value={pref.expectedSalary?.min || 0}
              onChange={(e) => setPref((prev) => ({
                ...prev,
                expectedSalary: { ...prev.expectedSalary, min: Number(e.target.value) },
              }))}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Tối đa</label>
            <Input
              type="number" min={0}
              value={pref.expectedSalary?.max || 0}
              onChange={(e) => setPref((prev) => ({
                ...prev,
                expectedSalary: { ...prev.expectedSalary, max: Number(e.target.value) },
              }))}
            />
          </div>
        </div>
      </div>

      {/* Loại hình */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-1 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-cyan-500" /> Loại hình công việc
        </h2>
        <p className="text-xs text-muted-foreground mb-4">Bạn muốn làm kiểu gì?</p>
        <div className="flex flex-wrap gap-2">
          {JOB_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => toggleJobType(value)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                pref.jobTypes.includes(value)
                  ? 'bg-cyan-500 text-white border-cyan-500'
                  : 'hover:bg-muted border-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Công ty quan tâm */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-1 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-rose-500" /> Công ty quan tâm
        </h2>
        <p className="text-xs text-muted-foreground mb-4">Danh sách công ty bạn muốn làm việc</p>
        <div className="flex items-center gap-2 mb-3">
          <Input
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCompany()}
            placeholder="Nhập tên công ty..."
            className="max-w-xs"
          />
          <Button type="button" variant="outline" size="sm" onClick={addCompany}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {pref.interestedCompanies.map((company) => (
            <span key={company} className="inline-flex items-center gap-1 px-3 py-1 rounded-full border bg-muted/30 text-sm">
              {company}
              <button onClick={() => removeCompany(company)} className="text-muted-foreground hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Ghi chú */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-3">Ghi chú thêm</h2>
        <Textarea
          value={pref.notes}
          onChange={(e) => setPref((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Mô tả thêm về mong muốn nghề nghiệp..."
          rows={3}
        />
      </div>
    </div>
  );
}

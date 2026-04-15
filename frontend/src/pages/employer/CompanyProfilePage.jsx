/**
 * CompanyProfilePage - Hồ sơ công ty cho NTD
 */
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { useToast } from '../../components/ui/Toast';
import {
  Building2, Globe, Loader2, Save, Plus, X, MapPin,
  CheckCircle2, Image, Users, FileText, Briefcase,
} from 'lucide-react';

const sizeOptions = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

// ─── Field label ───────────────────────────────
function FieldLabel({ children, required }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

// ─── Section card ──────────────────────────────
function SectionCard({ icon: Icon, iconBg, iconColor, borderColor, headBg, title, subtitle, action, children }) {
  return (
    <div className={`rounded-2xl border bg-card overflow-hidden border-l-4 ${borderColor} flex flex-col h-full`}>
      <div className={`flex items-center gap-3 px-5 py-4 border-b ${headBg}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function CompanyProfilePage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', industry: '', website: '', logo: '', size: '1-10',
    addresses: [],
  });

  useEffect(() => { loadCompany(); }, []);

  async function loadCompany() {
    setLoading(true);
    try {
      const { data } = await api.get('/employer/company');
      if (data.data) {
        const c = data.data;
        setForm({
          name: c.name || '',
          description: c.description || '',
          industry: c.industry || '',
          website: c.website || '',
          logo: c.logo || '',
          size: c.size || '1-10',
          addresses: (c.addresses || []).map((a) => ({
            label: a.label || '', fullAddress: a.fullAddress || '',
            city: a.city || '', district: a.district || '',
            isHeadquarter: a.isHeadquarter || false,
          })),
        });
      }
    } catch {
      // No company yet, keep defaults
    } finally {
      setLoading(false);
    }
  }

  function addAddress() {
    setForm((f) => ({
      ...f,
      addresses: [...f.addresses, { label: '', fullAddress: '', city: '', district: '', isHeadquarter: false }],
    }));
  }
  function removeAddress(i) {
    setForm((f) => ({ ...f, addresses: f.addresses.filter((_, idx) => idx !== i) }));
  }
  function updateAddress(i, field, value) {
    setForm((f) => ({
      ...f,
      addresses: f.addresses.map((addr, idx) => idx === i ? { ...addr, [field]: value } : addr),
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Tên công ty không được trống'); return; }
    setSaving(true);
    try {
      await api.put('/employer/company', form);
      toast.success('Cập nhật hồ sơ công ty thành công');
      loadCompany();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-5">
        <div className="h-32 skeleton rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-80 skeleton rounded-2xl" />
          <div className="h-80 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  const hasLogo = !!form.logo;

  return (
    <div className="animate-fade-in space-y-5">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-teal-500/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-start gap-4">
          {/* Logo preview */}
          <div className="w-14 h-14 rounded-xl border-2 border-white/20 bg-card/50 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
            {hasLogo
              ? <img src={form.logo} alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              : <Building2 className="w-7 h-7 text-muted-foreground/40" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Hồ sơ công ty</span>
            </div>
            <h1 className="text-xl font-bold truncate">{form.name || 'Chưa thiết lập tên công ty'}</h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              {form.industry && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {form.industry}</span>}
              {form.size && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {form.size} nhân viên</span>}
              {form.website && (
                <a href={form.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline">
                  <Globe className="w-3 h-3" /> {form.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* ── 2-column: Basic Info + Addresses ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* Thông tin cơ bản */}
          <SectionCard
            icon={Building2} iconBg="bg-primary/10" iconColor="text-primary"
            borderColor="border-l-primary/40" headBg="bg-primary/5"
            title="Thông tin cơ bản"
            subtitle="Tên, ngành nghề, quy mô công ty"
          >
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Tên công ty</FieldLabel>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="VD: FPT Software"
                  />
                </div>
                <div>
                  <FieldLabel>Ngành nghề</FieldLabel>
                  <Input
                    value={form.industry}
                    onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                    placeholder="VD: Công nghệ thông tin"
                  />
                </div>
                <div>
                  <FieldLabel>Website</FieldLabel>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                    <Input
                      className="pl-8"
                      value={form.website}
                      onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Quy mô nhân sự</FieldLabel>
                  <CustomSelect
                    value={form.size}
                    onChange={(v) => setForm((f) => ({ ...f, size: v }))}
                    options={sizeOptions.map((s) => ({ value: s, label: `${s} nhân viên` }))}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Logo URL</FieldLabel>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                  <Input
                    className="pl-8"
                    value={form.logo}
                    onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                    placeholder="https://... (URL ảnh logo)"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Giới thiệu công ty</FieldLabel>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Mô tả về công ty, văn hóa làm việc, sản phẩm/dịch vụ..."
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">{form.description.length} ký tự</p>
              </div>
            </div>
          </SectionCard>

          {/* Địa chỉ */}
          <SectionCard
            icon={MapPin} iconBg="bg-emerald-500/10" iconColor="text-emerald-600"
            borderColor="border-l-emerald-400/50" headBg="bg-emerald-500/5"
            title={`Địa Chỉ [ ${form.addresses.length} ]`}
            subtitle="Trụ sở chính, chi nhánh công ty..."
            action={
              <Button type="button" variant="outline" size="sm" onClick={addAddress}
                className="gap-1.5 h-7 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
                <Plus className="w-3 h-3" /> Thêm
              </Button>
            }
          >
            <div className="p-4">
              {form.addresses.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/8 flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-6 h-6 text-emerald-500/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">Chưa có địa chỉ nào</p>
                  <button type="button" onClick={addAddress}
                    className="mt-2 text-xs text-emerald-600 hover:underline font-medium">
                    + Thêm địa chỉ đầu tiên
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.addresses.map((addr, i) => (
                    <div key={i} className={`rounded-xl border p-4 space-y-3 ${addr.isHeadquarter ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/60'}`}>
                      {/* Row header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-muted-foreground">Địa chỉ #{i + 1}</span>
                          {addr.isHeadquarter && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Trụ sở chính
                            </span>
                          )}
                        </div>
                        <button type="button" onClick={() => removeAddress(i)}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>Tên địa chỉ</FieldLabel>
                          <Input value={addr.label}
                            onChange={(e) => updateAddress(i, 'label', e.target.value)}
                            placeholder="VD: Trụ sở A" />
                        </div>
                        <div>
                          <FieldLabel>Thành phố</FieldLabel>
                          <Input value={addr.city}
                            onChange={(e) => updateAddress(i, 'city', e.target.value)}
                            placeholder="VD: Cần Thơ" />
                        </div>
                      </div>

                      <div>
                        <FieldLabel>Địa chỉ đầy đủ</FieldLabel>
                        <Input value={addr.fullAddress}
                          onChange={(e) => updateAddress(i, 'fullAddress', e.target.value)}
                          placeholder="Số nhà, đường, phường, quận..." />
                      </div>

                      <label className="flex items-center gap-2.5 cursor-pointer group w-fit">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${addr.isHeadquarter ? 'bg-emerald-500 border-emerald-500' : 'border-border group-hover:border-emerald-400'}`}>
                          {addr.isHeadquarter && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <input type="checkbox" className="sr-only" checked={addr.isHeadquarter}
                          onChange={(e) => updateAddress(i, 'isHeadquarter', e.target.checked)} />
                        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                          Đánh dấu là trụ sở chính
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* ── Save Button ── */}
        <Button type="submit" disabled={saving} className="gap-2 w-full h-11 text-sm font-semibold shadow-md">
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
            : <><Save className="w-4 h-4" /> Lưu hồ sơ công ty</>
          }
        </Button>
      </form>
    </div>
  );
}

/**
 * CompanyProfilePage - Hồ sơ công ty cho NTD
 */
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import {
  Building2, Globe, Loader2, Save, Plus, X, MapPin, CheckCircle2,
} from 'lucide-react';

const sizeOptions = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

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
            label: a.label || '', fullAddress: a.fullAddress || '', city: a.city || '', district: a.district || '', isHeadquarter: a.isHeadquarter || false,
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
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Hồ sơ Công ty</h1>
        <p className="text-muted-foreground text-sm mt-1">Thông tin công ty hiển thị trong tin tuyển dụng</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="font-medium text-sm flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-primary" /> Thông tin cơ bản
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Tên công ty *</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="VD: FPT Software" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ngành nghề</label>
              <Input value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                placeholder="VD: Công nghệ thông tin" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Website</label>
              <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Quy mô</label>
              <Select value={form.size} onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}>
                {sizeOptions.map((s) => <option key={s} value={s}>{s} nhân viên</option>)}
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Logo URL</label>
            <Input value={form.logo} onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
              placeholder="URL ảnh logo" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Giới thiệu công ty</label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4} placeholder="Mô tả về công ty, văn hóa, sản phẩm..." />
          </div>
        </div>

        {/* Addresses */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" /> Địa chỉ ({form.addresses.length})
            </h3>
            <Button type="button" variant="outline" size="sm" onClick={addAddress} className="text-xs gap-1">
              <Plus className="w-3 h-3" /> Thêm
            </Button>
          </div>
          {form.addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Chưa có địa chỉ nào</p>
          ) : (
            form.addresses.map((addr, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Địa chỉ #{i + 1}</span>
                    {addr.isHeadquarter && <Badge variant="success" className="text-[10px]">Trụ sở chính</Badge>}
                  </div>
                  <button type="button" onClick={() => removeAddress(i)} className="text-red-400 hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={addr.label} onChange={(e) => updateAddress(i, 'label', e.target.value)}
                    placeholder="Tên (VD: Trụ sở chính)" />
                  <Input value={addr.city} onChange={(e) => updateAddress(i, 'city', e.target.value)}
                    placeholder="Thành phố" />
                </div>
                <Input value={addr.fullAddress} onChange={(e) => updateAddress(i, 'fullAddress', e.target.value)}
                  placeholder="Địa chỉ đầy đủ" />
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={addr.isHeadquarter}
                    onChange={(e) => updateAddress(i, 'isHeadquarter', e.target.checked)} />
                  Trụ sở chính
                </label>
              </div>
            ))
          )}
        </div>

        <Button type="submit" disabled={saving} className="gap-2 w-full">
          <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu hồ sơ công ty'}
        </Button>
      </form>
    </div>
  );
}

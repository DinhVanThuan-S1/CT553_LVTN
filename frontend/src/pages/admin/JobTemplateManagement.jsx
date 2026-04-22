/**
 * JobTemplateManagement - QL Công việc mẫu (Admin)
 * CRUD mẫu công việc (JobTemplate) phục vụ gợi ý & so khớp
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog, DialogBody, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  Search, Plus, Pencil, Trash2, Eye, Briefcase,
  ChevronLeft, ChevronRight, Banknote, X, SlidersHorizontal, Check, ChevronDown, ArrowUpDown,
} from 'lucide-react';

const levelLabels = { beginner: 'Cơ bản', intermediate: 'Trung bình', advanced: 'Nâng cao' };
const levelStyles = {
  beginner: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-400/20' },
  intermediate: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-400/20' },
  advanced: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-400/20' },
};

function LevelBadge({ level }) {
  const label = levelLabels[level] || level;
  const c = levelStyles[level] || levelStyles.intermediate;
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
      {label}
    </span>
  );
}

const initialForm = {
  title: '', description: '', careerPath: '',
  salaryRange: { min: 0, max: 0 },
  requiredSkills: [],
};

export default function JobTemplateManagement() {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 15 });
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailTemplate, setDetailTemplate] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');
  const sortMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) setShowSortMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      params.sort = sortOrder === 'desc' ? '-createdAt' : 'createdAt';
      const { data } = await api.get('/admin/job-templates', { params });
      setTemplates(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, sortOrder]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  async function loadAllSkills() {
    if (allSkills.length > 0) return;
    try {
      const { data } = await api.get('/skills', { params: { limit: 200 } });
      setAllSkills(data.data);
    } catch { }
  }

  async function openDetail(tpl) {
    try {
      const { data } = await api.get(`/admin/job-templates/${tpl._id}`);
      setDetailTemplate(data.data);
      setShowDetail(true);
    } catch {
      toast.error('Không thể tải chi tiết');
    }
  }

  function openCreate() {
    loadAllSkills();
    setFormData(initialForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(tpl) {
    loadAllSkills();
    setFormData({
      title: tpl.title,
      description: tpl.description || '',
      careerPath: tpl.careerPath,
      salaryRange: tpl.salaryRange || { min: 0, max: 0 },
      requiredSkills: (tpl.requiredSkills || []).map((rs) => ({
        skill: rs.skill?._id || rs.skill,
        skillName: rs.skill?.name || '',
        level: rs.level || 'intermediate',
      })),
    });
    setEditingId(tpl._id);
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        salaryRange: {
          min: Number(formData.salaryRange.min),
          max: Number(formData.salaryRange.max),
        },
        requiredSkills: formData.requiredSkills.map((rs) => ({
          skill: rs.skill,
          level: rs.level,
        })),
      };
      if (editingId) {
        await api.put(`/admin/job-templates/${editingId}`, payload);
        toast.success('Cập nhật thành công');
      } else {
        await api.post('/admin/job-templates', payload);
        toast.success('Tạo mẫu công việc thành công');
      }
      setShowForm(false);
      loadTemplates();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(tpl) {
    setConfirmState({
      title: 'Xóa mẫu công việc',
      message: `Bạn có chắc muốn xóa mẫu “${tpl.title}”?`,
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        await api.delete(`/admin/job-templates/${tpl._id}`);
        toast.success('Đã xóa');
        loadTemplates();
      },
    });
  }

  function addSkillToForm(skillId) {
    if (formData.requiredSkills.some((s) => s.skill === skillId)) return;
    const skill = allSkills.find((s) => s._id === skillId);
    if (!skill) return;
    setFormData((f) => ({
      ...f,
      requiredSkills: [...f.requiredSkills, {
        skill: skill._id, skillName: skill.name, level: 'intermediate',
      }],
    }));
  }

  function removeSkillFromForm(index) {
    setFormData((f) => ({ ...f, requiredSkills: f.requiredSkills.filter((_, i) => i !== index) }));
  }

  return (
    <div className="animate-fade-in space-y-5">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-primary/8 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Quản Lý Công Việc Mẫu</span>
            </div>
            <p className="text-muted-foreground text-sm mt-1.5">
              Tổng <strong className="text-foreground">{pagination.total}</strong> mẫu • Phục vụ gợi ý - so khớp kỹ năng
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Thêm mẫu
          </Button>
        </div>
      </div>

      {/* ── Filter (search only) ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Tìm kiếm
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm công việc mẫu..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className="pl-9"
          />
        </div>

        {/* Sort dropdown */}
        <div className="relative shrink-0" ref={sortMenuRef}>
          <button
            type="button"
            onClick={() => setShowSortMenu(v => !v)}
            className={`h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all min-w-[148px] ${showSortMenu ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1' : 'border-input bg-background text-foreground hover:border-primary/60'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-left">{sortOrder === 'desc' ? 'Mới nhất' : 'Cũ nhất'}</span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${showSortMenu ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-full mt-1.5 z-30 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden w-40 animate-fade-in">
              <div className="py-1.5">
                {[{ value: 'desc', label: 'Mới nhất' }, { value: 'asc', label: 'Cũ nhất' }].map(({ value, label }) => (
                  <button key={value} type="button" onClick={() => { setSortOrder(value); setShowSortMenu(false); setPagination(p => ({ ...p, page: 1 })); }}
                    className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${sortOrder === value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted/50'}`}>
                    {sortOrder === value && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    <span className={sortOrder === value ? '' : 'ml-3.5'}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Công Việc</th>
                <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Hướng Nghề</th>
                <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-24">Kỹ Năng</th>
                <th className="text-center px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-30">Mức Lương</th>
                <th className="text-right px-4 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 skeleton rounded-lg shrink-0" />
                        <div className="h-4 w-36 skeleton rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><div className="h-4 w-28 skeleton rounded" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-6 w-7 skeleton rounded-full mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-4 w-20 skeleton rounded mx-auto" /></td>
                    <td className="px-4 py-3.5"><div className="h-7 w-20 skeleton rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Briefcase className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Chưa có mẫu công việc nào</p>
                    <p className="text-xs text-muted-foreground mt-1">Nhấn "Thêm mẫu" để bắt đầu</p>
                  </td>
                </tr>
              ) : (
                templates.map((tpl) => (
                  <tr key={tpl._id} className="border-b hover:bg-muted/20 transition-colors group">
                    {/* Công việc */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                          <Briefcase className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="font-medium group-hover:text-primary transition-colors">{tpl.title}</span>
                      </div>
                    </td>
                    {/* Hướng nghề */}
                    <td className="px-4 py-3.5 text-muted-foreground text-sm">{tpl.careerPath}</td>
                    {/* Kỹ năng */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/8 text-primary text-xs font-bold">
                        {tpl.requiredSkills?.length || 0}
                      </span>
                    </td>
                    {/* Mức lương */}
                    <td className="px-4 py-3.5 text-center">
                      {tpl.salaryRange?.min && tpl.salaryRange?.max ? (
                        <span className="text-xs font-medium text-muted-foreground">
                          {tpl.salaryRange.min}-{tpl.salaryRange.max}M
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(tpl)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary" title="Xem chi tiết">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(tpl)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Chỉnh sửa">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(tpl)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/10">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">{pagination.total}</strong> mẫu công việc • Trang {pagination.page}/{pagination.pages}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs px-2 font-medium">{pagination.page}</span>
              <Button variant="ghost" size="sm" disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onClose={() => setShowDetail(false)} className="max-w-lg">
        {/* Gradient header */}
        {detailTemplate && (
          <div className="relative overflow-hidden rounded-t-xl border-b bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5">
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 border border-primary/10">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground leading-tight">{detailTemplate.title}</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{detailTemplate.careerPath}</p>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)}
                className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Salary badge in header */}
            <div className="flex items-center gap-1.5 mt-3">
              <Banknote className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">
                {detailTemplate.salaryRange?.min && detailTemplate.salaryRange?.max
                  ? `${detailTemplate.salaryRange.min} - ${detailTemplate.salaryRange.max} triệu VNĐ/tháng`
                  : 'Chưa cập nhật mức lương'}
              </span>
            </div>
          </div>
        )}
        {detailTemplate && (
          <DialogBody className="space-y-4 max-h-[60vh] overflow-y-auto px-6 py-5">
            {/* Description */}
            {detailTemplate.description && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Mô tả</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-1">{detailTemplate.description}</p>
              </div>
            )}

            {/* Required Skills */}
            {(detailTemplate.requiredSkills?.length > 0) && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Kỹ năng yêu cầu</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {detailTemplate.requiredSkills.length}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-2">
                  {detailTemplate.requiredSkills.map((rs, i) => {
                    const lvl = levelStyles[rs.level] || levelStyles.intermediate;
                    return (
                      <div key={i} className={`flex items-center justify-between rounded-xl border bg-card p-3 border-l-4 ${rs.level === 'beginner' ? 'border-l-emerald-400' :
                        rs.level === 'advanced' ? 'border-l-red-400' : 'border-l-amber-400'
                        } hover:shadow-sm transition-shadow`}>
                        <span className="text-sm font-semibold">{rs.skill?.name || 'N/A'}</span>
                        <LevelBadge level={rs.level} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </DialogBody>
        )}
        <DialogFooter className="border-t bg-muted/20 rounded-b-xl px-6 py-4">
          <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Đóng</Button>
          {detailTemplate && (
            <Button size="sm" className="gap-2" onClick={() => { setShowDetail(false); openEdit(detailTemplate); }}>
              <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
            </Button>
          )}
        </DialogFooter>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} className="max-w-2xl">
        {/* Gradient header */}
        <div className="relative overflow-hidden rounded-t-xl border-b bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${editingId ? 'bg-amber-500/15 text-amber-600' : 'bg-primary/15 text-primary'
                }`}>
                {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground leading-tight">
                  {editingId ? 'Chỉnh sửa mẫu' : 'Thêm mẫu công việc'}
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {editingId ? 'Cập nhật thông tin mẫu công việc' : 'Tạo mẫu công việc mới cho hệ thống'}
                </p>
              </div>
            </div>
            <button onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <DialogBody className="space-y-5 max-h-[65vh] overflow-y-auto px-6 py-5">

            {/* Section: Thông tin cơ bản */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Thông tin cơ bản</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Tiêu đề */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <Input value={formData.title} required
                  onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Frontend Developer"
                  className="h-9" />
              </div>

              {/* Hướng nghề */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Hướng nghề nghiệp <span className="text-red-500">*</span>
                </label>
                <Input value={formData.careerPath} required
                  onChange={(e) => setFormData((f) => ({ ...f, careerPath: e.target.value }))}
                  placeholder="VD: Frontend Developer"
                  className="h-9" />
              </div>

              {/* Lương */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    <Banknote className="w-3 h-3 inline mr-1 text-emerald-500" />
                    Lương tối thiểu (triệu)
                  </label>
                  <Input type="number" min={0} value={formData.salaryRange.min}
                    onChange={(e) => setFormData((f) => ({ ...f, salaryRange: { ...f.salaryRange, min: e.target.value } }))}
                    className="h-9" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    <Banknote className="w-3 h-3 inline mr-1 text-emerald-500" />
                    Lương tối đa (triệu)
                  </label>
                  <Input type="number" min={0} value={formData.salaryRange.max}
                    onChange={(e) => setFormData((f) => ({ ...f, salaryRange: { ...f.salaryRange, max: e.target.value } }))}
                    className="h-9" />
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Mô tả</label>
                <Textarea value={formData.description} rows={2}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả về vị trí công việc..." />
              </div>
            </div>

            {/* Section: Kỹ năng yêu cầu */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Kỹ năng yêu cầu</span>
                {formData.requiredSkills.length > 0 && (
                  <span className="text-[10px] text-white bg-emerald-500 px-1.5 py-0.5 rounded-full">
                    {formData.requiredSkills.length}
                  </span>
                )}
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Skill picker */}
              <CustomSelect
                value=""
                onChange={v => { if (v) addSkillToForm(v); }}
                placeholder="+ Thêm kỹ năng..."
                options={allSkills
                  .filter(s => !formData.requiredSkills.some(rs => rs.skill === s._id))
                  .map(s => ({ value: s._id, label: `${s.icon || ''} ${s.name}` }))}
              />

              {/* Skill list */}
              <div className="space-y-2">
                {formData.requiredSkills.map((rs, i) => (
                  <div key={rs.skill} className="flex items-center gap-2.5 rounded-xl border p-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                    <span className="flex-1 text-sm font-semibold truncate">
                      {rs.skillName || allSkills.find(s => s._id === rs.skill)?.name || 'N/A'}
                    </span>
                    <CustomSelect
                      className="w-36 shrink-0"
                      value={rs.level}
                      onChange={v => setFormData(f => ({
                        ...f,
                        requiredSkills: f.requiredSkills.map((s, j) => j === i ? { ...s, level: v } : s),
                      }))}
                      options={[
                        { value: 'beginner', label: 'Cơ bản', color: 'bg-emerald-500' },
                        { value: 'intermediate', label: 'Trung bình', color: 'bg-amber-400' },
                        { value: 'advanced', label: 'Nâng cao', color: 'bg-red-500' },
                      ]}
                    />
                    <button type="button" onClick={() => removeSkillFromForm(i)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {formData.requiredSkills.length === 0 && (
                  <div className="text-center py-6 rounded-xl border border-dashed border-border/60">
                    <Briefcase className="w-6 h-6 text-muted-foreground/20 mx-auto mb-1.5" />
                    <p className="text-xs text-muted-foreground">Chọn kỹ năng từ dropdown phía trên</p>
                  </div>
                )}
              </div>
            </div>

          </DialogBody>
          <DialogFooter className="border-t bg-muted/20 rounded-b-xl px-6 py-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button type="submit" size="sm" disabled={saving} className="gap-2 min-w-24">
              {saving ? (
                <><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
              ) : editingId ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
      <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}

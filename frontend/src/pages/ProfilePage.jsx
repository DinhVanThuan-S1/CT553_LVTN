/**
 * ProfilePage — Trang thông tin cá nhân (dùng chung cho student / employer / admin)
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import {
  User, Mail, Phone, MapPin, Shield, Calendar, Edit3,
  CheckCircle2, Briefcase, GraduationCap, Save, X, LogIn,
} from 'lucide-react';
import api from '../lib/api';

const roleConfig = {
  student: {
    label: 'Sinh viên',
    icon: GraduationCap,
    gradient: 'from-primary/15 via-primary/8 to-transparent',
    badge: 'text-primary bg-primary/10 border-primary/20',
    avatarGrad: 'from-primary to-teal-500',
    iconBg: 'bg-primary/10 text-primary',
  },
  employer: {
    label: 'Nhà tuyển dụng',
    icon: Briefcase,
    gradient: 'from-emerald-500/15 via-emerald-500/8 to-transparent',
    badge: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    avatarGrad: 'from-emerald-500 to-teal-500',
    iconBg: 'bg-emerald-500/10 text-emerald-600',
  },
  admin: {
    label: 'Quản trị viên',
    icon: Shield,
    gradient: 'from-rose-500/15 via-rose-500/8 to-transparent',
    badge: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
    avatarGrad: 'from-rose-500 to-orange-500',
    iconBg: 'bg-rose-500/10 text-rose-600',
  },
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', address: '' });
  const [extraInfo, setExtraInfo] = useState(null);

  const role = user?.role || 'student';
  const config = roleConfig[role] || roleConfig.student;
  const RoleIcon = config.icon;

  useEffect(() => {
    if (user) setForm({ fullName: user.fullName || '', phone: user.phone || '', address: user.address || '' });
    fetchExtraInfo();
  }, [user]);

  const fetchExtraInfo = async () => {
    try {
      if (role === 'student') {
        const { data } = await api.get('/student/academic-profile');
        if (data.success) setExtraInfo(data.data);
      } else if (role === 'employer') {
        const { data } = await api.get('/employer/company');
        if (data.success) setExtraInfo(data.data);
      }
    } catch { /* ignore */ }
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) { toast.error('Họ tên không được để trống'); return; }
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      if (data.success) { updateUser(data.data.user); setEditing(false); toast.success('Cập nhật thành công!'); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setSaving(false); }
  };

  const handleCancel = () => {
    setForm({ fullName: user?.fullName || '', phone: user?.phone || '', address: user?.address || '' });
    setEditing(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-5">

      {/* ── Hero Header Card ── */}
      <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${config.gradient} p-6`}>
        {/* Decorative orb */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />

        <div className="relative flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.avatarGrad} flex items-center justify-center shadow-lg ring-4 ring-background`}>
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                : <span className="text-3xl font-bold text-white">{user?.fullName?.charAt(0)?.toUpperCase() || 'U'}</span>
              }
            </div>
            {user?.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate mb-0.5">{user?.fullName}</h1>
            <p className="text-sm text-muted-foreground mb-2.5">{user?.email}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${config.badge}`}>
                <RoleIcon className="w-3.5 h-3.5" /> {config.label}
              </span>
              {user?.isActive
                ? <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">Đang hoạt động</span>
                : <span className="text-xs font-medium text-red-600 bg-red-500/10 border border-red-300/30 px-2.5 py-1 rounded-full">Đã bị khóa</span>
              }
            </div>
          </div>

          {/* Edit button */}
          <Button
            variant={editing ? 'destructive' : 'outline'}
            size="sm"
            className="gap-2 shrink-0 shadow-sm"
            onClick={editing ? handleCancel : () => setEditing(true)}
          >
            {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {editing ? 'Hủy' : 'Chỉnh sửa'}
          </Button>
        </div>
      </div>

      {/* ── Thông tin cá nhân ── */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/20">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Thông tin cá nhân</h2>
            <p className="text-xs text-muted-foreground">Họ tên, liên hệ và địa chỉ</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Họ tên */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Họ và tên</label>
            {editing
              ? <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Nguyễn Văn A" />
              : <InfoRow icon={User} value={user?.fullName} />
            }
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
            <InfoRow icon={Mail} value={user?.email} />
            {editing && <p className="text-xs text-muted-foreground mt-1">Email không thể thay đổi</p>}
          </div>

          {/* SĐT */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Số điện thoại</label>
            {editing
              ? <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0912345678" />
              : <InfoRow icon={Phone} value={user?.phone} empty="Chưa cập nhật" />
            }
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Địa chỉ</label>
            {editing
              ? <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Đường ABC, TP.HCM" />
              : <InfoRow icon={MapPin} value={user?.address} empty="Chưa cập nhật" />
            }
          </div>
        </div>

        {editing && (
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/10">
            <Button variant="outline" size="sm" onClick={handleCancel}>Hủy</Button>
            <Button size="sm" className="gap-2 shadow-sm" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        )}
      </div>

      {/* ── Thông tin tài khoản ── */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/20">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Thông tin tài khoản</h2>
            <p className="text-xs text-muted-foreground">Phương thức đăng nhập và vai trò</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Phương thức đăng nhập</label>
            <InfoRow icon={user?.authProvider === 'google' ? Mail : LogIn} value={user?.authProvider === 'google' ? 'Google OAuth' : 'Email & Mật khẩu'} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Ngày tham gia</label>
            <InfoRow icon={Calendar} value={formatDate(user?.createdAt)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Đăng nhập gần nhất</label>
            <InfoRow icon={Calendar} value={user?.lastLogin ? formatDate(user.lastLogin) : 'Không có'} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Vai trò</label>
            <InfoRow icon={RoleIcon} value={config.label} />
          </div>
        </div>
      </div>

      {/* ── Thông tin học tập (Student) ── */}
      {extraInfo && role === 'student' && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/20">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Thông tin học tập</h2>
              <p className="text-xs text-muted-foreground">GPA và tiến độ tích lũy tín chỉ</p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <StatBox label="GPA tích lũy" value={extraInfo.gpa?.toFixed(2) || '0.00'} color="text-primary" bg="bg-primary/5 border-primary/10" />
              <StatBox label="Tín chỉ hoàn thành" value={extraInfo.completedCredits || 0} color="text-emerald-600" bg="bg-emerald-500/5 border-emerald-500/20" />
              <StatBox label="Học kỳ hiện tại" value={`HK${extraInfo.currentSemester || 1}`} color="text-amber-600" bg="bg-amber-500/5 border-amber-500/20" />
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/student/academic-profile')}>
              <GraduationCap className="w-4 h-4" /> Xem hồ sơ học tập
            </Button>
          </div>
        </div>
      )}

      {/* ── Thông tin công ty (Employer) ── */}
      {extraInfo && role === 'employer' && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/20">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Thông tin công ty</h2>
              <p className="text-xs text-muted-foreground">Tên công ty và ngành nghề</p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Tên công ty</label>
                <InfoRow icon={Briefcase} value={extraInfo.name} empty="Chưa cập nhật" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Ngành nghề</label>
                <InfoRow icon={Briefcase} value={extraInfo.industry} empty="Chưa cập nhật" />
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/employer/company')}>
              <Briefcase className="w-4 h-4" /> Quản lý trang công ty
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, value, empty = '—' }) {
  return (
    <div className="flex items-center gap-2.5 h-10 px-3 rounded-lg bg-muted/40 text-sm">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className={value ? '' : 'text-muted-foreground italic text-xs'}>{value || empty}</span>
    </div>
  );
}

function StatBox({ label, value, color = '', bg = 'bg-muted/40' }) {
  return (
    <div className={`rounded-xl border p-4 text-center ${bg}`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

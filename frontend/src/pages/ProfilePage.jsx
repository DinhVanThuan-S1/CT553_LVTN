/**
 * ProfilePage — Trang thông tin cá nhân (dùng chung cho student / employer / admin)
 * - Hiển thị thông tin: avatar, tên, email, phone, role
 * - Chỉnh sửa: fullName, phone, address
 * - Thông tin bổ sung theo role (GPA cho SV, công ty cho NTD)
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import {
  User, Mail, Phone, MapPin, Shield, Calendar, Edit3,
  Camera, CheckCircle2, Briefcase, GraduationCap, Save, X,
} from 'lucide-react';
import api from '../lib/api';

const roleConfig = {
  student: {
    label: 'Sinh viên',
    icon: GraduationCap,
    color: 'from-blue-500/20 to-primary/20',
    badge: 'text-blue-600 bg-blue-500/10',
  },
  employer: {
    label: 'Nhà tuyển dụng',
    icon: Briefcase,
    color: 'from-emerald-500/20 to-teal-500/20',
    badge: 'text-emerald-600 bg-emerald-500/10',
  },
  admin: {
    label: 'Quản trị viên',
    icon: Shield,
    color: 'from-primary/20 to-teal-500/20',
    badge: 'text-primary bg-primary/10',
  },
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
  });
  const [extraInfo, setExtraInfo] = useState(null);

  const role = user?.role || 'student';
  const config = roleConfig[role] || roleConfig.student;
  const RoleIcon = config.icon;

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
    // Lấy thông tin bổ sung theo role
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
      if (data.success) {
        updateUser(data.data.user);
        setEditing(false);
        toast.success('Cập nhật thông tin thành công!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
    setEditing(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
      {/* Header Card */}
      <div className={`rounded-2xl border bg-gradient-to-br ${config.color} p-6`}>
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg shadow-primary/20 ring-4 ring-background">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold truncate">{user?.fullName}</h1>
              {user?.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" title="Đã xác thực" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{user?.email}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${config.badge}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                {config.label}
              </span>
              {user?.isActive ? (
                <span className="text-xs font-medium text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full">
                  Đang hoạt động
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-500/10 px-2.5 py-1 rounded-full">
                  Đã bị khóa
                </span>
              )}
            </div>
          </div>

          <Button
            variant={editing ? 'destructive' : 'outline'}
            size="sm"
            className="gap-2 flex-shrink-0"
            onClick={editing ? handleCancel : () => setEditing(true)}
          >
            {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {editing ? 'Hủy' : 'Chỉnh sửa'}
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" /> Thông tin cá nhân
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Họ tên */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Họ và tên</label>
            {editing ? (
              <Input
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                placeholder="Nguyễn Văn A"
              />
            ) : (
              <InfoRow icon={User} value={user?.fullName} />
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
            <InfoRow icon={Mail} value={user?.email} />
            {editing && <p className="text-xs text-muted-foreground mt-1">Email không thể thay đổi</p>}
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Số điện thoại</label>
            {editing ? (
              <Input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="0912345678"
              />
            ) : (
              <InfoRow icon={Phone} value={user?.phone} empty="Chưa cập nhật" />
            )}
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Địa chỉ</label>
            {editing ? (
              <Input
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="123 Đường ABC, TP.HCM"
              />
            ) : (
              <InfoRow icon={MapPin} value={user?.address} empty="Chưa cập nhật" />
            )}
          </div>
        </div>

        {editing && (
          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button variant="outline" size="sm" onClick={handleCancel}>Hủy</Button>
            <Button size="sm" className="gap-2" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        )}
      </div>

      {/* Account Info Card */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="text-base font-semibold flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-muted-foreground" /> Thông tin tài khoản
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Phương thức đăng nhập</label>
            <InfoRow
              icon={user?.authProvider === 'google' ? Mail : Shield}
              value={user?.authProvider === 'google' ? 'Google OAuth' : 'Email & Mật khẩu'}
            />
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

      {/* Role-specific Info */}
      {extraInfo && role === 'student' && (
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-base font-semibold flex items-center gap-2 mb-5">
            <GraduationCap className="w-4 h-4 text-muted-foreground" /> Thông tin học tập
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatBox label="GPA tích lũy" value={extraInfo.gpa?.toFixed(2) || '0.00'} />
            <StatBox label="Tín chỉ hoàn thành" value={extraInfo.completedCredits || 0} />
            <StatBox label="Học kỳ hiện tại" value={`HK${extraInfo.currentSemester || 1}`} />
          </div>
          <Button
            variant="outline" size="sm" className="mt-4 gap-2"
            onClick={() => navigate('/student/academic-profile')}
          >
            <GraduationCap className="w-4 h-4" /> Xem hồ sơ học tập
          </Button>
        </div>
      )}

      {extraInfo && role === 'employer' && (
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-base font-semibold flex items-center gap-2 mb-5">
            <Briefcase className="w-4 h-4 text-muted-foreground" /> Thông tin công ty
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Tên công ty</label>
              <InfoRow icon={Briefcase} value={extraInfo.name} empty="Chưa cập nhật" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Ngành nghề</label>
              <InfoRow icon={Briefcase} value={extraInfo.industry} empty="Chưa cập nhật" />
            </div>
          </div>
          <Button
            variant="outline" size="sm" className="mt-4 gap-2"
            onClick={() => navigate('/employer/company')}
          >
            <Briefcase className="w-4 h-4" /> Quản lý trang công ty
          </Button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, value, empty = '—' }) {
  return (
    <div className="flex items-center gap-2.5 h-10 px-3 rounded-lg bg-muted/40 text-sm">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className={value ? '' : 'text-muted-foreground italic'}>{value || empty}</span>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-lg bg-muted/40 p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

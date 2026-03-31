/**
 * SettingsPage — Trang Cài đặt (dùng chung cho tất cả roles)
 * Sections:
 *  1. Bảo mật (đổi mật khẩu)
 *  2. Thông báo (toggle types)
 *  3. Giao diện (dark mode, ngôn ngữ)
 *  4. Dữ liệu & Tài khoản (xóa tài khoản)
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import {
  Shield, Bell, Palette, Database, Lock, Eye, EyeOff,
  CheckCircle2, AlertTriangle, Sun, Moon, Monitor,
  ChevronRight, Smartphone, Mail, Globe, Trash2,
} from 'lucide-react';
import api from '../lib/api';

// ─── Toggle switch ───
function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
        ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform
          ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

// ─── Section wrapper ───
function Section({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-2xl border bg-card p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ─── Notification row ───
function NotifRow({ icon: Icon, label, sublabel, checked, onChange, id }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{label}</p>
          {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} id={id} />
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const toast = useToast();

  // ─── Password state ───
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);

  // ─── Notifications ───
  const [notifs, setNotifs] = useState({
    appNotifications: true,
    emailNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
  });

  // ─── UI settings ───
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

  // ─── Danger zone ───
  const [confirmDelete, setConfirmDelete] = useState('');

  // Apply theme
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      if (theme === 'dark') root.classList.add('dark');
      else if (theme === 'light') root.classList.remove('dark');
      else {
        // system
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) root.classList.add('dark');
        else root.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
    };
    applyTheme();
  }, [theme]);

  // ─── Change password ───
  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (pwForm.currentPassword === pwForm.newPassword) {
      toast.error('Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    setPwSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setPwSaving(false);
    }
  };

  const PasswordInput = ({ field, placeholder, label }) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
      <div className="relative">
        <Input
          type={showPw[field] ? 'text' : 'password'}
          value={pwForm[field === 'current' ? 'currentPassword' : field === 'new' ? 'newPassword' : 'confirmPassword']}
          onChange={e => setPwForm(f => ({
            ...f,
            [field === 'current' ? 'currentPassword' : field === 'new' ? 'newPassword' : 'confirmPassword']: e.target.value,
          }))}
          placeholder={placeholder}
          className="pr-9"
        />
        <button
          type="button"
          onClick={() => setShowPw(s => ({ ...s, [field]: !s[field] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPw[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  const isGoogleUser = user?.authProvider === 'google';

  return (
    <div className="animate-fade-in max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt</h1>
        <p className="text-muted-foreground text-sm mt-1">Quản lý tài khoản và tuỳ chỉnh trải nghiệm</p>
      </div>

      {/* 1. Bảo mật */}
      <Section icon={Shield} title="Bảo mật" description="Quản lý mật khẩu và xác thực tài khoản">
        {isGoogleUser ? (
          <div className="rounded-lg bg-muted/40 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Đăng nhập bằng Google</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tài khoản của bạn sử dụng Google OAuth. Mật khẩu được quản lý bởi Google.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <PasswordInput field="current" placeholder="••••••••" label="Mật khẩu hiện tại" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <PasswordInput field="new" placeholder="Tối thiểu 6 ký tự" label="Mật khẩu mới" />
              <PasswordInput field="confirm" placeholder="Nhập lại mật khẩu mới" label="Xác nhận mật khẩu" />
            </div>
            {/* Strength indicator */}
            {pwForm.newPassword.length > 0 && (
              <PasswordStrength password={pwForm.newPassword} />
            )}
            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                className="gap-2"
                onClick={handleChangePassword}
                disabled={pwSaving}
              >
                <Lock className="w-4 h-4" />
                {pwSaving ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </Button>
            </div>
          </div>
        )}
      </Section>

      {/* 2. Thông báo */}
      <Section icon={Bell} title="Thông báo" description="Kiểm soát cách bạn nhận thông báo">
        <div className="divide-y divide-border/50">
          <NotifRow
            icon={Bell} label="Thông báo trong app" id="notif-app"
            sublabel="Nhận thông báo từ hệ thống"
            checked={notifs.appNotifications}
            onChange={v => setNotifs(n => ({ ...n, appNotifications: v }))}
          />
          <NotifRow
            icon={Mail} label="Email thông báo" id="notif-email"
            sublabel="Nhận email khi có cập nhật quan trọng"
            checked={notifs.emailNotifications}
            onChange={v => setNotifs(n => ({ ...n, emailNotifications: v }))}
          />
          <NotifRow
            icon={Smartphone} label="Thông báo đẩy" id="notif-push"
            sublabel="Nhận thông báo trình duyệt"
            checked={notifs.pushNotifications}
            onChange={v => setNotifs(n => ({ ...n, pushNotifications: v }))}
          />
          <NotifRow
            icon={Globe} label="Email marketing" id="notif-marketing"
            sublabel="Nhận tin tức và khuyến mãi từ EduPath"
            checked={notifs.marketingEmails}
            onChange={v => setNotifs(n => ({ ...n, marketingEmails: v }))}
          />
        </div>
      </Section>

      {/* 3. Giao diện */}
      <Section icon={Palette} title="Giao diện" description="Tùy chỉnh giao diện hiển thị">
        <div>
          <p className="text-sm font-medium mb-3">Chủ đề màu</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'light', icon: Sun, label: 'Sáng' },
              { key: 'dark', icon: Moon, label: 'Tối' },
              { key: 'system', icon: Monitor, label: 'Theo hệ thống' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                  ${theme === key
                    ? 'border-primary bg-primary/[0.04] text-primary'
                    : 'border-border/60 hover:border-border text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
                {theme === key && (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* 4. Nguy hiểm */}
      <Section icon={Database} title="Dữ liệu & Tài khoản" description="Các hành động ảnh hưởng tài khoản">
        <div className="rounded-xl border border-destructive/20 bg-destructive/[0.03] p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-destructive">Vùng nguy hiểm</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Các thao tác này không thể phục hồi. Hãy cân nhắc kỹ trước khi thực hiện.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Nhập <strong className="text-foreground">XÓA TÀI KHOẢN</strong> để xác nhận
            </p>
            <div className="flex gap-2">
              <Input
                value={confirmDelete}
                onChange={e => setConfirmDelete(e.target.value)}
                placeholder="XÓA TÀI KHOẢN"
                className="border-destructive/30 focus:border-destructive text-sm"
              />
              <Button
                variant="destructive"
                size="sm"
                disabled={confirmDelete !== 'XÓA TÀI KHOẢN'}
                className="gap-2 flex-shrink-0"
                onClick={() => toast.error('Tính năng này cần xác thực từ Admin')}
              >
                <Trash2 className="w-4 h-4" />
                Xóa
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

// Kiểm tra độ mạnh mật khẩu
function PasswordStrength({ password }) {
  const checks = [
    { label: 'Ít nhất 6 ký tự', pass: password.length >= 6 },
    { label: 'Có chữ hoa', pass: /[A-Z]/.test(password) },
    { label: 'Có số', pass: /[0-9]/.test(password) },
    { label: 'Có ký tự đặc biệt', pass: /[^a-zA-Z0-9]/.test(password) },
  ];
  const passed = checks.filter(c => c.pass).length;
  const colors = ['bg-destructive', 'bg-orange-500', 'bg-amber-500', 'bg-green-500'];
  const labels = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh'];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < passed ? colors[passed - 1] : 'bg-muted'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{labels[passed - 1] || 'Rất yếu'}</p>
        <div className="flex gap-3">
          {checks.map(c => (
            <span key={c.label} className={`text-[10px] flex items-center gap-1
              ${c.pass ? 'text-green-600' : 'text-muted-foreground'}`}
            >
              <CheckCircle2 className="w-3 h-3" /> {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

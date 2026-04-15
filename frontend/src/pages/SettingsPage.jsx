/**
 * SettingsPage — Trang Cài đặt (dùng chung cho tất cả roles)
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import {
  Shield, Bell, Palette, Database, Lock, Eye, EyeOff,
  CheckCircle2, AlertTriangle, Sun, Moon, Monitor,
  Smartphone, Mail, Globe, Trash2, Settings,
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
        ${checked ? 'bg-primary' : 'bg-muted-foreground/25'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
        ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );
}

// ─── Password input ───
function PasswordInput({ label, placeholder, value, onChange, show, onToggleShow }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-9"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Section card ───
function Section({ icon: Icon, title, description, iconBg = 'bg-muted/60 text-muted-foreground', children }) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/20">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

// ─── Notification row ───
function NotifRow({ icon: Icon, label, sublabel, checked, onChange, id }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
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

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);

  const [notifs, setNotifs] = useState({
    appNotifications: true,
    emailNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');
  const [confirmDelete, setConfirmDelete] = useState('');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'light') root.classList.remove('dark');
    else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Mật khẩu mới phải có ít nhất 6 ký tự'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Mật khẩu xác nhận không khớp'); return; }
    if (pwForm.currentPassword === pwForm.newPassword) { toast.error('Mật khẩu mới phải khác mật khẩu hiện tại'); return; }

    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Đổi mật khẩu thành công!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally { setPwSaving(false); }
  };

  const isGoogleUser = user?.authProvider === 'google';

  return (
    <div className="animate-fade-in max-w-2xl mx-auto space-y-5">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl from-indigo-500/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Tài khoản</span>
            </div>
            <p className="text-muted-foreground text-sm">Quản lý tài khoản và tuỳ chỉnh trải nghiệm</p>
          </div>
        </div>
      </div>

      {/* 1. Bảo mật */}
      <Section icon={Shield} title="Bảo mật" description="Quản lý mật khẩu và xác thực tài khoản" iconBg="bg-amber-500/10 text-amber-600">
        {isGoogleUser ? (
          <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Đăng nhập bằng Google</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tài khoản sử dụng Google OAuth. Mật khẩu được quản lý bởi Google.
              </p>
            </div>
          </div>
        ) : (
          <>
            <PasswordInput
              label="Mật khẩu hiện tại" placeholder="••••••••"
              value={pwForm.currentPassword} onChange={v => setPwForm(f => ({ ...f, currentPassword: v }))}
              show={showPw.current} onToggleShow={() => setShowPw(s => ({ ...s, current: !s.current }))}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <PasswordInput
                label="Mật khẩu mới" placeholder="Tối thiểu 6 ký tự"
                value={pwForm.newPassword} onChange={v => setPwForm(f => ({ ...f, newPassword: v }))}
                show={showPw.new} onToggleShow={() => setShowPw(s => ({ ...s, new: !s.new }))}
              />
              <PasswordInput
                label="Xác nhận mật khẩu" placeholder="Nhập lại mật khẩu mới"
                value={pwForm.confirmPassword} onChange={v => setPwForm(f => ({ ...f, confirmPassword: v }))}
                show={showPw.confirm} onToggleShow={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
              />
            </div>
            {pwForm.newPassword.length > 0 && <PasswordStrength password={pwForm.newPassword} />}
            <div className="flex justify-end pt-1">
              <Button size="sm" className="gap-2 shadow-sm" onClick={handleChangePassword} disabled={pwSaving}>
                <Lock className="w-4 h-4" />
                {pwSaving ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </Button>
            </div>
          </>
        )}
      </Section>

      {/* 2. Thông báo */}
      <Section icon={Bell} title="Thông báo" description="Kiểm soát cách bạn nhận thông báo" iconBg="bg-sky-500/10 text-sky-600">
        <div>
          <NotifRow icon={Bell} label="Thông báo trong app" id="notif-app"
            sublabel="Nhận thông báo từ hệ thống"
            checked={notifs.appNotifications} onChange={v => setNotifs(n => ({ ...n, appNotifications: v }))} />
          <NotifRow icon={Mail} label="Email thông báo" id="notif-email"
            sublabel="Nhận email khi có cập nhật quan trọng"
            checked={notifs.emailNotifications} onChange={v => setNotifs(n => ({ ...n, emailNotifications: v }))} />
          <NotifRow icon={Smartphone} label="Thông báo đẩy" id="notif-push"
            sublabel="Nhận thông báo trình duyệt"
            checked={notifs.pushNotifications} onChange={v => setNotifs(n => ({ ...n, pushNotifications: v }))} />
          <NotifRow icon={Globe} label="Email marketing" id="notif-marketing"
            sublabel="Nhận tin tức và khuyến mãi từ EduPath"
            checked={notifs.marketingEmails} onChange={v => setNotifs(n => ({ ...n, marketingEmails: v }))} />
        </div>
      </Section>

      {/* 3. Giao diện */}
      <Section icon={Palette} title="Giao diện" description="Tuỳ chỉnh giao diện hiển thị" iconBg="bg-violet-500/10 text-violet-600">
        <div>
          <p className="text-sm font-medium mb-3">Chủ đề màu</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'light', icon: Sun, label: 'Sáng' },
              { key: 'dark', icon: Moon, label: 'Tối' },
              { key: 'system', icon: Monitor, label: 'Hệ thống' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  theme === key
                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                    : 'border-border/50 hover:border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
                {theme === key && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* 4. Vùng nguy hiểm */}
      <Section icon={Database} title="Dữ liệu & Tài khoản" description="Các hành động ảnh hưởng tài khoản" iconBg="bg-red-500/10 text-red-500">
        <div className="rounded-xl border border-destructive/25 bg-destructive/[0.03] p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
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
                variant="destructive" size="sm"
                disabled={confirmDelete !== 'XÓA TÀI KHOẢN'}
                className="gap-2 shrink-0"
                onClick={() => toast.error('Tính năng này cần xác thực từ Admin')}
              >
                <Trash2 className="w-4 h-4" /> Xóa
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function PasswordStrength({ password }) {
  const passed = password.length >= 6;
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        <div className={`h-1 flex-1 rounded-full transition-colors ${passed ? 'bg-emerald-500' : 'bg-destructive'}`} />
      </div>
      <p className={`text-xs ${passed ? 'text-emerald-600' : 'text-destructive'}`}>
        {passed ? '✓ Đủ yêu cầu' : '✗ Chưa đủ 6 ký tự'}
      </p>
    </div>
  );
}

/**
 * RegisterPage
 * Trang đăng ký tài khoản mới
 * - Google button nằm dưới nút Đăng ký
 * - Inline validation: email format, password requirements, confirm password
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Loader2,
  ArrowLeft,
  Building2,
  UserCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// Regex kiểm tra định dạng email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Yêu cầu mật khẩu
const PASSWORD_RULES = [
  { test: (p) => p.length >= 6, label: 'Ít nhất 6 ký tự' },
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Lỗi inline cho từng field
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  // Đã chạm vào field chưa
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    phone: false,
  });
  // Hiện bảng yêu cầu mật khẩu
  const [showPasswordHints, setShowPasswordHints] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  /** Validate từng field, trả về chuỗi lỗi hoặc '' */
  const validateField = (name, value, allData = formData) => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Họ và tên không được để trống';
        if (value.trim().length < 2) return 'Họ và tên phải có ít nhất 2 ký tự';
        return '';
      case 'email':
        if (!value) return 'Email không được để trống';
        if (!EMAIL_REGEX.test(value)) return 'Email không đúng định dạng (vd: name@example.com)';
        return '';
      case 'password':
        if (!value) return 'Mật khẩu không được để trống';
        if (value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
        return '';
      case 'confirmPassword':
        if (!value) return 'Vui lòng xác nhận mật khẩu';
        if (value !== allData.password) return 'Mật khẩu xác nhận không khớp';
        return '';
      case 'phone':
        if (value && !/^(0[3-9])[0-9]{8}$/.test(value)) return 'Số điện thoại không hợp lệ (vd: 0912345678)';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);

    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value, newData) }));
    }

    // Re-validate confirmPassword khi đổi password
    if (name === 'password' && touched.confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: validateField('confirmPassword', newData.confirmPassword, newData),
      }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, formData[name]) }));
    if (name === 'password') setShowPasswordHints(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Đánh dấu tất cả field đã chạm
    const allTouched = Object.keys(touched).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    // Validate tất cả
    const newErrors = Object.keys(errors).reduce((acc, name) => ({
      ...acc,
      [name]: validateField(name, formData[name]),
    }), {});
    setErrors(newErrors);

    // Nếu có lỗi hoặc chưa đồng ý điều khoản thì dừng
    if (Object.values(newErrors).some(Boolean)) return;
    if (!agreedTerms) {
      toast.error('Vui lòng đồng ý với Điều khoản sử dụng để tiếp tục');
      return;
    }

    setIsLoading(true);
    try {
      const data = await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        role: formData.role,
      });
      if (data.success) {
        toast.success('Đăng ký thành công!');
        const roleRoutes = {
          student: '/student',
          employer: '/employer',
        };
        navigate(roleRoutes[data.data.user.role] || '/');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng ký thất bại';
      const apiErrors = error.response?.data?.errors;
      if (apiErrors?.length) {
        apiErrors.forEach(err => toast.error(err.message));
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /** Kiểm tra từng rule mật khẩu */
  const passwordMeta = PASSWORD_RULES.map(rule => ({
    ...rule,
    passed: rule.test(formData.password),
  }));

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-32 right-20 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 text-white/90 hover:text-white transition-colors mb-12">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Trang chủ</span>
          </Link>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold">EduPath</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Bắt đầu hành trình<br />của bạn!
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Đăng ký tài khoản để cá nhân hóa lộ trình học tập,
            kết nối với cơ hội việc làm & phát triển sự nghiệp CNTT.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            { icon: '📚', text: 'Phân tích năng lực qua Skill Map' },
            { icon: '🗺️', text: 'AI gợi ý lộ trình phù hợp' },
            { icon: '💼', text: 'Kết nối với nhà tuyển dụng' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-white/80">
              <span className="text-lg">{icon}</span>
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">EduPath</span>
          </div>

          <h2 className="text-2xl font-bold mb-1">Đăng ký tài khoản</h2>
          <p className="text-muted-foreground mb-6">
            Điền thông tin để bắt đầu
          </p>

          {/* Role Selector */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
              className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-lg border text-sm font-medium transition-all ${
                formData.role === 'student'
                  ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                  : 'hover:bg-muted'
              }`}
            >
              <UserCircle className="w-4 h-4" />
              Sinh viên
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, role: 'employer' }))}
              className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-lg border text-sm font-medium transition-all ${
                formData.role === 'employer'
                  ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                  : 'hover:bg-muted'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Nhà tuyển dụng
            </button>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Họ và tên */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-1.5">
                Họ và tên <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.fullName && touched.fullName ? 'text-destructive' : 'text-muted-foreground'}`} />
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('fullName')}
                  className={`pl-10 ${errors.fullName && touched.fullName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  autoComplete="name"
                />
              </div>
              {errors.fullName && touched.fullName && (
                <p className="flex items-center gap-1 mt-1.5 text-xs text-destructive">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium mb-1.5">
                Email <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.email && touched.email ? 'text-destructive' : 'text-muted-foreground'}`} />
                <Input
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  className={`pl-10 ${errors.email && touched.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && touched.email && (
                <p className="flex items-center gap-1 mt-1.5 text-xs text-destructive">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Mật khẩu */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium mb-1.5">
                Mật khẩu <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.password && touched.password ? 'text-destructive' : 'text-muted-foreground'}`} />
                <Input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  onFocus={() => setShowPasswordHints(true)}
                  className={`pl-10 pr-10 ${errors.password && touched.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Gợi ý yêu cầu mật khẩu */}
              {(showPasswordHints || (touched.password && formData.password)) && (
                <div className="mt-2 p-2.5 rounded-lg bg-muted/60 space-y-1">
                  {passwordMeta.map(({ label, passed }) => (
                    <p key={label} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${passed ? 'text-emerald-500' : 'text-muted-foreground/40'}`} />
                      {label}
                    </p>
                  ))}
                </div>
              )}
              {errors.password && touched.password && !showPasswordHints && (
                <p className="flex items-center gap-1 mt-1.5 text-xs text-destructive">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Xác nhận mật khẩu */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5">
                Xác nhận mật khẩu <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.confirmPassword && touched.confirmPassword ? 'text-destructive' : 'text-muted-foreground'}`} />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={`pl-10 pr-10 ${errors.confirmPassword && touched.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="flex items-center gap-1 mt-1.5 text-xs text-destructive">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {errors.confirmPassword}
                </p>
              )}
              {/* Hiện tick nếu khớp */}
              {!errors.confirmPassword && touched.confirmPassword && formData.confirmPassword && (
                <p className="flex items-center gap-1 mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mật khẩu khớp
                </p>
              )}
            </div>

            {/* Số điện thoại */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
                Số điện thoại
              </label>
              <div className="relative">
                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.phone && touched.phone ? 'text-destructive' : 'text-muted-foreground'}`} />
                <Input
                  id="phone"
                  name="phone"
                  placeholder="0912345678"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phone')}
                  className={`pl-10 ${errors.phone && touched.phone ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  autoComplete="tel"
                />
              </div>
              {errors.phone && touched.phone && (
                <p className="flex items-center gap-1 mt-1.5 text-xs text-destructive">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Điều khoản sử dụng */}
            <div className="flex items-start gap-2.5 mt-1">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer accent-primary"
              />
              <label htmlFor="agreeTerms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                Tôi đồng ý với{' '}
                <button type="button" className="text-primary hover:underline font-medium" onClick={() => window.open('/terms', '_blank')}>Điều khoản sử dụng</button>
                {' '}và{' '}
                <button type="button" className="text-primary hover:underline font-medium" onClick={() => window.open('/privacy', '_blank')}>Chính sách bảo mật</button>
                {' '}của EduPath
              </label>
            </div>

            {/* Nút Đăng ký */}
            <Button type="submit" className="w-full h-11" disabled={isLoading || !agreedTerms}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Đăng ký tài khoản'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">hoặc</span>
            </div>
          </div>

          {/* Google Sign Up - nằm dưới nút Đăng ký */}
          <button
            type="button"
            onClick={() => { window.location.href = `${API_URL}/auth/google`; }}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border bg-card hover:bg-muted transition-colors text-sm font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Đăng ký bằng Google
          </button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

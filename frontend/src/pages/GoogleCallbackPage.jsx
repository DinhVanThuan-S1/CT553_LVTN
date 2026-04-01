/**
 * GoogleCallbackPage
 * Xử lý redirect từ Google OAuth
 *
 * Có 2 trường hợp:
 * 1. User đã có tài khoản → nhận accessToken + refreshToken → điều hướng theo role
 * 2. User mới → nhận isNewUser=true + thông tin tạm → hiện modal chọn Sinh viên / Nhà tuyển dụng
 *    → gọi POST /auth/google/complete → tạo tài khoản → điều hướng đúng role
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Loader2, GraduationCap, UserCircle, Building2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ROLE_ROUTES = {
  student: '/student',
  employer: '/employer',
  admin: '/admin',
};

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const toast = useToast();

  // State cho modal chọn role
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [tempProfile, setTempProfile] = useState(null);
  const [selectedRole, setSelectedRole] = useState('student');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      const error = searchParams.get('error');
      if (error) {
        toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
        navigate('/login');
        return;
      }

      // --- Trường hợp 1: User đã có tài khoản ---
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      if (accessToken && refreshToken) {
        await handleGoogleCallback(accessToken, refreshToken);
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const data = await res.json();
          const role = data?.data?.user?.role || 'student';
          toast.success('Đăng nhập thành công!');
          navigate(ROLE_ROUTES[role] || '/student');
        } catch {
          toast.success('Đăng nhập thành công!');
          navigate('/student');
        }
        return;
      }

      // --- Trường hợp 2: User mới, cần chọn role ---
      const isNewUser = searchParams.get('isNewUser') === 'true';
      if (isNewUser) {
        setTempProfile({
          googleId: searchParams.get('googleId'),
          email: searchParams.get('email'),
          fullName: searchParams.get('fullName'),
          avatar: searchParams.get('avatar'),
        });
        setShowRoleModal(true);
        return;
      }

      // Không có thông tin hợp lệ
      navigate('/login');
    };

    processCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Hoàn tất đăng ký với role đã chọn */
  const handleCompleteRegister = async () => {
    if (!tempProfile) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/google/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tempProfile, role: selectedRole }),
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        // Lưu tokens và cập nhật AuthContext
        await handleGoogleCallback(data.data.accessToken, data.data.refreshToken);
        toast.success('Đăng ký thành công! Chào mừng bạn đến với EduPath 🎉');
        navigate(ROLE_ROUTES[data.data.user.role] || '/student');
      } else {
        toast.error(data.message || 'Đăng ký thất bại');
      }
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Hiện modal chọn role ---
  if (showRoleModal && tempProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border bg-card shadow-xl p-8">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold">EduPath</span>
            </div>

            {/* Avatar + tên từ Google */}
            {tempProfile.avatar && (
              <div className="flex justify-center mb-4">
                <img
                  src={tempProfile.avatar}
                  alt={tempProfile.fullName}
                  className="w-16 h-16 rounded-full border-2 border-primary/20"
                />
              </div>
            )}

            <h2 className="text-xl font-bold text-center mb-1">
              Xin chào, {tempProfile.fullName}!
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-2">
              {tempProfile.email}
            </p>
            <p className="text-sm text-center text-muted-foreground mb-6">
              Bạn chưa có tài khoản EduPath. Vui lòng chọn vai trò để hoàn tất đăng ký.
            </p>

            {/* Chọn role */}
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  selectedRole === 'student'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-muted text-foreground'
                }`}
              >
                <UserCircle className="w-8 h-8" />
                <span>Sinh viên</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Học tập & lộ trình
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('employer')}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  selectedRole === 'employer'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-muted text-foreground'
                }`}
              >
                <Building2 className="w-8 h-8" />
                <span>Nhà tuyển dụng</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Đăng tin & tuyển dụng
                </span>
              </button>
            </div>

            <Button
              className="w-full h-11"
              onClick={handleCompleteRegister}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo tài khoản...
                </>
              ) : (
                'Hoàn tất đăng ký'
              )}
            </Button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Huỷ và quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Đang xử lý (loading) ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Đang xử lý đăng nhập Google...</p>
      </div>
    </div>
  );
}

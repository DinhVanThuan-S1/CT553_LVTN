/**
 * GoogleCallbackPage
 * Xử lý redirect từ Google OAuth
 * URL: /auth/google/callback?accessToken=xxx&refreshToken=xxx
 */
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      if (error) {
        navigate('/login?error=google_failed');
        return;
      }

      if (accessToken && refreshToken) {
        await handleGoogleCallback(accessToken, refreshToken);
        navigate('/student'); // Mặc định vào trang student
      } else {
        navigate('/login');
      }
    };

    processCallback();
  }, [searchParams, navigate, handleGoogleCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Đang xử lý đăng nhập Google...</p>
      </div>
    </div>
  );
}

/**
 * ProtectedRoute Component
 * Bảo vệ route - chuyển hướng nếu chưa đăng nhập hoặc sai role
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Đang kiểm tra auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra role
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Chuyển hướng về trang phù hợp với role
    const roleRoutes = {
      student: '/student',
      employer: '/employer',
      admin: '/admin',
    };
    return <Navigate to={roleRoutes[user?.role] || '/'} replace />;
  }

  return children;
}

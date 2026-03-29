/**
 * AuthLayout
 * Kết hợp ProtectedRoute + MainLayout
 * Sử dụng trực tiếp trong router thay vì nesting components
 */
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from './MainLayout';
import { Loader2 } from 'lucide-react';

export default function AuthLayout({ allowedRoles, role }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();

  // Loading
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

  // Sai role
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const roleRoutes = { student: '/student', employer: '/employer', admin: '/admin' };
    return <Navigate to={roleRoutes[user?.role] || '/'} replace />;
  }

  return (
    <MainLayout role={role || user?.role} user={user} onLogout={logout} />
  );
}

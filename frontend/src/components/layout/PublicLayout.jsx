/**
 * PublicLayout - Layout cho các trang public (không yêu cầu đăng nhập)
 * Có header EduPath + container padding phù hợp
 * Ẩn login/register khi đã đăng nhập
 */
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GraduationCap, ArrowLeft, User } from 'lucide-react';
import { Button } from '../ui/Button';

export default function PublicLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const dashboardRoute = {
    student: '/student',
    employer: '/employer',
    admin: '/admin',
  }[user?.role] || '/';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="h-5 w-px bg-border" />
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">EduPath</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to={dashboardRoute}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {user?.fullName?.split(' ').pop() || 'Dashboard'}
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Đăng nhập</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Đăng ký</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

/**
 * App Entry Point
 * AuthProvider + ToastProvider nằm TRONG RouterProvider thông qua Root layout
 */
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';

// Pages - Public
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import AuthLayout from './components/layout/AuthLayout';

// Pages - Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import CourseManagement from './pages/admin/CourseManagement';
import CurriculumManagement from './pages/admin/CurriculumManagement';
import SkillManagement from './pages/admin/SkillManagement';
import RoadmapManagement from './pages/admin/RoadmapManagement';
import JobPostingManagement from './pages/admin/JobPostingManagement';
import JobTemplateManagement from './pages/admin/JobTemplateManagement';

// Pages - Student
import StudentDashboard from './pages/student/StudentDashboard';
import AcademicProfilePage from './pages/student/AcademicProfilePage';
import CareerPreferencePage from './pages/student/CareerPreferencePage';
import RoadmapListPage from './pages/student/RoadmapListPage';
import RoadmapDetailPage from './pages/student/RoadmapDetailPage';
import MyRoadmapPage from './pages/student/MyRoadmapPage';
import ProgressPage from './pages/student/ProgressPage';
import SkillMapPage from './pages/student/SkillMapPage';
import JobListPage from './pages/student/JobListPage';

// Root layout - cung cấp AuthProvider + Toast cho toàn bộ app
function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Outlet />
      </ToastProvider>
    </AuthProvider>
  );
}

// Placeholder component (cho các trang chưa xây dựng)
function PlaceholderPage({ title }) {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground">Trang này sẽ được xây dựng ở các phase tiếp theo.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6 card-hover">
            <div className="h-4 w-24 skeleton mb-3" />
            <div className="h-8 w-16 skeleton mb-2" />
            <div className="h-3 w-32 skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // === Public ===
      { path: '/', element: <WelcomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/auth/google/callback', element: <GoogleCallbackPage /> },

      // === Admin (protected) ===
      {
        path: '/admin',
        element: <AuthLayout allowedRoles={['admin']} role="admin" />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'users', element: <UserManagement /> },
          { path: 'courses', element: <CourseManagement /> },
          { path: 'curriculum-programs', element: <CurriculumManagement /> },
          { path: 'skills', element: <SkillManagement /> },
          { path: 'roadmaps', element: <RoadmapManagement /> },
          { path: 'job-templates', element: <JobTemplateManagement /> },
          { path: 'job-postings', element: <JobPostingManagement /> },
          { path: 'resources', element: <PlaceholderPage title="QL Tài nguyên" /> },
          { path: 'reports', element: <PlaceholderPage title="Thống kê" /> },
        ],
      },
      // === Student (protected) ===
      {
        path: '/student',
        element: <AuthLayout allowedRoles={['student']} role="student" />,
        children: [
          { index: true, element: <StudentDashboard /> },
          { path: 'academic-profile', element: <AcademicProfilePage /> },
          { path: 'career-preferences', element: <CareerPreferencePage /> },
          { path: 'roadmaps', element: <RoadmapListPage /> },
          { path: 'roadmaps/:id', element: <RoadmapDetailPage /> },
          { path: 'my-roadmap', element: <MyRoadmapPage /> },
          { path: 'progress', element: <ProgressPage /> },
          { path: 'skill-map', element: <SkillMapPage /> },
          { path: 'jobs', element: <JobListPage /> },
          { path: 'cv', element: <PlaceholderPage title="CV" /> },
          { path: 'applications', element: <PlaceholderPage title="Đơn ứng tuyển" /> },
          { path: 'favorites', element: <PlaceholderPage title="Yêu thích" /> },
        ],
      },
      // === Employer (protected) ===
      {
        path: '/employer',
        element: <AuthLayout allowedRoles={['employer']} role="employer" />,
        children: [
          { index: true, element: <PlaceholderPage title="Tổng quan" /> },
          { path: 'company', element: <PlaceholderPage title="Hồ sơ Công ty" /> },
          { path: 'job-postings', element: <PlaceholderPage title="Tin tuyển dụng" /> },
          { path: 'applicants', element: <PlaceholderPage title="Ứng viên" /> },
        ],
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

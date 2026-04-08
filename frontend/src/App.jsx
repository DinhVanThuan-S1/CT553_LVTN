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
import PublicLayout from './components/layout/PublicLayout';

// Pages - Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import CourseManagement from './pages/admin/CourseManagement';
import CurriculumManagement from './pages/admin/CurriculumManagement';
import SkillManagement from './pages/admin/SkillManagement';
import RoadmapManagement from './pages/admin/RoadmapManagement';
import JobPostingManagement from './pages/admin/JobPostingManagement';
import JobTemplateManagement from './pages/admin/JobTemplateManagement';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminResourcesPage from './pages/admin/AdminResourcesPage';

// Pages - Shared
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

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
import CVPage from './pages/student/CVPage';
import ApplicationsPage from './pages/student/ApplicationsPage';
import FavoritesPage from './pages/student/FavoritesPage';
import LearningSessionPage from './pages/student/LearningSessionPage';
import SkillTestPage from './pages/student/SkillTestPage';
import ChatPage from './pages/ChatPage';

// Pages - AI
import AIRoadmapPage from './pages/student/AIRoadmapPage';
import AIJobSuggestionPage from './pages/student/AIJobSuggestionPage';
import AIChatPage from './pages/student/AIChatPage';

// Pages - Employer
import EmployerDashboard from './pages/employer/EmployerDashboard';
import CompanyProfilePage from './pages/employer/CompanyProfilePage';
import EmployerJobPostingsPage from './pages/employer/EmployerJobPostingsPage';
import ApplicantsPage from './pages/employer/ApplicantsPage';

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
      // Public roadmap + job (có header + container padding)
      {
        element: <PublicLayout />,
        children: [
          { path: '/roadmaps', element: <RoadmapListPage /> },
          { path: '/roadmaps/:id', element: <RoadmapDetailPage /> },
          { path: '/jobs', element: <JobListPage /> },
        ],
      },

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
          { path: 'resources', element: <AdminResourcesPage /> },
          { path: 'reports', element: <AdminReportsPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'settings', element: <SettingsPage /> },
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
          { path: 'my-roadmap/:prId/session/:sessionId', element: <LearningSessionPage /> },
          { path: 'my-roadmap/:prId/test/:skillId', element: <SkillTestPage /> },
          { path: 'progress', element: <ProgressPage /> },
          { path: 'skill-map', element: <SkillMapPage /> },
          { path: 'jobs', element: <JobListPage /> },
          { path: 'cv', element: <CVPage /> },
          { path: 'applications', element: <ApplicationsPage /> },
          { path: 'favorites', element: <FavoritesPage /> },
          { path: 'chat', element: <ChatPage /> },
          { path: 'ai-roadmap', element: <AIRoadmapPage /> },
          { path: 'ai-jobs', element: <AIJobSuggestionPage /> },
          { path: 'ai-chat', element: <AIChatPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
      // === Employer (protected) ===
      {
        path: '/employer',
        element: <AuthLayout allowedRoles={['employer']} role="employer" />,
        children: [
          { index: true, element: <EmployerDashboard /> },
          { path: 'company', element: <CompanyProfilePage /> },
          { path: 'job-postings', element: <EmployerJobPostingsPage /> },
          { path: 'applicants', element: <ApplicantsPage /> },
          { path: 'chat', element: <ChatPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

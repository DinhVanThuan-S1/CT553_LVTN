/**
 * MainLayout Component
 * Sidebar + Header + Content
 * Sidebar collapse sync giữa Header và Sidebar
 */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '../../lib/utils';

export default function MainLayout({ role = 'student', user, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={role} user={user} />

      <div className={cn(
        'transition-all duration-300 min-h-screen',
        sidebarCollapsed ? 'ml-[68px]' : 'ml-60'
      )}>
        <Header
          user={user}
          onLogout={onLogout}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="pt-14 min-h-screen">
          <div className="p-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

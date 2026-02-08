'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MainNavigation, BreadcrumbNav, type BreadcrumbItem } from '@/components/navigation';
import Footer from './Footer';

interface AppLayoutProps {
  children: React.ReactNode;
  breadcrumbItems?: BreadcrumbItem[];
  showSidebar?: boolean;
  className?: string;
}

export default function AppLayout({ 
  children, 
  breadcrumbItems, 
  showSidebar = true,
  className = ''
}: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  // Check if we're on a public page that shouldn't show navigation
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/auth/forgot-password';

  // Auto-collapse sidebar on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setIsSidebarCollapsed(true);
      }
    };

    handleResize(); // Check on initial load
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If on public pages, render minimal layout
  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavigation showSidebar={false} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  // If not authenticated, don't show sidebar
  const shouldShowSidebar = showSidebar && isAuthenticated;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <MainNavigation 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        showSidebar={shouldShowSidebar}
      />

      {/* Main Content Area */}
      <div className="flex">
        {/* Content */}
        <main 
          className={`
            flex-1 flex flex-col transition-all duration-300 ease-in-out
            ${shouldShowSidebar 
              ? (isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') 
              : ''
            }
            ${className}
          `}
        >
          {/* Breadcrumb Navigation */}
          {breadcrumbItems && breadcrumbItems.length > 0 && isAuthenticated && (
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <BreadcrumbNav items={breadcrumbItems} />
            </div>
          )}

          {/* Page Content */}
          <div className="flex-1">
            {children}
          </div>

          {/* Footer */}
          <Footer />
        </main>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getNavigationForRole } from '@/config/navigation';
import UserMenu from './UserMenu';
import NavigationItem from './NavigationItem';
import MobileMenu from './MobileMenu';

interface MainNavigationProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showSidebar?: boolean;
}

export default function MainNavigation({ 
  isCollapsed = false, 
  onToggleCollapse,
  showSidebar = true
}: MainNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  const navigationItems = isAuthenticated && user ? getNavigationForRole(user.role) : [];

  if (isLoading) {
    return (
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="font-bold text-xl text-gray-900 hidden sm:inline">
                EvoFit
              </span>
            </div>
          </div>
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 h-16 flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            {isAuthenticated && (
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Open navigation menu"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
            )}

            {/* Desktop sidebar toggle */}
            {showSidebar && isAuthenticated && onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu size={20} className="text-gray-600" />
              </button>
            )}

            {/* Logo and Brand */}
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="font-bold text-xl text-gray-900 hidden sm:inline">
                EvoFit
              </span>
            </Link>
          </div>

          {/* Center section - Desktop navigation (optional for horizontal layout) */}
          <nav className="hidden xl:flex items-center space-x-1">
            {/* This could be used for horizontal navigation if desired */}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <button 
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="View notifications"
                >
                  <Bell size={20} className="text-gray-600" />
                  {/* Notification badge */}
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    3
                  </span>
                </button>

                {/* User Menu */}
                <UserMenu />
              </>
            ) : (
              /* Login/Register buttons for unauthenticated users */
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isAuthenticated && (
        <MobileMenu 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Desktop Sidebar */}
      {showSidebar && isAuthenticated && (
        <aside
          className={`
            hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-30
            ${isCollapsed ? 'w-16' : 'w-64'}
          `}
        >
          <nav className="h-full overflow-y-auto p-4">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <NavigationItem
                  key={item.id}
                  item={item}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          </nav>
        </aside>
      )}
    </>
  );
}
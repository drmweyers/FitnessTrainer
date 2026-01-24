'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChevronDown, 
  LogOut, 
  User as UserIcon,
  Settings,
  Home,
  BookOpen,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserMenuItems, roleConfig } from '@/config/navigation';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowLogoutConfirm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setIsOpen(false);
      setShowLogoutConfirm(false);
    };

    // Listen for route changes (simplified for this example)
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  const handleLogout = async () => {
    if (!showLogoutConfirm) {
      setShowLogoutConfirm(true);
      return;
    }

    try {
      setIsLoggingOut(true);
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
      setIsOpen(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const userMenuItems = getUserMenuItems();
  const userRole = roleConfig[user.role];

  return (
    <div className="relative" ref={menuRef}>
      {/* User Menu Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* User Avatar */}
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
          {user.email.charAt(0).toUpperCase()}
        </div>

        {/* User Info - Hidden on mobile */}
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900 truncate max-w-32">
            {user.email.split('@')[0]}
          </div>
          <div className="flex items-center gap-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${userRole.color}`}>
              <span className={`w-2 h-2 rounded-full ${userRole.dotColor} mr-1`}></span>
              {userRole.label}
            </span>
          </div>
        </div>

        <ChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div className="sm:hidden fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-gray-200 z-20 py-2">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${userRole.color}`}>
                      <span className={`w-2 h-2 rounded-full ${userRole.dotColor} mr-1`}></span>
                      {userRole.label}
                    </span>
                    {user.isVerified && (
                      <div title="Verified Account">
                        <Shield size={14} className="text-green-500" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {userMenuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <IconComponent size={16} className="text-gray-500" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Logout Section */}
            <div className="border-t border-gray-200 py-2">
              {!showLogoutConfirm ? (
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 disabled:opacity-50"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              ) : (
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <span className="text-sm font-medium text-gray-900">
                      Confirm Sign Out
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Are you sure you want to sign out?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
                    >
                      {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                    </button>
                    <button
                      onClick={cancelLogout}
                      disabled={isLoggingOut}
                      className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-800 text-sm font-medium rounded hover:bg-gray-300 disabled:opacity-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  actions?: React.ReactNode;
}

/**
 * DashboardLayout
 * 
 * Consistent layout wrapper for all dashboard pages.
 * Provides header with title, breadcrumbs, and action buttons.
 */
export default function DashboardLayout({ 
  children, 
  title, 
  subtitle, 
  breadcrumbs, 
  actions 
}: DashboardLayoutProps) {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        {/* Dashboard Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              {/* Breadcrumbs */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex mb-4" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    {breadcrumbs.map((crumb, index) => (
                      <li key={index} className="flex items-center">
                        {index > 0 && (
                          <svg
                            className="flex-shrink-0 h-4 w-4 text-gray-400 mx-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {crumb.href ? (
                          <a
                            href={crumb.href}
                            className="text-sm font-medium text-gray-500 hover:text-gray-700"
                          >
                            {crumb.label}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-gray-900">
                            {crumb.label}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              )}

              {/* Header Content */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  {subtitle && (
                    <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
                  )}
                  {user && (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="capitalize font-medium text-gray-700">
                        {user.role}
                      </span>
                      <span className="mx-2">•</span>
                      <span>{user.email}</span>
                    </div>
                  )}
                </div>
                {actions && (
                  <div className="mt-4 sm:mt-0 sm:ml-4">
                    {actions}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </div>
    </Layout>
  );
}
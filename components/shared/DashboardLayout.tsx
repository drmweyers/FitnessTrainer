import React from 'react';

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
 * Provides page title, breadcrumbs, and action buttons.
 * User profile info is shown in MainNavigation — not repeated here.
 */
export default function DashboardLayout({
  children,
  title,
  subtitle,
  breadcrumbs,
  actions
}: DashboardLayoutProps) {
  return (
    <>
      {/* Page Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex mb-3" aria-label="Breadcrumb">
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

        {/* Title + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="mt-4 sm:mt-0 sm:ml-4">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 bg-gray-50 min-h-full">
        {children}
      </div>
    </>
  );
}
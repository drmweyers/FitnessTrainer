import React from 'react';
import { DashboardStatCard } from '@/types/dashboard';

interface StatCardProps extends DashboardStatCard {
  className?: string;
}

/**
 * StatCard Component
 * 
 * Displays a statistic with optional change indicator.
 * Used across all dashboard types for consistent metric display.
 */
export default function StatCard({
  title,
  value,
  subtitle,
  change,
  icon,
  color,
  className = ''
}: StatCardProps) {
  // Color configurations
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      text: 'text-blue-900',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      text: 'text-green-900',
      border: 'border-green-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      text: 'text-yellow-900',
      border: 'border-yellow-200'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      text: 'text-red-900',
      border: 'border-red-200'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      text: 'text-purple-900',
      border: 'border-purple-200'
    },
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600',
      text: 'text-indigo-900',
      border: 'border-indigo-200'
    }
  };

  const colors = colorClasses[color];

  // Change indicator styling
  const changeClasses = change ? {
    increase: 'text-green-600 bg-green-100',
    decrease: 'text-red-600 bg-red-100',
    neutral: 'text-gray-600 bg-gray-100'
  }[change.type] : '';

  return (
    <div className={`bg-white rounded-lg border ${colors.border} p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${colors.bg}`}>
          <div className={`h-6 w-6 ${colors.icon}`}>
            {icon}
          </div>
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <div className="flex items-baseline">
                <p className={`text-2xl font-semibold ${colors.text}`}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
                {subtitle && (
                  <p className="ml-2 text-sm text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>
          </div>
          {change && (
            <div className="mt-2 flex items-center">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${changeClasses}`}>
                {change.type === 'increase' && (
                  <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                )}
                {change.type === 'decrease' && (
                  <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                  </svg>
                )}
                {change.value > 0 ? '+' : ''}{change.value}%
              </span>
              <span className="ml-2 text-xs text-gray-500">{change.period}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
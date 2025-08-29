import React from 'react';
import Link from 'next/link';
import { QuickAction } from '@/types/dashboard';

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
  gridCols?: 1 | 2 | 3 | 4;
}

/**
 * QuickActions Component
 * 
 * Displays a grid of quick action buttons for common tasks.
 * Used across dashboards for role-specific actions.
 */
export default function QuickActions({ 
  actions, 
  title = 'Quick Actions', 
  gridCols = 2 
}: QuickActionsProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 hover:bg-blue-100',
      icon: 'text-blue-600',
      text: 'text-blue-900',
      border: 'border-blue-200 hover:border-blue-300',
      badge: 'bg-blue-500'
    },
    green: {
      bg: 'bg-green-50 hover:bg-green-100',
      icon: 'text-green-600',
      text: 'text-green-900',
      border: 'border-green-200 hover:border-green-300',
      badge: 'bg-green-500'
    },
    yellow: {
      bg: 'bg-yellow-50 hover:bg-yellow-100',
      icon: 'text-yellow-600',
      text: 'text-yellow-900',
      border: 'border-yellow-200 hover:border-yellow-300',
      badge: 'bg-yellow-500'
    },
    red: {
      bg: 'bg-red-50 hover:bg-red-100',
      icon: 'text-red-600',
      text: 'text-red-900',
      border: 'border-red-200 hover:border-red-300',
      badge: 'bg-red-500'
    },
    purple: {
      bg: 'bg-purple-50 hover:bg-purple-100',
      icon: 'text-purple-600',
      text: 'text-purple-900',
      border: 'border-purple-200 hover:border-purple-300',
      badge: 'bg-purple-500'
    },
    indigo: {
      bg: 'bg-indigo-50 hover:bg-indigo-100',
      icon: 'text-indigo-600',
      text: 'text-indigo-900',
      border: 'border-indigo-200 hover:border-indigo-300',
      badge: 'bg-indigo-500'
    }
  };

  const ActionButton = ({ action }: { action: QuickAction }) => {
    const colors = colorClasses[action.color];
    
    const buttonContent = (
      <div className={`relative bg-white rounded-lg border-2 ${colors.border} ${colors.bg} p-6 transition-all duration-200 group`}>
        {action.badge && (
          <div className={`absolute -top-2 -right-2 ${colors.badge} text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center`}>
            {action.badge}
          </div>
        )}
        <div className="flex items-start space-x-4">
          <div className={`flex-shrink-0 p-2 rounded-lg ${colors.bg} group-hover:scale-110 transition-transform`}>
            <div className={`h-6 w-6 ${colors.icon}`}>
              {action.icon}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`text-lg font-semibold ${colors.text} group-hover:text-opacity-80`}>
              {action.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {action.description}
            </p>
          </div>
        </div>
      </div>
    );

    if (action.href) {
      return (
        <Link href={action.href} key={action.id} className="block">
          {buttonContent}
        </Link>
      );
    }

    if (action.onClick) {
      return (
        <button
          key={action.id}
          onClick={action.onClick}
          className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        >
          {buttonContent}
        </button>
      );
    }

    return <div key={action.id}>{buttonContent}</div>;
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className={`grid gap-4 ${gridClasses[gridCols]}`}>
        {actions.map((action) => (
          <ActionButton key={action.id} action={action} />
        ))}
      </div>
    </div>
  );
}
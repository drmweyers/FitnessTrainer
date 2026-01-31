'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ComponentType<any>;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export default function BreadcrumbNav({ 
  items, 
  showHome = true, 
  className = '' 
}: BreadcrumbNavProps) {
  if (!items.length) return null;

  const breadcrumbItems = showHome 
    ? [{ label: 'Home', href: '/dashboard', icon: Home }, ...items]
    : items;

  return (
    <nav 
      className={`flex items-center space-x-1 text-sm text-gray-500 ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const IconComponent = item.icon;

          return (
            <li key={item.href} className="flex items-center">
              {/* Separator */}
              {index > 0 && (
                <ChevronRight 
                  size={14} 
                  className="text-gray-300 mx-2 flex-shrink-0" 
                />
              )}

              {/* Breadcrumb Item */}
              {isLast ? (
                <span className="flex items-center gap-1 text-gray-900 font-medium truncate">
                  {IconComponent && (
                    <IconComponent size={14} className="flex-shrink-0" />
                  )}
                  <span className="truncate">{item.label}</span>
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors duration-200 truncate group"
                >
                  {IconComponent && (
                    <IconComponent 
                      size={14} 
                      className="flex-shrink-0 group-hover:text-gray-600" 
                    />
                  )}
                  <span className="truncate hover:underline">
                    {item.label}
                  </span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
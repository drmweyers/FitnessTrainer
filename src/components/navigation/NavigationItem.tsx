'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { NavigationItem as NavItem } from '@/config/navigation';

interface NavigationItemProps {
  item: NavItem;
  isCollapsed?: boolean;
  onMobileClick?: () => void;
  depth?: number;
}

export default function NavigationItem({ 
  item, 
  isCollapsed = false, 
  onMobileClick, 
  depth = 0 
}: NavigationItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  
  const isActive = pathname === item.href || 
    (item.children && item.children.some(child => pathname === child.href));
  
  const hasChildren = item.children && item.children.length > 0;
  const IconComponent = item.icon;

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    } else if (onMobileClick) {
      onMobileClick();
    }
  };

  const itemContent = (
    <>
      {/* Icon */}
      <div className="flex-shrink-0">
        <IconComponent 
          size={18} 
          className={`${
            isActive 
              ? 'text-blue-600' 
              : 'text-gray-600 group-hover:text-gray-900'
          }`}
        />
      </div>

      {/* Label and Badge */}
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">
            {item.label}
          </span>
          
          {/* Badge */}
          {item.badge && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              {item.badge}
            </span>
          )}

          {/* Expand/Collapse Icon */}
          {hasChildren && (
            <div className="flex-shrink-0 ml-1">
              {isExpanded ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )}
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <div className={`${depth > 0 ? 'ml-4' : ''}`}>
      {/* Main Item */}
      {hasChildren ? (
        <button
          onClick={handleClick}
          className={`
            group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${isActive 
              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }
            ${isCollapsed ? 'justify-center px-2' : ''}
          `}
          title={isCollapsed ? item.label : undefined}
        >
          {itemContent}
        </button>
      ) : (
        <Link
          href={item.href}
          onClick={handleClick}
          className={`
            group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${isActive 
              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }
            ${isCollapsed ? 'justify-center px-2' : ''}
          `}
          title={isCollapsed ? item.label : undefined}
        >
          {itemContent}
        </Link>
      )}

      {/* Children Items */}
      {hasChildren && isExpanded && !isCollapsed && (
        <div className="mt-1 space-y-1">
          {item.children?.map((child) => (
            <NavigationItem
              key={child.id}
              item={child}
              isCollapsed={false}
              onMobileClick={onMobileClick}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* Collapsed Children Tooltip */}
      {hasChildren && isCollapsed && (
        <div className="hidden group-hover:block absolute left-full top-0 ml-2 z-50">
          <div className="bg-white rounded-lg shadow-lg ring-1 ring-gray-200 py-2 min-w-48">
            <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {item.label}
            </div>
            {item.children?.map((child) => {
              const ChildIconComponent = child.icon;
              const childIsActive = pathname === child.href;
              
              return (
                <Link
                  key={child.id}
                  href={child.href}
                  onClick={onMobileClick}
                  className={`
                    flex items-center gap-3 px-3 py-2 text-sm transition-colors duration-200
                    ${childIsActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <ChildIconComponent size={16} />
                  <span>{child.label}</span>
                  {child.badge && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      {child.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
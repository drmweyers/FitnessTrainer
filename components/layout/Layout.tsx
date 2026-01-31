'use client';

import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  breadcrumbItems?: { label: string; href: string }[];
}

export default function Layout({ children, breadcrumbItems }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuClick={() => setSidebarOpen(true)} 
      />
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        
        <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:ml-16" : "lg:ml-60"
        }`}>
          <main className="flex-1 p-6">
            {breadcrumbItems && (
              <div className="mb-6">
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    {breadcrumbItems.map((item, index) => (
                      <li key={item.href} className="flex items-center">
                        {index > 0 && (
                          <span className="mx-2 text-gray-400">/</span>
                        )}
                        <a
                          href={item.href}
                          className={`text-sm ${
                            index === breadcrumbItems.length - 1
                              ? "text-gray-600 font-medium"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-sm">
              {children}
            </div>
          </main>
          
          <Footer />
        </div>
      </div>
    </div>
  );
} 
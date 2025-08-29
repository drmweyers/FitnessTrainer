'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getNavigationForRole, navigationConfig } from '@/config/navigation';

export default function TestNavigationPage() {
  const { user, isAuthenticated } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'trainer' | 'client'>('admin');

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-yellow-800 mb-4">Authentication Required</h1>
            <p className="text-yellow-700">
              Please log in to test the navigation system. You can use the development login buttons on the login page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentUserNav = getNavigationForRole(user!.role);
  const testRoleNav = getNavigationForRole(selectedRole);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Navigation System Test</h1>
          <p className="text-gray-600">
            Testing the comprehensive navigation system with role-based menu items and authentication.
          </p>
        </div>

        {/* Current User Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Navigation ({user!.role})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentUserNav.map((item) => {
              const IconComponent = item.icon;
              return (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-shrink-0 text-blue-600">
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{item.label}</h3>
                      <p className="text-sm text-gray-500">{item.href}</p>
                    </div>
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.children && (
                    <div className="ml-8 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <div key={child.id} className="flex items-center gap-2 text-sm text-gray-600">
                            <ChildIcon size={16} />
                            <span>{child.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Role Comparison */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Compare Navigation by Role
            </h2>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'trainer' | 'client')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="trainer">Trainer</option>
              <option value="client">Client</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testRoleNav.map((item) => {
              const IconComponent = item.icon;
              return (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-shrink-0 text-gray-600">
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{item.label}</h3>
                      <p className="text-sm text-gray-500">{item.href}</p>
                    </div>
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Navigation</h3>
            <div className="text-3xl font-bold text-blue-600">
              {getNavigationForRole('admin').length}
            </div>
            <p className="text-sm text-gray-500">Total menu items</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Trainer Navigation</h3>
            <div className="text-3xl font-bold text-green-600">
              {getNavigationForRole('trainer').length}
            </div>
            <p className="text-sm text-gray-500">Total menu items</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Client Navigation</h3>
            <div className="text-3xl font-bold text-purple-600">
              {getNavigationForRole('client').length}
            </div>
            <p className="text-sm text-gray-500">Total menu items</p>
          </div>
        </div>

        {/* All Navigation Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            All Navigation Items ({navigationConfig.length} total)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Path
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Badge
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {navigationConfig.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <IconComponent size={16} className="mr-3 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {item.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.href}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          {item.roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                role === 'admin' ? 'bg-red-100 text-red-800' :
                                role === 'trainer' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.badge && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {item.badge}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Testing Instructions</h2>
          <div className="space-y-3 text-blue-800">
            <div className="flex items-start">
              <span className="font-medium mr-2">1.</span>
              <p>Check that the sidebar navigation shows only items for your current role ({user!.role})</p>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">2.</span>
              <p>Test mobile menu by resizing your browser window or using device tools</p>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">3.</span>
              <p>Click navigation items to verify they highlight as active</p>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">4.</span>
              <p>Test the user menu dropdown in the top right corner</p>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">5.</span>
              <p>Try the logout functionality from the user menu</p>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">6.</span>
              <p>Log in with different roles to see how navigation changes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
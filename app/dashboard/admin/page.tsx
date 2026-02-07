'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import ActivityFeed from '@/components/shared/ActivityFeed';
import QuickActions from '@/components/shared/QuickActions';
import { SystemMetrics, RecentSignup, ActivityFeedItem, QuickAction } from '@/types/dashboard';

/**
 * Admin Dashboard
 * 
 * Comprehensive dashboard for system administrators.
 * Features:
 * - System overview with key metrics
 * - User growth analytics
 * - Recent activity feed
 * - Quick administrative actions
 * - System health monitoring
 */
export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    totalTrainers: 0,
    totalClients: 0,
    totalPrograms: 0,
    activeWorkouts: 0,
    revenue: { monthly: 0, yearly: 0, change: 0 },
    systemHealth: { status: 'excellent', uptime: '99.9%', lastBackup: new Date().toISOString() }
  });

  const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([]);
  const [recentActivities] = useState<ActivityFeedItem[]>([]);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Manage Users',
      description: 'Add, edit, or deactivate user accounts',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      href: '/admin/users',
      color: 'blue'
    },
    {
      id: '2',
      title: 'View Reports',
      description: 'Analytics and performance reports',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/admin/reports',
      color: 'green'
    },
    {
      id: '3',
      title: 'System Settings',
      description: 'Configure platform settings',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      href: '/admin/settings',
      color: 'purple'
    },
    {
      id: '4',
      title: 'Support Tickets',
      description: 'Manage customer support requests',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      href: '/admin/support',
      color: 'yellow',
      badge: '3'
    }
  ];

  // Auth protection + data fetching
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/login');
      return;
    }

    if (!isLoading && user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    if (!isLoading && user) {
      const token = localStorage.getItem('accessToken');
      fetch('/api/dashboard/stats', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data) {
            setSystemMetrics(prev => ({
              ...prev,
              totalUsers: result.data.totalUsers ?? prev.totalUsers,
              totalTrainers: result.data.totalTrainers ?? prev.totalTrainers,
              totalClients: result.data.totalClients ?? prev.totalClients,
            }));
            if (result.data.recentSignups) {
              setRecentSignups(result.data.recentSignups);
            }
          }
        })
        .catch(err => console.error('Failed to load admin stats:', err))
        .finally(() => setIsDataLoading(false));
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading state
  if (isLoading || isDataLoading) {
    return (
      <DashboardLayout title="Admin Dashboard" subtitle="System overview and management">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="System overview and management"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin' }
      ]}
      actions={
        <div className="flex space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Generate Report
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            Export Data
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            id="total-users"
            title="Total Users"
            value={systemMetrics.totalUsers}
            change={{
              value: 8.2,
              type: 'increase',
              period: 'vs last month'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            }
            color="blue"
          />
          <StatCard
            id="active-trainers"
            title="Active Trainers"
            value={systemMetrics.totalTrainers}
            change={{
              value: 5.1,
              type: 'increase',
              period: 'vs last month'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
            color="green"
          />
          <StatCard
            id="monthly-revenue"
            title="Monthly Revenue"
            value={`$${systemMetrics.revenue.monthly.toLocaleString()}`}
            change={{
              value: systemMetrics.revenue.change,
              type: 'increase',
              period: 'vs last month'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
            color="yellow"
          />
          <StatCard
            id="active-workouts"
            title="Active Workouts"
            value={systemMetrics.activeWorkouts}
            change={{
              value: 15.3,
              type: 'increase',
              period: 'today'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            color="purple"
          />
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  systemMetrics.systemHealth.status === 'excellent' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {systemMetrics.systemHealth.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemMetrics.systemHealth.uptime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Backup</span>
                <span className="text-sm font-medium text-gray-900">
                  2 hours ago
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Signups</h3>
            <div className="space-y-3">
              {recentSignups.slice(0, 4).map((signup) => (
                <div key={signup.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{signup.name}</p>
                    <p className="text-xs text-gray-600 capitalize">{signup.role}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    signup.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {signup.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Usage</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Programs Created</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemMetrics.totalPrograms}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Clients</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemMetrics.totalClients}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg. Session Time</span>
                <span className="text-sm font-medium text-gray-900">
                  42 minutes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions and Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions
            actions={quickActions}
            title="Administrative Actions"
            gridCols={2}
          />
          <ActivityFeed
            activities={recentActivities}
            maxItems={6}
            showLoadMore={true}
            emptyMessage="No recent system activity"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
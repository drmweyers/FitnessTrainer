'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import ActivityFeed from '@/components/shared/ActivityFeed';
import QuickActions from '@/components/shared/QuickActions';
import {
  ClientOverview,
  ActivityFeedItem,
  QuickAction
} from '@/types/dashboard';

export default function TrainerDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [clientOverview, setClientOverview] = useState<ClientOverview>({
    totalClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    newThisMonth: 0
  });

  const [clients, setClients] = useState<Array<{
    id: string; name: string; email: string; status: string; connectedAt: string
  }>>([]);

  const [recentActivities, setRecentActivities] = useState<ActivityFeedItem[]>([]);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Create Program',
      description: 'Design a new workout program',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      href: '/programs/new',
      color: 'blue'
    },
    {
      id: '2',
      title: 'Add Client',
      description: 'Onboard a new client',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      href: '/clients',
      color: 'green'
    },
    {
      id: '3',
      title: 'View Calendar',
      description: 'Manage appointments and sessions',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/workouts',
      color: 'purple'
    },
    {
      id: '4',
      title: 'Client Reports',
      description: 'View progress and analytics',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/analytics',
      color: 'yellow'
    }
  ];

  // Auth protection + data fetching
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/login');
      return;
    }

    if (!isLoading && user?.role !== 'trainer') {
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
            if (result.data.clientOverview) {
              setClientOverview(result.data.clientOverview);
            }
            if (result.data.clients) {
              setClients(result.data.clients);
            }
          }
        })
        .catch(err => console.error('Failed to load dashboard stats:', err));

      // Fetch activity feed
      fetch('/api/activities?limit=10', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data?.activities) {
            setRecentActivities(result.data.activities);
          }
        })
        .catch(err => console.error('Failed to load activities:', err))
        .finally(() => setIsDataLoading(false));
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading state
  if (isLoading || isDataLoading) {
    return (
      <DashboardLayout title="Trainer Dashboard" subtitle="Manage clients and programs">
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
      title="Trainer Dashboard"
      subtitle="Manage your clients and programs"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Trainer' }
      ]}
      actions={
        <div className="flex space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            New Program
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Add Client
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Client Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            id="total-clients"
            title="Total Clients"
            value={clientOverview.totalClients}
            change={{
              value: 14.3,
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
            id="active-clients"
            title="Active Clients"
            value={clientOverview.activeClients}
            subtitle="currently training"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            color="green"
          />
          <StatCard
            id="new-this-month"
            title="New This Month"
            value={clientOverview.newThisMonth}
            subtitle="clients joined"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
            color="yellow"
          />
          <StatCard
            id="inactive-clients"
            title="Inactive Clients"
            value={clientOverview.inactiveClients}
            subtitle="need attention"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="purple"
          />
        </div>

        {/* Client List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Your Clients</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {clients.length > 0 ? clients.map((client) => (
                <div key={client.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
                      {client.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {client.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {client.email}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {client.status}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No clients yet. Invite clients to get started.
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => router.push('/clients')}
                className="w-full text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                View all clients
              </button>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            {recentActivities.length > 0 ? (
              <ActivityFeed
                activities={recentActivities}
                maxItems={6}
                showLoadMore={false}
                emptyMessage="No recent activity"
              />
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                Activity feed coming soon. Client workout completions and milestones will appear here.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions
          actions={quickActions}
          title="Quick Actions"
          gridCols={4}
        />
      </div>
    </DashboardLayout>
  );
}
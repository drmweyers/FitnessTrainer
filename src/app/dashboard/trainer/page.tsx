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
  ProgramStats, 
  UpcomingSession, 
  ClientProgress, 
  ActivityFeedItem, 
  QuickAction 
} from '@/types/dashboard';

/**
 * Trainer Dashboard
 * 
 * Comprehensive dashboard for fitness trainers.
 * Features:
 * - Client overview and statistics
 * - Program management metrics
 * - Upcoming sessions and appointments
 * - Client progress tracking
 * - Quick actions for common trainer tasks
 */
export default function TrainerDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Mock data - in production, these would come from API calls
  const [clientOverview] = useState<ClientOverview>({
    totalClients: 24,
    activeClients: 20,
    inactiveClients: 4,
    newThisMonth: 3
  });

  const [programStats] = useState<ProgramStats>({
    totalPrograms: 12,
    assignedPrograms: 18,
    completionRate: 87.5,
    averageRating: 4.7
  });

  const [upcomingSessions] = useState<UpcomingSession[]>([
    {
      id: '1',
      clientId: 'c1',
      clientName: 'Sarah Johnson',
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      type: 'workout',
      status: 'confirmed'
    },
    {
      id: '2',
      clientId: 'c2',
      clientName: 'Mike Chen',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:30',
      type: 'consultation',
      status: 'pending'
    },
    {
      id: '3',
      clientId: 'c3',
      clientName: 'Emily Rodriguez',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '16:00',
      type: 'check-in',
      status: 'scheduled'
    },
    {
      id: '4',
      clientId: 'c4',
      clientName: 'David Wilson',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '09:00',
      type: 'workout',
      status: 'confirmed'
    }
  ]);

  const [clientProgress] = useState<ClientProgress[]>([
    {
      clientId: 'c1',
      clientName: 'Sarah Johnson',
      currentProgram: 'Advanced Strength Training',
      progressPercentage: 75,
      lastWorkout: '2 days ago',
      streak: 12
    },
    {
      clientId: 'c2',
      clientName: 'Mike Chen',
      currentProgram: 'Beginner Fitness',
      progressPercentage: 45,
      lastWorkout: '1 day ago',
      streak: 5
    },
    {
      clientId: 'c3',
      clientName: 'Emily Rodriguez',
      currentProgram: 'HIIT Cardio',
      progressPercentage: 90,
      lastWorkout: 'Today',
      streak: 18
    },
    {
      clientId: 'c4',
      clientName: 'David Wilson',
      currentProgram: 'Weight Loss Program',
      progressPercentage: 60,
      lastWorkout: '3 days ago',
      streak: 8
    }
  ]);

  const [recentActivities] = useState<ActivityFeedItem[]>([
    {
      id: '1',
      type: 'workout_completed',
      title: 'Workout Completed',
      description: 'Emily Rodriguez completed HIIT Cardio Session #12',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      user: { id: 'c3', name: 'Emily Rodriguez' }
    },
    {
      id: '2',
      type: 'client_signup',
      title: 'New Client Onboarded',
      description: 'Alex Thompson has been assigned to your training program',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: { id: 'c5', name: 'Alex Thompson' }
    },
    {
      id: '3',
      type: 'milestone_reached',
      title: 'Milestone Achievement',
      description: 'Mike Chen reached his weight loss goal of 10 lbs',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      user: { id: 'c2', name: 'Mike Chen' }
    },
    {
      id: '4',
      type: 'program_assigned',
      title: 'Program Updated',
      description: 'Advanced Strength Training program updated with new exercises',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

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
      href: '/clients/add',
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
      href: '/calendar',
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

  // Auth protection
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/login');
      return;
    }

    if (!isLoading && user?.role !== 'trainer') {
      router.push('/dashboard');
      return;
    }

    if (!isLoading) {
      setIsDataLoading(false);
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
            id="program-completion"
            title="Completion Rate"
            value={`${programStats.completionRate}%`}
            change={{
              value: 5.2,
              type: 'increase',
              period: 'this month'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="yellow"
          />
          <StatCard
            id="program-rating"
            title="Avg Rating"
            value={programStats.averageRating}
            subtitle="out of 5 stars"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
            color="purple"
          />
        </div>

        {/* Upcoming Sessions and Client Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Sessions */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Upcoming Sessions</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {session.clientName}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">
                        {session.type} • {session.date} at {session.time}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      session.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800'
                        : session.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button className="w-full text-sm text-blue-600 hover:text-blue-500 font-medium">
                View full calendar
              </button>
            </div>
          </div>

          {/* Client Progress */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Client Progress</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {clientProgress.map((client) => (
                <div key={client.clientId} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
                      {client.clientName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {client.clientName}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {client.streak} day streak
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {client.currentProgram} • Last workout {client.lastWorkout}
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Progress</span>
                          <span className="text-xs text-gray-900 font-medium">
                            {client.progressPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${client.progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button className="w-full text-sm text-blue-600 hover:text-blue-500 font-medium">
                View all clients
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions and Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions
            actions={quickActions}
            title="Quick Actions"
            gridCols={2}
          />
          <ActivityFeed
            activities={recentActivities}
            maxItems={6}
            showLoadMore={true}
            emptyMessage="No recent client activity"
          />
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">This Month&apos;s Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{programStats.totalPrograms}</p>
              <p className="text-sm text-blue-800">Programs Created</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{programStats.assignedPrograms}</p>
              <p className="text-sm text-green-800">Programs Assigned</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{clientOverview.newThisMonth}</p>
              <p className="text-sm text-purple-800">New Clients</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
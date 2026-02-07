'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import ActivityFeed from '@/components/shared/ActivityFeed';
import QuickActions from '@/components/shared/QuickActions';
import DailyWorkoutView from '@/components/features/WorkoutExecution/DailyWorkoutView';
import { WorkoutSession } from '@/types/workoutLog';
import {
  ProgressSummary,
  ActivityFeedItem,
  QuickAction
} from '@/types/dashboard';

/**
 * Client Dashboard
 * 
 * Comprehensive dashboard for fitness clients.
 * Features:
 * - Today's workout overview
 * - Progress tracking and statistics
 * - Active program details
 * - Recent workout history
 * - Upcoming workouts schedule
 * - Quick actions for common client tasks
 */
export default function ClientDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [progressSummary, setProgressSummary] = useState<ProgressSummary>({
    currentWeight: 0,
    weightGoal: 0,
    workoutStreak: 0,
    totalWorkouts: 0,
    personalRecords: 0,
    measurements: { chest: 0, waist: 0, arms: 0, legs: 0 }
  });

  const [recentActivities] = useState<ActivityFeedItem[]>([]);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Start Workout',
      description: "Begin today's scheduled workout",
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M3 6h18M3 18h18" />
        </svg>
      ),
      href: '/workout-tracker',
      color: 'green'
    },
    {
      id: '2',
      title: 'Log Progress',
      description: 'Update weight and measurements',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/progress',
      color: 'blue'
    },
    {
      id: '3',
      title: 'View Programs',
      description: 'Browse your training programs',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      href: '/programs',
      color: 'purple'
    },
    {
      id: '4',
      title: 'Message Trainer',
      description: 'Contact your personal trainer',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      href: '/messages',
      color: 'yellow'
    }
  ];

  // Auth protection + data fetching
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/login');
      return;
    }

    if (!isLoading && user?.role !== 'client') {
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
          if (result.success && result.data?.progressSummary) {
            const ps = result.data.progressSummary;
            setProgressSummary(prev => ({
              ...prev,
              currentWeight: ps.currentWeight ?? prev.currentWeight,
              totalWorkouts: ps.totalWorkouts ?? prev.totalWorkouts,
              workoutStreak: ps.workoutStreak ?? prev.workoutStreak,
              measurements: ps.measurements ?? prev.measurements,
            }));
          }
        })
        .catch(err => console.error('Failed to load client stats:', err))
        .finally(() => setIsDataLoading(false));
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading state
  if (isLoading || isDataLoading) {
    return (
      <DashboardLayout title="My Fitness Dashboard" subtitle="Track your progress and workouts">
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
      title="My Fitness Dashboard"
      subtitle="Track your progress and stay motivated"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'My Fitness' }
      ]}
      actions={
        <div className="flex space-x-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Start Workout
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Log Progress
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Progress Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            id="workout-streak"
            title="Current Streak"
            value={progressSummary.workoutStreak}
            subtitle="days"
            change={{
              value: 20,
              type: 'increase',
              period: 'vs last month'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            color="green"
          />
          <StatCard
            id="total-workouts"
            title="Total Workouts"
            value={progressSummary.totalWorkouts}
            change={{
              value: 8,
              type: 'increase',
              period: 'this month'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="blue"
          />
          <StatCard
            id="personal-records"
            title="Personal Records"
            value={progressSummary.personalRecords}
            change={{
              value: 2,
              type: 'increase',
              period: 'this month'
            }}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            }
            color="yellow"
          />
          <StatCard
            id="current-weight"
            title="Current Weight"
            value={`${progressSummary.currentWeight} lbs`}
            subtitle={`Goal: ${progressSummary.weightGoal} lbs`}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            color="purple"
          />
        </div>

        {/* Today's Workout */}
        <div className="bg-white rounded-lg border border-gray-200">
          <DailyWorkoutView
            clientId={user?.id || ''}
            onStartWorkout={(session: WorkoutSession) => {
              router.push(`/workouts/${session.workoutLog.id}`);
            }}
          />
        </div>

        {/* Activity + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                Your workout completions and achievements will appear here as you train.
              </div>
            )}
          </div>

          <QuickActions
            actions={quickActions}
            title="Quick Actions"
            gridCols={2}
          />
        </div>

      </div>
    </DashboardLayout>
  );
}
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
import ProfileCompletionWidget from '@/components/features/Dashboard/ProfileCompletionWidget';
import WhatsAppButton from '@/components/shared/WhatsAppButton';

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
 * - Floating WhatsApp button to message trainer
 */
export default function ClientDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [trainerWhatsApp, setTrainerWhatsApp] = useState<{ phone: string; name: string } | null>(null);
  const [trainerWhatsAppLink, setTrainerWhatsAppLink] = useState<string | null>(null);

  const [progressSummary, setProgressSummary] = useState<ProgressSummary>({
    currentWeight: 0,
    weightGoal: 0,
    workoutStreak: 0,
    totalWorkouts: 0,
    personalRecords: 0,
    measurements: { chest: 0, waist: 0, arms: 0, legs: 0 }
  });

  const [recentActivities, setRecentActivities] = useState<ActivityFeedItem[]>([]);

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
      href: '/analytics',
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
      title: 'My Profile',
      description: 'View and update your profile',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      href: '/profile',
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
        .catch(err => console.error('Failed to load client stats:', err));

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

      // Fetch trainer's WhatsApp number for floating button
      fetch('/api/clients/trainer', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
        .then(res => res.ok ? res.json() : null)
        .then(result => {
          if (result?.success && result.data) {
            const trainerData = result.data;
            const trainerName = trainerData.name || trainerData.email?.split('@')[0] || 'Trainer';
            if (trainerData.whatsappNumber) {
              setTrainerWhatsApp({
                phone: trainerData.whatsappNumber,
                name: trainerName,
              });
            }
            if (trainerData.whatsappLink) {
              setTrainerWhatsAppLink(trainerData.whatsappLink);
            }
          }
        })
        .catch(() => { /* trainer endpoint may not exist yet */ });
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

        {/* Profile Completion */}
        <ProfileCompletionWidget />

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

      {/* Floating WhatsApp button to message trainer (phone number) */}
      {trainerWhatsApp && !trainerWhatsAppLink && (
        <WhatsAppButton
          phone={trainerWhatsApp.phone}
          name={trainerWhatsApp.name}
          variant="floating"
        />
      )}

      {/* Floating WhatsApp Business Link button — preferred over phone when available */}
      {trainerWhatsAppLink && (
        <a
          href={
            trainerWhatsAppLink.startsWith('http')
              ? trainerWhatsAppLink
              : `https://${trainerWhatsAppLink}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
          aria-label="Contact trainer on WhatsApp"
        >
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
      )}
    </DashboardLayout>
  );
}
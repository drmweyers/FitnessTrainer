'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import ActivityFeed from '@/components/shared/ActivityFeed';
import QuickActions from '@/components/shared/QuickActions';
import { 
  TodaysWorkout, 
  ProgressSummary, 
  ActiveProgram, 
  RecentWorkout, 
  UpcomingWorkout,
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

  // Mock data - in production, these would come from API calls
  const [todaysWorkout] = useState<TodaysWorkout | null>({
    id: 'w1',
    name: 'Upper Body Strength',
    programName: 'Advanced Strength Training',
    exercises: 8,
    estimatedTime: 45,
    difficulty: 'intermediate',
    completed: false
  });

  const [progressSummary] = useState<ProgressSummary>({
    currentWeight: 165,
    weightGoal: 170,
    workoutStreak: 12,
    totalWorkouts: 47,
    personalRecords: 8,
    measurements: {
      chest: 42,
      waist: 32,
      arms: 15,
      legs: 24
    }
  });

  const [activeProgram] = useState<ActiveProgram>({
    id: 'p1',
    name: 'Advanced Strength Training',
    trainerName: 'Sarah Johnson',
    startDate: '2024-01-15',
    duration: 12,
    progress: 75,
    nextWorkout: 'Upper Body Strength'
  });

  const [recentWorkouts] = useState<RecentWorkout[]>([
    {
      id: 'rw1',
      name: 'Lower Body Power',
      date: '2024-03-20',
      duration: 42,
      exercises: 6,
      rating: 4,
      notes: 'Great session! Felt strong on squats.'
    },
    {
      id: 'rw2',
      name: 'HIIT Cardio',
      date: '2024-03-18',
      duration: 30,
      exercises: 8,
      rating: 5,
      notes: 'Challenging but energizing workout.'
    },
    {
      id: 'rw3',
      name: 'Upper Body Focus',
      date: '2024-03-16',
      duration: 38,
      exercises: 7,
      rating: 4
    },
    {
      id: 'rw4',
      name: 'Core & Flexibility',
      date: '2024-03-14',
      duration: 25,
      exercises: 5,
      rating: 3,
      notes: 'Need to work on flexibility more.'
    }
  ]);

  const [upcomingWorkouts] = useState<UpcomingWorkout[]>([
    {
      id: 'uw1',
      name: 'Lower Body Strength',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '08:00',
      type: 'strength'
    },
    {
      id: 'uw2',
      name: 'Cardio Recovery',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '18:00',
      type: 'cardio'
    },
    {
      id: 'uw3',
      name: 'Rest Day',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'rest'
    },
    {
      id: 'uw4',
      name: 'Full Body Circuit',
      date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '07:30',
      type: 'strength'
    }
  ]);

  const [recentActivities] = useState<ActivityFeedItem[]>([
    {
      id: '1',
      type: 'workout_completed',
      title: 'Workout Completed',
      description: 'You completed Lower Body Power workout in 42 minutes',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      type: 'milestone_reached',
      title: 'Personal Record!',
      description: 'New PR on deadlifts: 225 lbs (+10 lbs)',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      type: 'program_assigned',
      title: 'Program Updated',
      description: 'Your trainer updated your Advanced Strength Training program',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: { id: 't1', name: 'Sarah Johnson' }
    },
    {
      id: '4',
      type: 'milestone_reached',
      title: 'Streak Achievement',
      description: 'Congratulations on your 10-day workout streak!',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

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

  // Auth protection
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/login');
      return;
    }

    if (!isLoading && user?.role !== 'client') {
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

        {/* Today's Workout and Active Program */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Workout */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Workout</h3>
            {todaysWorkout ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">
                      {todaysWorkout.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {todaysWorkout.programName}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                    todaysWorkout.difficulty === 'beginner' 
                      ? 'bg-green-100 text-green-800'
                      : todaysWorkout.difficulty === 'intermediate'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {todaysWorkout.difficulty}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {todaysWorkout.estimatedTime} minutes
                  </div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {todaysWorkout.exercises} exercises
                  </div>
                </div>

                <div className="pt-4">
                  {todaysWorkout.completed ? (
                    <div className="flex items-center text-green-600">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Completed! Great job!
                    </div>
                  ) : (
                    <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium">
                      Start Workout
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">No workout scheduled for today</p>
                <p className="text-sm text-gray-400 mt-1">Take a rest day or choose a workout</p>
              </div>
            )}
          </div>

          {/* Active Program */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Active Program</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-semibold text-gray-900">
                  {activeProgram.name}
                </h4>
                <p className="text-sm text-gray-600">
                  by {activeProgram.trainerName}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{activeProgram.progress}% complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${activeProgram.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="block text-gray-900 font-medium">Duration</span>
                  {activeProgram.duration} weeks
                </div>
                <div>
                  <span className="block text-gray-900 font-medium">Started</span>
                  {new Date(activeProgram.startDate).toLocaleDateString()}
                </div>
              </div>

              {activeProgram.nextWorkout && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Next workout:</p>
                  <p className="font-medium text-gray-900">{activeProgram.nextWorkout}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Workouts */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">This Week's Schedule</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            {upcomingWorkouts.map((workout) => (
              <div key={workout.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    workout.type === 'strength' 
                      ? 'bg-blue-100 text-blue-800'
                      : workout.type === 'cardio'
                      ? 'bg-red-100 text-red-800'
                      : workout.type === 'flexibility'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {workout.type}
                  </span>
                  {workout.time && (
                    <span className="text-xs text-gray-500">{workout.time}</span>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 text-sm">{workout.name}</h4>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(workout.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Workouts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Workouts */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Workouts</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {recentWorkouts.map((workout) => (
                <div key={workout.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {workout.name}
                      </h4>
                      <div className="flex items-center mt-1 text-xs text-gray-600 space-x-4">
                        <span>{new Date(workout.date).toLocaleDateString()}</span>
                        <span>{workout.duration} min</span>
                        <span>{workout.exercises} exercises</span>
                      </div>
                      {workout.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          "{workout.notes}"
                        </p>
                      )}
                    </div>
                    {workout.rating && (
                      <div className="flex items-center ml-4">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${
                              i < workout.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button className="w-full text-sm text-blue-600 hover:text-blue-500 font-medium">
                View workout history
              </button>
            </div>
          </div>

          <ActivityFeed
            activities={recentActivities}
            maxItems={6}
            showLoadMore={true}
            emptyMessage="No recent activity"
          />
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
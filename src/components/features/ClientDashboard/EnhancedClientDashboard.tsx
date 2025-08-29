'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/shared/DashboardLayout';
import InvitationNotifications from '@/components/features/ClientManagement/InvitationNotifications';
import StatCard from '@/components/shared/StatCard';
import ActivityFeed from '@/components/shared/ActivityFeed';
import QuickActions from '@/components/shared/QuickActions';
import { clientConnectionService, TrainerConnection } from '@/services/clientConnectionService';
import { 
  User, 
  UserCheck, 
  Calendar, 
  TrendingUp, 
  Award, 
  Activity,
  Clock,
  Target,
  Dumbbell,
  MessageCircle,
  Users,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ClientStats {
  completedWorkouts: number;
  currentStreak: number;
  programProgress: number;
  achievedGoals: number;
}

interface ActivityFeedItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user?: { id: string; name: string };
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  color: string;
}

const EnhancedClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [trainerConnection, setTrainerConnection] = useState<TrainerConnection | null>(null);
  const [stats, setStats] = useState<ClientStats>({
    completedWorkouts: 0,
    currentStreak: 0,
    programProgress: 0,
    achievedGoals: 0
  });
  const [recentActivities, setRecentActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasTrainer, setHasTrainer] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Try to get trainer connection
      try {
        const connection = await clientConnectionService.getClientTrainer();
        setTrainerConnection(connection);
        setHasTrainer(true);
      } catch (error) {
        // No trainer connection found
        setHasTrainer(false);
        setTrainerConnection(null);
      }

      // Mock stats for now (would come from actual API)
      setStats({
        completedWorkouts: 24,
        currentStreak: 5,
        programProgress: 67,
        achievedGoals: 3
      });

      // Mock recent activities
      setRecentActivities([
        {
          id: '1',
          type: 'workout_completed',
          title: 'Workout Completed',
          description: 'Upper Body Strength - Session 12',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'goal_achieved',
          title: 'Goal Achievement',
          description: 'Reached weekly workout target',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (token: string) => {
    try {
      const connection = await clientConnectionService.acceptInvitation(token);
      setTrainerConnection(connection);
      setHasTrainer(true);
      toast.success('Invitation accepted! You are now connected to your trainer.');
      
      // Refresh dashboard data
      loadDashboardData();
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw error; // Re-throw to be handled by the component
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await clientConnectionService.declineInvitation(invitationId);
      toast.success('Invitation declined.');
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      throw error; // Re-throw to be handled by the component
    }
  };

  const handleDisconnectTrainer = async () => {
    if (!confirm('Are you sure you want to disconnect from your trainer? This action cannot be undone.')) {
      return;
    }

    try {
      await clientConnectionService.disconnectTrainer();
      setTrainerConnection(null);
      setHasTrainer(false);
      toast.success('Successfully disconnected from trainer.');
      
      // Refresh dashboard data
      loadDashboardData();
    } catch (error) {
      console.error('Failed to disconnect trainer:', error);
      toast.error('Failed to disconnect from trainer');
    }
  };

  const getTrainerName = (trainer: TrainerConnection['trainer']) => {
    return trainer.userProfile?.bio || trainer.email.split('@')[0] || 'Your Trainer';
  };

  const quickActions: QuickAction[] = hasTrainer ? [
    {
      id: '1',
      title: 'Start Workout',
      description: 'Begin your scheduled workout',
      icon: <Dumbbell className="h-5 w-5" />,
      href: '/workout',
      color: 'blue'
    },
    {
      id: '2',
      title: 'View Program',
      description: 'Check your training program',
      icon: <Target className="h-5 w-5" />,
      href: '/programs',
      color: 'green'
    },
    {
      id: '3',
      title: 'Message Trainer',
      description: 'Chat with your trainer',
      icon: <MessageCircle className="h-5 w-5" />,
      href: '/messages',
      color: 'purple'
    },
    {
      id: '4',
      title: 'Track Progress',
      description: 'Log measurements and photos',
      icon: <TrendingUp className="h-5 w-5" />,
      href: '/progress',
      color: 'yellow'
    }
  ] : [
    {
      id: '1',
      title: 'Browse Exercises',
      description: 'Explore our exercise library',
      icon: <Dumbbell className="h-5 w-5" />,
      href: '/exercises',
      color: 'blue'
    },
    {
      id: '2',
      title: 'Set Goals',
      description: 'Define your fitness objectives',
      icon: <Target className="h-5 w-5" />,
      href: '/goals',
      color: 'green'
    },
    {
      id: '3',
      title: 'Find Trainers',
      description: 'Connect with personal trainers',
      icon: <Users className="h-5 w-5" />,
      href: '/trainers',
      color: 'purple'
    },
    {
      id: '4',
      title: 'Track Progress',
      description: 'Log your fitness journey',
      icon: <TrendingUp className="h-5 w-5" />,
      href: '/progress',
      color: 'yellow'
    }
  ];

  if (loading) {
    return (
      <DashboardLayout title="Client Dashboard" subtitle="Track your fitness journey">
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
      title="Client Dashboard"
      subtitle={hasTrainer ? `Training with ${getTrainerName(trainerConnection!.trainer)}` : "Your fitness journey starts here"}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Client' }
      ]}
      actions={
        hasTrainer ? (
          <div className="flex space-x-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>Message Trainer</span>
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Invitation Notifications */}
        {user?.email && (
          <InvitationNotifications
            clientEmail={user.email}
            onAcceptInvitation={handleAcceptInvitation}
            onDeclineInvitation={handleDeclineInvitation}
          />
        )}

        {/* Trainer Connection Status */}
        {hasTrainer && trainerConnection ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {getTrainerName(trainerConnection.trainer).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getTrainerName(trainerConnection.trainer)}
                    </h3>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3" />
                      <span>Connected</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <span>{trainerConnection.trainer.email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Connected {new Date(trainerConnection.connectedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors">
                  View Profile
                </button>
                <button 
                  onClick={handleDisconnectTrainer}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Trainer Credentials */}
            {trainerConnection.trainer.trainerCertifications && trainerConnection.trainer.trainerCertifications.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {trainerConnection.trainer.trainerCertifications.slice(0, 2).map((cert, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {cert.certificationName}
                        </span>
                      ))}
                    </div>
                  </div>
                  {trainerConnection.trainer.trainerSpecializations && trainerConnection.trainer.trainerSpecializations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Specializations</h4>
                      <div className="flex flex-wrap gap-2">
                        {trainerConnection.trainer.trainerSpecializations.slice(0, 2).map((spec, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {spec.specialization}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          !hasTrainer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-blue-900">Connect with a Personal Trainer</h3>
                  <p className="text-blue-700 mt-1">
                    Get personalized workout programs, expert guidance, and accountability from certified trainers.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Find Trainers
                </button>
              </div>
            </div>
          )
        )}

        {/* Progress Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            id="completed-workouts"
            title="Completed Workouts"
            value={stats.completedWorkouts}
            change={{
              value: 12.5,
              type: 'increase',
              period: 'this month'
            }}
            icon={<Dumbbell className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            id="current-streak"
            title="Current Streak"
            value={stats.currentStreak}
            subtitle="days active"
            icon={<Activity className="h-5 w-5" />}
            color="green"
          />
          <StatCard
            id="program-progress"
            title="Program Progress"
            value={`${stats.programProgress}%`}
            subtitle="current program"
            icon={<Target className="h-5 w-5" />}
            color="purple"
          />
          <StatCard
            id="achieved-goals"
            title="Goals Achieved"
            value={stats.achievedGoals}
            subtitle="this month"
            icon={<Award className="h-5 w-5" />}
            color="yellow"
          />
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
            emptyMessage="No recent activity"
          />
        </div>

        {/* Weekly Progress Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">This Week's Progress</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">4/5</p>
              <p className="text-sm text-green-800">Workouts Completed</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">5.2h</p>
              <p className="text-sm text-blue-800">Training Time</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">+2.1%</p>
              <p className="text-sm text-purple-800">Performance Increase</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EnhancedClientDashboard;
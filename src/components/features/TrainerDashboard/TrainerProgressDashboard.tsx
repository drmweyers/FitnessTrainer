'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Target,
  MessageSquare,
  Eye,
  RefreshCw,
  Download,
  BarChart3,
  Zap
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import {
  TrainerDashboardData,
  LiveWorkoutData
} from '@/types/workoutLog';

interface TrainerProgressDashboardProps {
  trainerId: string;
}

const TrainerProgressDashboard: React.FC<TrainerProgressDashboardProps> = ({ trainerId }) => {
  const [dashboardData, setDashboardData] = useState<TrainerDashboardData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();

    // Set up real-time updates
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [trainerId, selectedTimeframe]);

  const loadDashboardData = async () => {
    if (!loading) setRefreshing(true);
    
    try {
      // Mock data - in real app, fetch from API
      const mockData: TrainerDashboardData = {
        totalClients: 24,
        activeClients: 18, // worked out in last 7 days
        todaysWorkouts: 12,
        completedToday: 8,
        
        clientsWorkingOut: [
          {
            clientId: 'client-1',
            clientName: 'Sarah Johnson',
            workoutId: 'workout-1',
            workoutName: 'Upper Body Strength',
            status: 'active',
            currentExercise: 'Bench Press',
            currentSet: 2,
            totalSets: 12,
            startTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
            expectedDuration: 60,
            completionPercentage: 45,
            lastActivity: '2 minutes ago'
          },
          {
            clientId: 'client-2',
            clientName: 'Mike Wilson',
            workoutId: 'workout-2',
            workoutName: 'Lower Body Power',
            status: 'resting',
            currentExercise: 'Squats',
            currentSet: 3,
            totalSets: 15,
            startTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 minutes ago
            expectedDuration: 75,
            completionPercentage: 60,
            lastActivity: '30 seconds ago'
          }
        ],
        
        upcomingWorkouts: [
          {
            clientId: 'client-3',
            clientName: 'Emma Davis',
            workoutName: 'Cardio HIIT',
            scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
            programName: 'Fat Loss Program'
          },
          {
            clientId: 'client-4',
            clientName: 'John Smith',
            workoutName: 'Full Body Circuit',
            scheduledTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
            programName: 'General Fitness'
          }
        ],
        
        recentActivity: [
          {
            id: 'activity-1',
            type: 'workout_completed',
            clientId: 'client-5',
            clientName: 'Alex Thompson',
            message: 'Completed "Upper Body Hypertrophy" workout',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            data: { duration: 55, adherence: 100, avgRpe: 7.5 }
          },
          {
            id: 'activity-2',
            type: 'personal_best',
            clientId: 'client-6',
            clientName: 'Lisa Chen',
            message: 'New deadlift PR: 185 lbs x 5 reps',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            data: { exercise: 'Deadlift', weight: 185, reps: 5 }
          },
          {
            id: 'activity-3',
            type: 'feedback_received',
            clientId: 'client-7',
            clientName: 'David Brown',
            message: 'Left feedback on today\'s leg workout',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            data: { rating: 9, notes: 'Felt strong today, ready to increase weight next session' }
          }
        ],
        
        alertsAndConcerns: [
          {
            id: 'alert-1',
            type: 'missed_workouts',
            clientId: 'client-8',
            clientName: 'Jennifer White',
            severity: 'medium',
            message: 'Missed 3 workouts this week',
            actionRequired: 'Check in with client about schedule or program adjustments'
          },
          {
            id: 'alert-2',
            type: 'declining_performance',
            clientId: 'client-9',
            clientName: 'Robert Garcia',
            severity: 'low',
            message: 'RPE scores increasing without weight progression',
            actionRequired: 'Consider deload week or technique review'
          }
        ]
      };

      setDashboardData(mockData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: LiveWorkoutData['status']) => {
    switch (status) {
      case 'warming_up':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'resting':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: LiveWorkoutData['status']) => {
    switch (status) {
      case 'warming_up':
        return <Clock className="h-4 w-4" />;
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'resting':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'border-red-300 bg-red-50 text-red-800';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50 text-yellow-800';
      case 'low':
        return 'border-blue-300 bg-blue-50 text-blue-800';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diffMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Dashboard</h3>
        <p className="text-gray-600 mb-4">Unable to load trainer dashboard data</p>
        <Button onClick={loadDashboardData}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trainer Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor client progress and workout activity</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={refreshing}
            leftIcon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.totalClients}</p>
                <p className="text-xs text-green-600">
                  {dashboardData.activeClients} active this week
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Workouts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.completedToday}/{dashboardData.todaysWorkouts}
                </p>
                <p className="text-xs text-gray-600">
                  {Math.round((dashboardData.completedToday / dashboardData.todaysWorkouts) * 100)}% completed
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Live Workouts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.clientsWorkingOut.length}
                </p>
                <p className="text-xs text-gray-600">clients active now</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Alerts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.alertsAndConcerns.length}
                </p>
                <p className="text-xs text-gray-600">require attention</p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Workouts */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title className="flex items-center">
                  <Play className="h-5 w-5 text-green-500 mr-2" />
                  Live Workouts ({dashboardData.clientsWorkingOut.length})
                </Card.Title>
                <Button variant="outline" size="sm">View All</Button>
              </div>
            </Card.Header>
            <Card.Content>
              {dashboardData.clientsWorkingOut.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No clients currently working out</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.clientsWorkingOut.map(workout => (
                    <div key={workout.clientId} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {workout.clientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{workout.clientName}</h4>
                            <p className="text-sm text-gray-600">{workout.workoutName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workout.status)}`}>
                            {getStatusIcon(workout.status)}
                            <span className="ml-1 capitalize">{workout.status.replace('_', ' ')}</span>
                          </span>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{workout.completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${workout.completionPercentage}%` }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{workout.currentExercise} - Set {workout.currentSet}/{workout.totalSets}</span>
                          <span>{formatTimeAgo(workout.startTime)} • {workout.lastActivity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Recent Activity */}
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center">
                <Activity className="h-5 w-5 text-blue-500 mr-2" />
                Recent Activity
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {dashboardData.recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      {activity.type === 'workout_completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {activity.type === 'personal_best' && <TrendingUp className="h-5 w-5 text-purple-600" />}
                      {activity.type === 'feedback_received' && <MessageSquare className="h-5 w-5 text-blue-600" />}
                      {activity.type === 'missed_workout' && <AlertTriangle className="h-5 w-5 text-orange-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">{activity.clientName}</p>
                        <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-600">{activity.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Workouts */}
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                Upcoming Today
              </Card.Title>
            </Card.Header>
            <Card.Content>
              {dashboardData.upcomingWorkouts.length === 0 ? (
                <p className="text-gray-600 text-sm">No upcoming workouts today</p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.upcomingWorkouts.map((workout, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{workout.clientName}</p>
                        <p className="text-xs text-gray-600">{workout.workoutName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-900">
                          {new Date(workout.scheduledTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Alerts & Concerns */}
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                Alerts & Concerns
              </Card.Title>
            </Card.Header>
            <Card.Content>
              {dashboardData.alertsAndConcerns.length === 0 ? (
                <p className="text-gray-600 text-sm">No alerts at this time</p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.alertsAndConcerns.map(alert => (
                    <div key={alert.id} className={`border rounded-lg p-3 ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm">{alert.clientName}</p>
                        <span className="text-xs uppercase font-medium">{alert.severity}</span>
                      </div>
                      <p className="text-sm mb-2">{alert.message}</p>
                      {alert.actionRequired && (
                        <p className="text-xs font-medium">Action: {alert.actionRequired}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Quick Actions */}
          <Card>
            <Card.Header>
              <Card.Title>Quick Actions</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-2">
                <Button className="w-full justify-start" variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button className="w-full justify-start" variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button className="w-full justify-start" variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Clients
                </Button>
                <Button className="w-full justify-start" variant="outline" size="sm">
                  <Target className="h-4 w-4 mr-2" />
                  Create Program
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrainerProgressDashboard;
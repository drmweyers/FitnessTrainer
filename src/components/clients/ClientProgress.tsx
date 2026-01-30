/**
 * ClientProgress Component
 *
 * Displays progress charts and stats for a client.
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Activity, Target, Award } from 'lucide-react';

interface ClientProgressProps {
  clientId: string;
}

export function ClientProgress({ clientId: _clientId }: ClientProgressProps) {
  // In a real implementation, you would fetch client-specific progress data
  // This is a placeholder showing the structure
  const progressStats = {
    totalWorkouts: 24,
    completedThisMonth: 8,
    avgSessionDuration: 55,
    totalVolume: 125000,
    improvementRate: 12,
  };

  const recentAchievements = [
    { id: '1', title: '30 Workouts', date: '2024-01-15' },
    { id: '2', title: '100K Total Volume', date: '2024-01-10' },
    { id: '3', title: 'Consistency Streak', date: '2024-01-05' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Progress Overview</h2>
        <p className="text-gray-600">Client's performance metrics and achievements</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Workouts"
          value={progressStats.totalWorkouts}
          icon={<Activity className="h-5 w-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="This Month"
          value={progressStats.completedThisMonth}
          icon={<Target className="h-5 w-5 text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Avg Duration"
          value={`${progressStats.avgSessionDuration}min`}
          icon={<Clock className="h-5 w-5 text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          title="Total Volume"
          value={`${(progressStats.totalVolume / 1000).toFixed(0)}K`}
          icon={<TrendingUp className="h-5 w-5 text-orange-600" />}
          color="bg-orange-50"
        />
      </div>

      {/* Improvement Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Improvement Rate</p>
              <p className="text-3xl font-bold text-green-600">
                +{progressStats.improvementRate}%
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-600" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Compared to previous month
          </p>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAchievements.length > 0 ? (
            <div className="space-y-3">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <Award className="h-5 w-5 text-yellow-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-800">{achievement.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(achievement.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No achievements yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Clock({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

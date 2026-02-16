'use client';

import { useState, useEffect } from 'react';
import { Activity, User, Calendar, FileText, Settings } from 'lucide-react';

interface ActivityLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  timestamp: string;
  details?: string;
}

// Mock data - in production, this would come from an API endpoint
const MOCK_ACTIVITIES: ActivityLogEntry[] = [
  {
    id: '1',
    userId: 'user-1',
    userName: 'John Trainer',
    userRole: 'trainer',
    action: 'created',
    resource: 'appointment',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    details: 'Created appointment with Sarah Client',
  },
  {
    id: '2',
    userId: 'user-2',
    userName: 'Sarah Client',
    userRole: 'client',
    action: 'completed',
    resource: 'workout',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    details: 'Completed "Upper Body Strength"',
  },
  {
    id: '3',
    userId: 'user-3',
    userName: 'Admin User',
    userRole: 'admin',
    action: 'updated',
    resource: 'user',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    details: 'Updated profile settings for John Trainer',
  },
  {
    id: '4',
    userId: 'user-1',
    userName: 'John Trainer',
    userRole: 'trainer',
    action: 'created',
    resource: 'program',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    details: 'Created program "Beginner Strength Training"',
  },
  {
    id: '5',
    userId: 'user-2',
    userName: 'Sarah Client',
    userRole: 'client',
    action: 'logged_in',
    resource: 'auth',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

export function ActivityLog() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setActivities(MOCK_ACTIVITIES);
      setIsLoading(false);
    }, 500);
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'text-green-600 bg-green-50';
      case 'updated':
        return 'text-blue-600 bg-blue-50';
      case 'deleted':
        return 'text-red-600 bg-red-50';
      case 'completed':
        return 'text-purple-600 bg-purple-50';
      case 'logged_in':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'appointment':
        return <Calendar size={14} />;
      case 'workout':
      case 'program':
        return <FileText size={14} />;
      case 'user':
        return <User size={14} />;
      case 'auth':
        return <Settings size={14} />;
      default:
        return <Activity size={14} />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Activity size={20} />
          Recent Activity
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Real-time log of user actions across the platform
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No recent activity
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    p-2 rounded-lg ${getActionColor(activity.action)}
                  `}>
                    {getResourceIcon(activity.resource)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {activity.userName}
                      </span>
                      <span className={`
                        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${activity.userRole === 'admin' ? 'bg-red-100 text-red-700' :
                          activity.userRole === 'trainer' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'}
                      `}>
                        {activity.userRole}
                      </span>
                      <span className={`
                        text-xs font-medium px-2 py-0.5 rounded-full
                        ${getActionColor(activity.action)}
                      `}>
                        {activity.action}
                      </span>
                      <span className="text-xs text-gray-500">
                        {activity.resource}
                      </span>
                    </div>
                    {activity.details && (
                      <p className="text-sm text-gray-600">{activity.details}</p>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {formatTimestamp(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

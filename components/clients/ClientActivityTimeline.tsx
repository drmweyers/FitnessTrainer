'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Dumbbell, TrendingUp, Calendar, MessageSquare } from 'lucide-react';

interface Activity {
  id: string;
  type: 'workout' | 'measurement' | 'program_assigned' | 'message' | 'goal_updated';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ClientActivityTimelineProps {
  clientId: string;
  activities?: Activity[];
  limit?: number;
}

/**
 * ClientActivityTimeline Component
 *
 * Shows a timeline of recent client actions (workouts, measurements, messages, etc).
 * Displays the last 5-10 items by default.
 */
export default function ClientActivityTimeline({
  clientId,
  activities = [],
  limit = 10,
}: ClientActivityTimelineProps) {
  // Mock data for demo (in real app, this would come from API)
  const mockActivities: Activity[] = activities.length > 0 ? activities : [
    {
      id: '1',
      type: 'workout',
      description: 'Completed "Upper Body Strength"',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
      id: '2',
      type: 'measurement',
      description: 'Recorded body measurements',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
    {
      id: '3',
      type: 'program_assigned',
      description: 'Started new program "Strength Builder"',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    },
    {
      id: '4',
      type: 'workout',
      description: 'Completed "Leg Day"',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    },
    {
      id: '5',
      type: 'goal_updated',
      description: 'Updated fitness goal',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    },
  ];

  const displayedActivities = mockActivities.slice(0, limit);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'workout':
        return <Dumbbell className="h-4 w-4 text-blue-600" />;
      case 'measurement':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'program_assigned':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-orange-600" />;
      case 'goal_updated':
        return <TrendingUp className="h-4 w-4 text-pink-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <Clock className="h-5 w-5 text-gray-500 mr-2" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayedActivities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {displayedActivities.map((activity, index) => (
              <div key={activity.id} className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatTimestamp(activity.timestamp)}</p>
                </div>

                {/* Connector Line (except for last item) */}
                {index < displayedActivities.length - 1 && (
                  <div className="absolute left-[22px] w-px h-6 bg-gray-200 mt-6" />
                )}
              </div>
            ))}
          </div>
        )}

        {displayedActivities.length > 0 && mockActivities.length > limit && (
          <p className="text-xs text-gray-500 text-center mt-4">
            Showing {displayedActivities.length} of {mockActivities.length} activities
          </p>
        )}
      </CardContent>
    </Card>
  );
}

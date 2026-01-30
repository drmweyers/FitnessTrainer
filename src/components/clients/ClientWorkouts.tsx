/**
 * ClientWorkouts Component
 *
 * Displays client's workout list with filtering.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Dumbbell } from 'lucide-react';
import { useWorkouts } from '@/hooks/useWorkouts';

interface ClientWorkoutsProps {
  clientId: string;
  limit?: number;
}

export function ClientWorkouts({ clientId, limit = 10 }: ClientWorkoutsProps) {
  const { data: workouts, isLoading } = useWorkouts({ clientId, limit });
  const [dateFilter, setDateFilter] = useState<string>('all');

  const filteredWorkouts = workouts?.filter((workout: any) => {
    if (dateFilter !== 'all') {
      const workoutDate = new Date(workout.startTime).toISOString().split('T')[0];
      return workoutDate === dateFilter;
    }
    return true;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">Loading workouts...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Workout History</h2>
          <p className="text-gray-600">Client's past workout sessions</p>
        </div>
        <Link href={`/clients/${clientId}/history`}>
          <Button variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            View All
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Time</option>
          <option value={new Date().toISOString().split('T')[0]}>Today</option>
          <option value={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>
            Last 7 Days
          </option>
          <option value={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>
            Last 30 Days
          </option>
        </select>
      </div>

      {/* Workout List */}
      {filteredWorkouts && filteredWorkouts.length > 0 ? (
        <div className="space-y-3">
          {filteredWorkouts.map((workout: any) => (
            <WorkoutSummaryCard key={workout.id} workout={workout} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Dumbbell className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No workout history found</p>
            <p className="text-sm text-gray-400">
              Client needs to start logging workouts
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface WorkoutSummaryCardProps {
  workout: any;
}

function WorkoutSummaryCard({ workout }: WorkoutSummaryCardProps) {
  const date = new Date(workout.startTime);
  const duration = workout.endTime
    ? Math.round((new Date(workout.endTime).getTime() - date.getTime()) / 60000)
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {date.toLocaleDateString()}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {workout.programWorkout?.name || 'Workout'}
            </p>
          </div>
          <Badge
            variant={workout.status === 'completed' ? 'default' : 'secondary'}
          >
            {workout.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Sets</p>
            <p className="font-semibold">{workout.completedSets || 0}/{workout.totalSets}</p>
          </div>
          <div>
            <p className="text-gray-500">Volume</p>
            <p className="font-semibold">{workout.totalVolume || 0} lbs</p>
          </div>
          <div>
            <p className="text-gray-500">Duration</p>
            <p className="font-semibold">{duration ? `${duration}min` : '-'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

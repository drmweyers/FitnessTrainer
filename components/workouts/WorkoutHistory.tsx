/**
 * WorkoutHistory Component
 *
 * Displays list of past workout sessions with filtering.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Target, TrendingUp } from 'lucide-react';
import { useWorkouts, useWorkout } from '@/hooks/useWorkouts';

interface WorkoutHistoryProps {
  clientId?: string;
  limit?: number;
}

export function WorkoutHistory({ clientId, limit = 10 }: WorkoutHistoryProps) {
  const { data: workouts, isLoading } = useWorkouts({ clientId, limit });
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('all');

  const filteredWorkouts = (Array.isArray(workouts) ? workouts : []).filter((workout) => {
    if (dateFilter !== 'all') {
      const workoutDate = new Date(workout.startTime || workout.scheduledDate || '').toISOString().split('T')[0];
      return workoutDate >= dateFilter;
    }
    return true;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">Loading history...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Workout History</h2>
        <p className="text-gray-600 mb-4">Your past workout sessions</p>
      </div>

      {selectedWorkout && (
        <WorkoutDetail
          workoutId={selectedWorkout}
          onClose={() => setSelectedWorkout(null)}
        />
      )}

      {!selectedWorkout && (
        <>
          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value={new Date().toISOString().split('T')[0]}>Today</SelectItem>
                <SelectItem value={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>
                  Last 7 Days
                </SelectItem>
                <SelectItem value={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>
                  Last 30 Days
                </SelectItem>
              </SelectContent>
            </Select>

            <Link href="/workouts/progress">
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Progress
              </Button>
            </Link>
          </div>

          {/* Workout List */}
          {filteredWorkouts && filteredWorkouts.length > 0 ? (
            <div className="space-y-3">
              {filteredWorkouts.map((workout) => (
                <WorkoutSummaryCard
                  key={workout.id}
                  workout={workout}
                  onSelect={() => setSelectedWorkout(workout.id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No workout history found</p>
                <p className="text-sm text-gray-400">
                  Start logging workouts to see your history here
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

interface WorkoutSummaryCardProps {
  workout: any;
  onSelect: () => void;
}

function WorkoutSummaryCard({ workout, onSelect }: WorkoutSummaryCardProps) {
  const date = new Date(workout.startTime || workout.scheduledDate || '');
  const duration = workout.endTime
    ? Math.round((new Date(workout.endTime).getTime() - date.getTime()) / 60000)
    : null;

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {!isNaN(date.getTime()) ? date.toLocaleDateString() : 'Unknown Date'}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {workout.programWorkout?.name || workout.workout?.name || 'Workout'}
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

function WorkoutDetail({ workoutId, onClose }: { workoutId: string; onClose: () => void }) {
  const { data: workout } = useWorkout(workoutId);

  if (!workout) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Workout Details</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Session Info</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Date</p>
                <p>{new Date(workout.startTime || workout.scheduledDate || '').toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Program</p>
                <p>{workout.program?.name || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="capitalize">{workout.status}</p>
              </div>
            </div>
          </div>

          {workout.exerciseLogs && workout.exerciseLogs.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4">Exercises</h3>
              <div className="space-y-4">
                {workout.exerciseLogs.map((exerciseLog: any, idx: number) => (
                  <Card key={exerciseLog.id || idx}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {idx + 1}. {exerciseLog.exercise?.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {exerciseLog.setLogs?.map((setLog: any, setIdx: number) => (
                        <div
                          key={setLog.id || setIdx}
                          className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                        >
                          <div>
                            <span className="text-gray-500">Set {setIdx + 1}:</span>
                            <span className="ml-2">
                              {setLog.actualReps} reps @ {setLog.actualWeight || '-'} lbs
                            </span>
                            {setLog.rpe && (
                              <span className="ml-2 text-gray-500">
                                (RPE {setLog.rpe})
                              </span>
                            )}
                          </div>
                          {setLog.notes && (
                            <p className="text-xs text-gray-500">{setLog.notes}</p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {workout.notes && (
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{workout.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

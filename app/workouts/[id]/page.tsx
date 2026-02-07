/**
 * Workout Detail Page
 *
 * View and manage a specific workout session.
 */

'use client';

import { useWorkout } from '@/hooks/useWorkouts';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, TrendingUp } from 'lucide-react';
import { ActiveWorkoutSession } from '@/components/workouts/ActiveWorkoutSession';

export default function WorkoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workoutId = params.id as string;
  
  const { data: workout, isLoading, error } = useWorkout(workoutId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">Loading workout...</CardContent>
        </Card>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600 mb-4">Failed to load workout</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = workout.status === 'in_progress';
  const date = new Date(workout.startTime);
  const duration = workout.endTime
    ? Math.round((new Date(workout.endTime).getTime() - date.getTime()) / 60000)
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {workout.programWorkout?.name || 'Workout Session'}
            </h1>
            <p className="text-gray-600">
              {workout.program?.name || 'Individual Workout'}
            </p>
          </div>
          <Badge
            variant={isActive ? 'default' : workout.status === 'completed' ? 'default' : 'secondary'}
          >
            {(workout.status || 'planned').replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {isActive ? (
        <ActiveWorkoutSession />
      ) : (
        <div className="space-y-6">
          {/* Session Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{date.toLocaleDateString()}</p>
                <p className="text-sm text-gray-500">{date.toLocaleTimeString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{duration ? `${duration} min` : '-'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{workout.totalVolume || 0} lbs</p>
                <p className="text-sm text-gray-500">
                  {workout.completedSets || 0} sets
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Exercise Logs */}
          {workout.exerciseLogs && workout.exerciseLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Exercises</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {workout.exerciseLogs.map((exerciseLog: any, idx: number) => (
                    <div key={exerciseLog.id || idx} className="border-b pb-4 last:border-0">
                      <h3 className="font-semibold mb-3">
                        {idx + 1}. {exerciseLog.exercise?.name}
                      </h3>
                      
                      {exerciseLog.setLogs && exerciseLog.setLogs.length > 0 && (
                        <div className="space-y-2 ml-4">
                          {exerciseLog.setLogs.map((setLog: any, setIdx: number) => (
                            <div
                              key={setLog.id || setIdx}
                              className="flex items-center justify-between text-sm py-2 px-3 bg-gray-50 rounded"
                            >
                              <div>
                                <span className="text-gray-600">Set {setIdx + 1}:</span>
                                <span className="ml-3 font-medium">
                                  {setLog.actualReps} reps @ {setLog.actualWeight || '-'} lbs
                                </span>
                                {setLog.rpe && (
                                  <span className="ml-2 text-gray-500">
                                    (RPE {setLog.rpe})
                                  </span>
                                )}
                              </div>
                              {setLog.setType && (
                                <Badge variant="outline" className="text-xs">
                                  {setLog.setType}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {workout.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{workout.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

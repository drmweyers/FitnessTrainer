/**
 * WorkoutLogger Component
 *
 * Main interface for logging an active workout session.
 * Shows exercises, sets to log, and overall progress.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Plus } from 'lucide-react';
import { ActiveWorkoutSession } from './ActiveWorkoutSession';
import { useActiveWorkout } from '@/hooks/useWorkouts';

export function WorkoutLogger() {
  const { data: activeWorkout } = useActiveWorkout();
  const [showActiveSession, setShowActiveSession] = useState(false);

  return (
    <div className="container py-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workout Logger</h1>
          <p className="text-gray-600">Log your workout session</p>
        </div>
        <Button onClick={() => setShowActiveSession(!showActiveSession)}>
          {showActiveSession ? 'Hide' : 'Show'} Active Workout
        </Button>
      </div>

      {showActiveSession ? (
        <ActiveWorkoutSession clientId={undefined} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Play className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Active Workout</h3>
            <p className="text-gray-500 mb-6">
              Start a workout from your program to begin tracking
            </p>
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Start Workout
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

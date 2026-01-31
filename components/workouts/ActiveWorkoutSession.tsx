/**
 * ActiveWorkoutSession Component
 *
 * Displays the currently active workout with exercises and sets.
 * Shows progress and allows completing the workout.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, Calendar, Target } from 'lucide-react';
import { useActiveWorkout, useCompleteWorkout, useLogSet } from '@/hooks/useWorkouts';
import { SetLogger } from './SetLogger';
import { RestTimer } from './RestTimer';

export function ActiveWorkoutSession({ clientId }: { clientId?: string }) {
  const { data: workout, isLoading } = useActiveWorkout();
  const completeWorkout = useCompleteWorkout();
  const logSet = useLogSet();
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  const handleCompleteSet = (setData: any) => {
    logSet.mutate(
      { sessionId: workout?.id || '', setData },
      {
        onSuccess: () => {
          // Move to next set or exercise
          const currentExercise = workout?.exerciseLogs?.[currentExerciseIndex];
          if (currentExercise && setData.actualReps < (currentExercise.targetReps?.split('-')[1] || 0)) {
            // Set complete, move to next
            setCurrentExerciseIndex((prev) => Math.min(prev + 1, (workout?.exerciseLogs?.length || 1) - 1));
          }
        },
      }
    );
  };

  const handleCompleteWorkout = () => {
    if (workout?.id) {
      completeWorkout.mutate(
        { sessionId: workout.id, notes: 'Workout completed!' },
        {
          onSuccess: () => {
            setShowRestTimer(false);
            setCurrentExerciseIndex(0);
          },
        }
      );
    }
  };

  const handleRestComplete = () => {
    setShowRestTimer(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">Loading active workout...</p>
        </CardContent>
      </Card>
    );
  }

  if (!workout) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <Target className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Workout</h3>
          <p className="text-gray-500 mb-6">
            Start a workout from your program to begin tracking
          </p>
          <p className="text-sm text-gray-400">
            (Program functionality will be available soon)
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentExercise = workout.exerciseLogs?.[currentExerciseIndex];
  const totalExercises = workout.exerciseLogs?.length || 0;
  const completedExercises = workout.exerciseLogs?.filter((log) =>
    log.setLogs?.some((set: any) => set.actualReps >= (set.targetReps?.split('-')[1] || 0))
  ).length || 0;

  const progress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Workout Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{workout.programWorkout?.name || 'Workout'}</h2>
              <p className="text-gray-500">
                {workout.program?.name} • Week {workout.weekNumber}, Day {workout.dayNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Started: {new Date(workout.startTime).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>
                {completedExercises} / {totalExercises} exercises
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{workout.totalSets || 0}</p>
              <p className="text-xs text-gray-500">Total Sets</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{workout.completedSets || 0}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{workout.totalVolume || '0'}</p>
              <p className="text-xs text-gray-500">Volume (lbs)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rest Timer Modal */}
      {showRestTimer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <RestTimer
              initialSeconds={90}
              onComplete={handleRestComplete}
              onClose={() => setShowRestTimer(false)}
            />
          </div>
        </div>
      )}

      {/* Current Exercise */}
      {currentExercise && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">
                  Exercise {currentExerciseIndex + 1} of {totalExercises}
                </h3>
                <p className="text-gray-600">{currentExercise.exercise?.name}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowRestTimer(true)}
              >
                <Clock className="h-4 w-4 mr-2" />
                Rest Timer
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Exercise Details */}
            <div className="bg-gray-50 p-4 rounded">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Target:</span>
                  <strong> {currentExercise.targetReps}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Rest:</span>
                  <strong> {currentExercise.restSeconds}s</strong>
                </div>
                {currentExercise.targetWeight && (
                  <div>
                    <span className="text-gray-500">Weight:</span>
                    <strong> {currentExercise.targetWeight}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Sets */}
            <div className="space-y-2">
              <h4 className="font-semibold mb-2">Sets</h4>
              {currentExercise.setLogs?.map((setLog: any, idx: number) => (
                <SetLogger
                  key={setLog.id || idx}
                  exerciseId={currentExercise.exercise?.id || ''}
                  exerciseName={currentExercise.exercise?.name || ''}
                  setNumber={idx + 1}
                  previousBest={setLog.previousBest}
                  onLogSet={handleCompleteSet}
                  readOnly={setLog.actualReps > 0}
                />
              ))}

              {/* Add Set Button */}
              {!currentExercise.setLogs || currentExercise.setLogs.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No sets logged yet
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Workout Button */}
      {workout.status !== 'completed' && (
        <Button
          size="lg"
          className="w-full"
          onClick={handleCompleteWorkout}
          disabled={progress < 100}
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Complete Workout
        </Button>
      )}
    </div>
  );
}

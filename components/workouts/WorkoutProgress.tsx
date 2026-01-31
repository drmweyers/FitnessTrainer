/**
 * Workout Progress Charts Component
 *
 * Visualizes progress over time with charts.
 * Shows volume, weight progression, and reps trends.
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity } from 'lucide-react';
import { useWorkoutProgress } from '@/hooks/useWorkouts';

interface WorkoutProgressProps {
  exerciseId?: string;
  clientId?: string;
  timeRange?: '1W' | '1M' | '3M' | '6M' | '1Y';
}

export function WorkoutProgress({ exerciseId, clientId, timeRange = '1M' }: WorkoutProgressProps) {
  const { data: progress, isLoading } = useWorkoutProgress(exerciseId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">Loading progress...</CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <Activity className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Progress Data</h3>
          <p className="text-gray-500">
            Complete workouts to track your progress over time
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Workout Progress</h2>
        <p className="text-gray-600">Track your improvement over time</p>
      </div>

      {progress.personalRecords && progress.personalRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {progress.personalRecords.slice(0, 5).map((record: any, idx: number) => (
                <div key={record.id || idx} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{record.exercise?.name}</p>
                    <p className="text-sm text-gray-500">
                      {record.date} • {record.sets} sets @ {record.weight} lbs
                    </p>
                  </div>
                  <Badge variant="secondary">PR</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Volume Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-gray-500">
              <TrendingUp className="h-8 w-8 mb-2" />
              <p>Chart coming soon</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weight Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-gray-500">
              <Activity className="h-8 w-8 mb-2" />
              <p>Chart coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

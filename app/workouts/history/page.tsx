/*
 * Workout Page
 */

'use client';
/**
 * Workout History Page
 *
 * View past workout sessions and statistics.
 */

import { WorkoutHistory } from '@/components/workouts/WorkoutHistory';

export default function WorkoutHistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <WorkoutHistory />
    </div>
  );
}

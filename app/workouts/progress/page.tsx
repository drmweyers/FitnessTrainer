/*
 * Workout Page
 */

'use client';
/**
 * Workout Progress Page
 *
 * View progress charts and personal records.
 */

import { WorkoutProgress } from '@/components/workouts/WorkoutProgress';

export default function WorkoutProgressPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <WorkoutProgress />
    </div>
  );
}

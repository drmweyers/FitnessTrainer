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
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workout History | EvoFit Trainer',
  description: 'View your past workout sessions and progress',
};

export default function WorkoutHistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <WorkoutHistory />
    </div>
  );
}

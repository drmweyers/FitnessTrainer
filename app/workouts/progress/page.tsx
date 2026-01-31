/**
 * Workout Progress Page
 *
 * View progress charts and personal records.
 */

import { WorkoutProgress } from '@/components/workouts/WorkoutProgress';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workout Progress | EvoFit Trainer',
  description: 'Track your progress over time with detailed charts',
};

export default function WorkoutProgressPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <WorkoutProgress />
    </div>
  );
}

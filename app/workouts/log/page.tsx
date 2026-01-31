/*
 * Workout Page
 */

'use client';
/**
 * Workout Log Page
 *
 * Main page for starting and tracking active workouts.
 */

import { WorkoutLogger } from '@/components/workouts/WorkoutLogger';

// Force dynamic rendering for React Query
export const dynamic = 'force-dynamic'

export default function WorkoutLogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Workout Log</h1>
        <p className="text-gray-600">Start and track your workout sessions</p>
      </div>
      
      <WorkoutLogger />
    </div>
  );
}

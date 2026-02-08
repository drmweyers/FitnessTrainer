/*
 * Workout History Page
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WorkoutHistory } from '@/components/workouts/WorkoutHistory';

// Force dynamic rendering for React Query
export const dynamic = 'force-dynamic'

export default function WorkoutHistoryPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <WorkoutHistory />
    </div>
  );
}

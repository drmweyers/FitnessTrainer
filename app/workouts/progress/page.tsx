/*
 * Workout Progress Page
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WorkoutProgress } from '@/components/workouts/WorkoutProgress';

// Force dynamic rendering for React Query
export const dynamic = 'force-dynamic'

export default function WorkoutProgressPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <WorkoutProgress />
    </div>
  );
}

/**
 * Create New Program Page — Trainer/Admin only
 */

'use client';

import { useState, useEffect } from 'react';
import ProgramBuilder from '@/components/features/ProgramBuilder/ProgramBuilder';
import { ProgramBuilderProvider } from '@/components/features/ProgramBuilder/ProgramBuilderContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createProgram } from '@/lib/api/programs';
import type { ProgramData } from '@/types/program';

export default function NewProgramPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      window.location.replace('/auth/login')
      return
    }
    if (user.role === 'client') {
      window.location.replace('/programs')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Fire redirect synchronously from render path so navigation starts before effects run.
  if (!user) {
    if (typeof window !== 'undefined') window.location.replace('/auth/login')
    return null
  }
  if (user.role === 'client') {
    if (typeof window !== 'undefined') window.location.replace('/programs')
    return null
  }

  /**
   * Called by ProgramPreview (step 5) inside the new builder.
   * The builder already assembles the full ProgramData payload
   * (weeks → workouts → exercises → configurations), so we pass
   * it straight through to the API without re-mapping.
   */
  const handleSave = async (programData: ProgramData, _saveAsTemplate: boolean): Promise<void> => {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      await createProgram(programData, token);
      router.push('/programs');
    } catch (err) {
      console.error('Error saving program:', err);
      if (err instanceof Error) {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          localStorage.removeItem('accessToken');
          router.push('/auth/login');
          return;
        }
        setError(err.message);
      } else {
        setError('Failed to save program. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mx-4 mt-4">
          {error}
        </div>
      )}
      <ProgramBuilderProvider>
        <ProgramBuilder
          onSave={handleSave}
          onCancel={() => router.back()}
        />
      </ProgramBuilderProvider>
    </div>
  );
}

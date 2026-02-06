/**
 * Create New Program Page
 */

'use client';

import { useState } from 'react';
import { ProgramBuilder } from '@/components/programs/ProgramBuilder';
import { useRouter } from 'next/navigation';
import { createProgram } from '@/lib/api/programs';
import type { Program, ProgramData } from '@/types/program';

export default function NewProgramPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (program: Program) => {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const programData: ProgramData = {
        name: program.name,
        description: program.description,
        programType: program.programType,
        difficultyLevel: program.difficultyLevel,
        durationWeeks: program.durationWeeks,
        goals: program.goals,
        equipmentNeeded: program.equipmentNeeded,
        isTemplate: program.isTemplate,
        weeks: program.weeks?.map(week => ({
          weekNumber: week.weekNumber,
          name: week.name,
          description: week.description,
          isDeload: week.isDeload,
          workouts: week.workouts?.map(workout => ({
            dayNumber: workout.dayNumber,
            name: workout.name,
            description: workout.description,
            workoutType: workout.workoutType,
            estimatedDuration: workout.estimatedDuration,
            isRestDay: workout.isRestDay,
            exercises: workout.exercises?.map(exercise => ({
              exerciseId: exercise.exerciseId,
              orderIndex: exercise.orderIndex,
              supersetGroup: exercise.supersetGroup,
              setsConfig: exercise.setsConfig,
              notes: exercise.notes,
              configurations: exercise.configurations?.map(config => ({
                setNumber: config.setNumber,
                setType: config.setType,
                reps: config.reps,
                weightGuidance: config.weightGuidance,
                restSeconds: config.restSeconds,
                tempo: config.tempo,
                rpe: config.rpe,
                rir: config.rir,
                notes: config.notes,
              })),
            })),
          })),
        })),
      };

      const created = await createProgram(programData, token);
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
    <div className="container py-8">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      <ProgramBuilder onSave={handleSave} onCancel={() => router.back()} />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import DailyWorkoutView from '@/components/features/WorkoutExecution/DailyWorkoutView';
import WorkoutExecutionScreen from '@/components/features/WorkoutExecution/WorkoutExecutionScreen';
import { WorkoutSession, WorkoutLog } from '@/types/workoutLog';
import { useToast, ToastContainer } from '@/components/shared/Toast';

export default function WorkoutTrackerPage() {
  const [currentView, setCurrentView] = useState<'daily' | 'execution'>('daily');
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [clientId, _setClientId] = useState<string>('client-1'); // In real app, get from auth
  const _router = useRouter();
  const { toasts, success, error, removeToast } = useToast();

  // Check for active session on mount (in case of page refresh)
  useEffect(() => {
    const savedSession = localStorage.getItem('activeWorkoutSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setActiveSession(session);
        setCurrentView('execution');
      } catch (error) {
        console.error('Failed to restore workout session:', error);
        localStorage.removeItem('activeWorkoutSession');
      }
    }
  }, []);

  const handleStartWorkout = (session: WorkoutSession) => {
    setActiveSession(session);
    setCurrentView('execution');
    
    // Save session to localStorage for persistence
    localStorage.setItem('activeWorkoutSession', JSON.stringify(session));
    
    success(
      'Workout Started!', 
      `Started "${session.workoutLog.workoutName}". Good luck!`,
      4000
    );
  };

  const handleUpdateSession = (updatedSession: WorkoutSession) => {
    setActiveSession(updatedSession);
    
    // Update localStorage
    localStorage.setItem('activeWorkoutSession', JSON.stringify(updatedSession));
  };

  const handleCompleteWorkout = async (completedSession: WorkoutSession) => {
    try {
      // In real app, save workout log to backend
      const workoutLog = completedSession.workoutLog;
      
      console.log('Saving completed workout:', workoutLog);
      
      // Calculate workout summary
      const totalVolume = workoutLog.exercises.reduce((total, exercise) => {
        return total + exercise.sets.reduce((exerciseVolume, set) => {
          return exerciseVolume + (set.weight || 0) * set.reps;
        }, 0);
      }, 0);
      
      const completedSets = workoutLog.exercises.reduce((total, exercise) => {
        return total + exercise.sets.filter(set => set.completed).length;
      }, 0);
      
      const totalSets = workoutLog.exercises.reduce((total, exercise) => {
        return total + exercise.sets.length;
      }, 0);
      
      const adherenceRate = Math.round((completedSets / totalSets) * 100);

      // Update workout log with summary
      const finalWorkoutLog = {
        ...workoutLog,
        totalVolume,
        adherenceScore: adherenceRate,
        averageRpe: calculateAverageRPE(workoutLog)
      };

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clean up
      setActiveSession(null);
      setCurrentView('daily');
      localStorage.removeItem('activeWorkoutSession');

      // Show success with summary
      success(
        '🎉 Workout Complete!',
        `Great job! ${adherenceRate}% completion, ${totalVolume.toLocaleString()} lbs total volume`,
        8000
      );

      // Could redirect to workout summary page
      // router.push(`/workouts/summary/${workoutLog.id}`);

    } catch (err) {
      console.error('Failed to save workout:', err);
      error('Save Failed', 'Failed to save workout. Please try again.');
    }
  };

  const handleExitWorkout = () => {
    if (activeSession) {
      const confirmExit = window.confirm(
        'Are you sure you want to exit this workout? Your progress will be saved as a draft.'
      );
      
      if (confirmExit) {
        // Save as draft
        const draftSession = {
          ...activeSession,
          workoutLog: {
            ...activeSession.workoutLog,
            status: 'skipped' as const,
            actualEndTime: new Date().toISOString()
          }
        };

        // Save draft to backend (mock)
        console.log('Saving workout draft:', draftSession.workoutLog);

        setActiveSession(null);
        setCurrentView('daily');
        localStorage.removeItem('activeWorkoutSession');

        success('Workout Saved', 'Your progress has been saved as a draft.');
      }
    } else {
      setCurrentView('daily');
    }
  };

  const calculateAverageRPE = (workoutLog: WorkoutLog): number => {
    const allRPEs = workoutLog.exercises.flatMap(exercise => 
      exercise.sets.map(set => set.rpe).filter(rpe => rpe !== undefined)
    ) as number[];

    if (allRPEs.length === 0) return 0;
    return Math.round((allRPEs.reduce((sum, rpe) => sum + rpe, 0) / allRPEs.length) * 10) / 10;
  };

  return (
    <>
      {currentView === 'daily' ? (
        <div className="p-6">
          <DailyWorkoutView
            clientId={clientId}
            onStartWorkout={handleStartWorkout}
          />
        </div>
      ) : (
        // Full-screen workout execution
        activeSession && (
          <WorkoutExecutionScreen
            session={activeSession}
            onUpdateSession={handleUpdateSession}
            onCompleteWorkout={handleCompleteWorkout}
            onExitWorkout={handleExitWorkout}
          />
        )
      )}
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
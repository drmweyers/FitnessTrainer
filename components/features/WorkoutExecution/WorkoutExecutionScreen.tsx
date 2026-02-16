'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Timer,
  CheckCircle,
  Plus,
  Minus,
  SkipForward,
  Flag,
  MessageSquare,
  Star,
  Activity,
  Clock,
  Target,
  Zap,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Volume2,
  VolumeX,
  TrendingDown,
  Infinity
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { WorkoutSession, WorkoutLogSet, ExerciseLog } from '@/types/workoutLog';
import { useToast } from '@/components/shared/Toast';

interface WorkoutExecutionScreenProps {
  session: WorkoutSession;
  onUpdateSession: (session: WorkoutSession) => void;
  onCompleteWorkout: (session: WorkoutSession) => void;
  onExitWorkout: () => void;
}

const WorkoutExecutionScreen: React.FC<WorkoutExecutionScreenProps> = ({
  session,
  onUpdateSession,
  onCompleteWorkout,
  onExitWorkout
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { success, warning, error: showError } = useToast();

  const currentExercise = session.workoutLog.exercises[session.currentExerciseIndex];
  const currentSet = currentExercise?.sets[session.currentSetIndex];
  const isLastExercise = session.currentExerciseIndex === session.workoutLog.exercises.length - 1;
  const isLastSet = session.currentSetIndex === currentExercise?.sets.length - 1;

  // Timer effect
  useEffect(() => {
    if (session.isTimerRunning && !session.isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session.isTimerRunning, session.isPaused]);

  // Sound notification when rest timer completes
  useEffect(() => {
    if (session.isTimerRunning && session.timerStartTime && session.restTimerDuration) {
      const elapsed = (currentTime - session.timerStartTime) / 1000;
      if (elapsed >= session.restTimerDuration && soundEnabled) {
        playNotificationSound();
        success('Rest Complete!', 'Time to start your next set');
      }
    }
  }, [currentTime, session.timerStartTime, session.restTimerDuration, soundEnabled, success]);

  const playNotificationSound = () => {
    // In a real app, you'd play an actual sound file
    if (soundEnabled) {
      // Web Audio API beep or load sound file
      console.log('🔔 Rest timer complete!');
    }
  };

  const startRestTimer = (duration: number = 90) => {
    const updatedSession = {
      ...session,
      isTimerRunning: true,
      timerStartTime: Date.now(),
      restTimerDuration: duration,
      isPaused: false
    };
    onUpdateSession(updatedSession);
  };

  const pauseTimer = () => {
    const updatedSession = {
      ...session,
      isPaused: true,
      pausedAt: Date.now()
    };
    onUpdateSession(updatedSession);
  };

  const resumeTimer = () => {
    const pauseDuration = Date.now() - (session.pausedAt || 0);
    const updatedSession = {
      ...session,
      isPaused: false,
      pausedAt: undefined,
      totalPausedTime: session.totalPausedTime + pauseDuration
    };
    onUpdateSession(updatedSession);
  };

  const stopTimer = () => {
    const updatedSession = {
      ...session,
      isTimerRunning: false,
      timerStartTime: undefined,
      restTimerDuration: undefined,
      isPaused: false
    };
    onUpdateSession(updatedSession);
  };

  const updateCurrentSet = (updates: Partial<WorkoutLogSet>) => {
    const updatedExercises = [...session.workoutLog.exercises];
    const updatedSets = [...currentExercise.sets];
    updatedSets[session.currentSetIndex] = {
      ...currentSet,
      ...updates,
      timestamp: new Date().toISOString()
    };
    updatedExercises[session.currentExerciseIndex] = {
      ...currentExercise,
      sets: updatedSets
    };

    const updatedSession = {
      ...session,
      workoutLog: {
        ...session.workoutLog,
        exercises: updatedExercises
      }
    };
    onUpdateSession(updatedSession);
  };

  const markSetComplete = (autoRest: boolean = true) => {
    updateCurrentSet({ completed: true });
    
    success('Set Complete!', `Great work on that set!`);

    // Auto-start rest timer if not the last set
    if (autoRest && !isLastSet) {
      const restTime = currentExercise.sets[session.currentSetIndex]?.restTime || 90;
      startRestTimer(restTime);
    }
  };

  const moveToNextSet = () => {
    if (isLastSet) {
      moveToNextExercise();
    } else {
      const updatedSession = {
        ...session,
        currentSetIndex: session.currentSetIndex + 1
      };
      onUpdateSession(updatedSession);
      stopTimer();
    }
  };

  const moveToPreviousSet = () => {
    if (session.currentSetIndex > 0) {
      const updatedSession = {
        ...session,
        currentSetIndex: session.currentSetIndex - 1
      };
      onUpdateSession(updatedSession);
      stopTimer();
    }
  };

  const moveToNextExercise = () => {
    if (isLastExercise) {
      // Workout complete
      const completedWorkoutLog = {
        ...session.workoutLog,
        actualEndTime: new Date().toISOString(),
        status: 'completed' as const,
        totalDuration: Math.round((Date.now() - new Date(session.workoutLog.actualStartTime!).getTime()) / 60000)
      };

      const completedSession = {
        ...session,
        workoutLog: completedWorkoutLog
      };

      onCompleteWorkout(completedSession);
      success('Workout Complete!', 'Excellent work today!');
    } else {
      const updatedSession = {
        ...session,
        currentExerciseIndex: session.currentExerciseIndex + 1,
        currentSetIndex: 0
      };
      onUpdateSession(updatedSession);
      stopTimer();
    }
  };

  const skipExercise = () => {
    const updatedExercises = [...session.workoutLog.exercises];
    updatedExercises[session.currentExerciseIndex] = {
      ...currentExercise,
      skipped: true,
      notes: (currentExercise.notes || '') + ' [Exercise skipped]'
    };

    const updatedSession = {
      ...session,
      workoutLog: {
        ...session.workoutLog,
        exercises: updatedExercises
      }
    };
    onUpdateSession(updatedSession);

    warning('Exercise Skipped', 'Moving to next exercise');
    moveToNextExercise();
  };

  const getWorkoutProgress = () => {
    const totalSets = session.workoutLog.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const completedSets = session.workoutLog.exercises.reduce((sum, ex) => 
      sum + ex.sets.filter(set => set.completed).length, 0
    );
    return { completed: completedSets, total: totalSets };
  };

  const getRestTimeRemaining = () => {
    if (!session.isTimerRunning || !session.timerStartTime || !session.restTimerDuration) {
      return 0;
    }
    const elapsed = (currentTime - session.timerStartTime) / 1000;
    return Math.max(0, session.restTimerDuration - elapsed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to check if a set is AMRAP
  const isAMRAPSet = (setIndex: number): boolean => {
    // In a real app, this would check the exercise configuration
    // For now, we'll check if the set has specific AMRAP markers
    // This would come from the workout template/program configuration
    return false; // Placeholder - would check exercise.configurations[setIndex].setType === 'amrap'
  };

  // Helper to check if a set underperformed (completed reps < prescribed reps)
  const isFailedSet = (set: WorkoutLogSet, setIndex: number): boolean => {
    // This would compare actual reps to prescribed reps from the program
    // For now, we'll use a simple heuristic: if RPE is 10 and reps are lower than previous sets
    if (!set.completed || !set.reps) return false;

    // Check if there's a previous set to compare against
    if (setIndex > 0) {
      const previousSet = currentExercise.sets[setIndex - 1];
      if (previousSet.completed && previousSet.reps > 0) {
        // If this set has significantly fewer reps (more than 2 less) than previous set at same/higher weight
        const repsDrop = previousSet.reps - set.reps;
        const sameOrMoreWeight = (set.weight || 0) >= (previousSet.weight || 0);
        return repsDrop > 2 && sameOrMoreWeight;
      }
    }
    return false;
  };

  const progress = getWorkoutProgress();
  const progressPercentage = (progress.completed / progress.total) * 100;
  const restTimeRemaining = getRestTimeRemaining();

  if (!currentExercise || !currentSet) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Workout Data Error</h2>
          <p className="text-gray-600 mb-4">Unable to load workout information</p>
          <Button onClick={onExitWorkout}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onExitWorkout}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Exit Workout
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{session.workoutLog.workoutName}</h1>
                <p className="text-sm text-gray-600">
                  Exercise {session.currentExerciseIndex + 1} of {session.workoutLog.exercises.length}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg ${soundEnabled ? 'text-blue-600 bg-blue-50' : 'text-gray-400 bg-gray-50'}`}
              >
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Workout Progress</span>
              <span>{progress.completed}/{progress.total} sets</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Exercise Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentExercise.exerciseName}
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Set {session.currentSetIndex + 1} of {currentExercise.sets.length}</span>
                    {currentExercise.supersetGroup && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        Superset {currentExercise.supersetGroup}
                      </span>
                    )}
                    {isAMRAPSet(session.currentSetIndex) && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center">
                        <Infinity size={14} className="mr-1" />
                        AMRAP
                      </span>
                    )}
                  </div>
                </div>
                <Flag className="h-8 w-8 text-blue-600" />
              </div>

              {/* Set Input Controls */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCurrentSet({ 
                        weight: Math.max(0, (currentSet.weight || 0) - 5)
                      })}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={currentSet.weight || ''}
                      onChange={(e) => updateCurrentSet({ weight: parseFloat(e.target.value) || 0 })}
                      className="w-20 text-center"
                      placeholder="0"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCurrentSet({ 
                        weight: (currentSet.weight || 0) + 5
                      })}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className={isAMRAPSet(session.currentSetIndex) ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isAMRAPSet(session.currentSetIndex) ? (
                      <span className="flex items-center">
                        Reps <Infinity size={14} className="ml-1 text-orange-600" />
                        <span className="ml-1 text-orange-600">(AMRAP)</span>
                      </span>
                    ) : (
                      'Reps'
                    )}
                  </label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCurrentSet({
                        reps: Math.max(0, currentSet.reps - 1)
                      })}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={currentSet.reps || ''}
                      onChange={(e) => updateCurrentSet({ reps: parseInt(e.target.value) || 0 })}
                      className={`w-20 text-center ${isAMRAPSet(session.currentSetIndex) ? 'ring-2 ring-orange-300 font-bold text-lg' : ''}`}
                      placeholder="0"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCurrentSet({ reps: currentSet.reps + 1 })}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">RPE</label>
                  <select
                    value={currentSet.rpe || ''}
                    onChange={(e) => updateCurrentSet({ rpe: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-</option>
                    <option value="6">6 (Easy)</option>
                    <option value="7">7 (Moderate)</option>
                    <option value="8">8 (Hard)</option>
                    <option value="9">9 (Very Hard)</option>
                    <option value="10">10 (Max)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">RIR</label>
                  <select
                    value={currentSet.rir || ''}
                    onChange={(e) => updateCurrentSet({ rir: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-</option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4+</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => markSetComplete()}
                  disabled={currentSet.completed}
                  className="flex-1 min-w-0"
                  leftIcon={<CheckCircle className="h-5 w-5" />}
                >
                  {currentSet.completed ? 'Set Complete' : 'Complete Set'}
                </Button>

                {currentSet.completed && (
                  <Button
                    variant="outline"
                    onClick={moveToNextSet}
                    leftIcon={<ChevronRight className="h-5 w-5" />}
                  >
                    {isLastSet ? 'Next Exercise' : 'Next Set'}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={skipExercise}
                  leftIcon={<SkipForward className="h-5 w-5" />}
                >
                  Skip Exercise
                </Button>
              </div>

              {/* Notes */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Set Notes</label>
                <textarea
                  value={currentSet.notes || ''}
                  onChange={(e) => updateCurrentSet({ notes: e.target.value })}
                  placeholder="How did this set feel? Any observations?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rest Timer */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rest Timer</h3>
                
                {session.isTimerRunning ? (
                  <div className="space-y-4">
                    <div className={`text-4xl font-bold ${restTimeRemaining <= 10 ? 'text-red-600' : 'text-blue-600'}`}>
                      {formatTime(restTimeRemaining)}
                    </div>
                    <div className="flex justify-center space-x-2">
                      {session.isPaused ? (
                        <Button onClick={resumeTimer} leftIcon={<Play className="h-4 w-4" />}>
                          Resume
                        </Button>
                      ) : (
                        <Button onClick={pauseTimer} leftIcon={<Pause className="h-4 w-4" />}>
                          Pause
                        </Button>
                      )}
                      <Button variant="outline" onClick={stopTimer} leftIcon={<Square className="h-4 w-4" />}>
                        Stop
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Timer className="w-12 h-12 text-gray-400 mx-auto" />
                    <div className="flex flex-col space-y-2">
                      <Button onClick={() => startRestTimer(60)} size="sm">1 min</Button>
                      <Button onClick={() => startRestTimer(90)} size="sm">1.5 min</Button>
                      <Button onClick={() => startRestTimer(120)} size="sm">2 min</Button>
                      <Button onClick={() => startRestTimer(180)} size="sm">3 min</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Exercise History */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Sets</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {currentExercise.sets.map((set, index) => {
                  const isFailed = isFailedSet(set, index);
                  const isAMRAP = isAMRAPSet(index);

                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded-lg border ${
                        index === session.currentSetIndex
                          ? 'bg-blue-50 border-blue-200'
                          : isFailed
                          ? 'bg-orange-50 border-orange-300 border-l-4'
                          : set.completed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Set {index + 1}</span>
                        {isAMRAP && <Infinity size={14} className="text-orange-600" />}
                        {set.completed && !isFailed && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {isFailed && (
                          <span title="Underperformed vs previous set">
                            <TrendingDown className="h-4 w-4 text-orange-600" />
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {set.weight || 0}lbs × {set.reps || 0}
                        {set.rpe && ` @${set.rpe}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutExecutionScreen;
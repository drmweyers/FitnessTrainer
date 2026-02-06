'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Calendar,
  Clock,
  Target,
  Zap,
  CheckCircle,
  Eye,
  Star,
  TrendingUp,
  Activity,
  MessageSquare,
  Dumbbell,
  Award
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { WorkoutLog, WorkoutSession } from '@/types/workoutLog';

interface DailyWorkoutViewProps {
  clientId: string;
  selectedDate?: string;
  onStartWorkout: (session: WorkoutSession) => void;
}

interface TodayWorkout {
  id: string;
  name: string;
  programName: string;
  programId: string;
  assignmentId: string;
  scheduledDate: string;
  estimatedDuration: number;
  workoutType: string;
  isCompleted: boolean;
  lastAttempt?: string;
  exercises: Array<{
    id: string;
    name: string;
    sets: Array<{
      reps: string;
      weight?: string;
      restTime?: number;
    }>;
    equipment: string;
    bodyPart: string;
    targetMuscle: string;
  }>;
  trainerNotes?: string;
}

const DailyWorkoutView: React.FC<DailyWorkoutViewProps> = ({
  clientId,
  selectedDate = new Date().toISOString().split('T')[0],
  onStartWorkout
}) => {
  const [todaysWorkouts, setTodaysWorkouts] = useState<TodayWorkout[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState({
    completedWorkouts: 0,
    totalWorkouts: 0,
    currentStreak: 0,
    weeklyGoal: 4
  });
  const [recentAchievements, setRecentAchievements] = useState<Array<{
    id: string;
    type: 'personal_best' | 'consistency' | 'milestone';
    title: string;
    description: string;
    date: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDailyWorkouts();
    loadWeeklyProgress();
    loadRecentAchievements();
  }, [clientId, selectedDate]);

  const loadDailyWorkouts = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_URL}/workouts/today`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Transform API data to match component structure
        const transformedWorkout: TodayWorkout = {
          id: result.data.id,
          name: result.data.name,
          programName: result.data.programName,
          programId: result.data.programId,
          assignmentId: result.data.assignmentId,
          scheduledDate: result.data.scheduledDate || selectedDate,
          estimatedDuration: result.data.estimatedDuration || 60,
          workoutType: result.data.workoutType || 'strength',
          isCompleted: result.data.isCompleted || false,
          lastAttempt: result.data.lastAttempt,
          exercises: result.data.exercises?.map((ex: any) => ({
            id: ex.id,
            name: ex.name,
            sets: ex.sets?.map((set: any) => ({
              reps: set.reps || '8-10',
              weight: set.weight ? `${set.weight} lbs` : undefined,
              restTime: set.restTime || 180,
            })) || [],
            equipment: ex.equipment || 'N/A',
            bodyPart: ex.bodyPart || 'N/A',
            targetMuscle: ex.targetMuscle || 'N/A',
          })) || [],
          trainerNotes: result.data.trainerNotes,
        };

        setTodaysWorkouts([transformedWorkout]);
      } else {
        // No workout scheduled for today
        setTodaysWorkouts([]);
      }
    } catch (error) {
      console.error('Failed to load daily workouts:', error);
      setTodaysWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyProgress = async () => {
    // Mock weekly progress data
    setWeeklyProgress({
      completedWorkouts: 3,
      totalWorkouts: 4,
      currentStreak: 7,
      weeklyGoal: 4
    });
  };

  const loadRecentAchievements = async () => {
    // Mock achievements
    setRecentAchievements([
      {
        id: '1',
        type: 'personal_best',
        title: 'New Bench Press PR!',
        description: 'Hit 145 lbs for 8 reps',
        date: '2024-02-20'
      },
      {
        id: '2',
        type: 'consistency',
        title: '7-Day Streak!',
        description: 'Completed workouts 7 days in a row',
        date: '2024-02-19'
      }
    ]);
  };

  const createWorkoutSession = (workout: TodayWorkout): WorkoutSession => {
    // Convert workout to workout session format
    const workoutLog: WorkoutLog = {
      id: `log-${Date.now()}`,
      programAssignmentId: workout.assignmentId,
      workoutId: workout.id,
      workoutName: workout.name,
      clientId,
      trainerId: 'trainer-1', // Would come from assignment
      scheduledDate: workout.scheduledDate,
      actualStartTime: new Date().toISOString(),
      status: 'in_progress',
      exercises: workout.exercises.map((exercise, index) => ({
        id: `log-ex-${exercise.id}`,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        orderIndex: index,
        sets: exercise.sets.map((set, setIndex) => ({
          id: `log-set-${exercise.id}-${setIndex}`,
          setNumber: setIndex + 1,
          reps: 0,
          weight: parseFloat(set.weight?.replace(' lbs', '') || '0'),
          restTime: set.restTime,
          completed: false
        })),
        skipped: false
      }))
    };

    return {
      workoutLog,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      isTimerRunning: false,
      isPaused: false,
      totalPausedTime: 0
    };
  };

  const handleStartWorkout = (workout: TodayWorkout) => {
    const session = createWorkoutSession(workout);
    onStartWorkout(session);
  };

  const getWorkoutTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'strength':
        return 'bg-red-100 text-red-800';
      case 'cardio':
        return 'bg-green-100 text-green-800';
      case 'hiit':
        return 'bg-orange-100 text-orange-800';
      case 'flexibility':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading today's workouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {formatDate(selectedDate)} Workouts
          </h1>
          <p className="text-gray-600 mt-1">
            {todaysWorkouts.length > 0 
              ? `${todaysWorkouts.length} workout${todaysWorkouts.length !== 1 ? 's' : ''} scheduled`
              : 'No workouts scheduled'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              // In real app, update selected date and reload data
              console.log('Date changed:', e.target.value);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Weekly Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {weeklyProgress.completedWorkouts}/{weeklyProgress.totalWorkouts}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">
                  {weeklyProgress.currentStreak} days
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Weekly Goal</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((weeklyProgress.completedWorkouts / weeklyProgress.weeklyGoal) * 100)}%
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Award className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Achievements</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recentAchievements.length}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <Star className="h-5 w-5 text-yellow-500 mr-2" />
              Recent Achievements
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex space-x-4 overflow-x-auto">
              {recentAchievements.map(achievement => (
                <div
                  key={achievement.id}
                  className="flex-shrink-0 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 min-w-64"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      {achievement.type === 'personal_best' && <TrendingUp className="h-5 w-5 text-yellow-600" />}
                      {achievement.type === 'consistency' && <Zap className="h-5 w-5 text-yellow-600" />}
                      {achievement.type === 'milestone' && <Award className="h-5 w-5 text-yellow-600" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(achievement.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Today's Workouts */}
      <div className="space-y-4">
        {todaysWorkouts.length === 0 ? (
          <Card>
            <Card.Content className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Workouts Scheduled</h3>
              <p className="text-gray-600">
                {formatDate(selectedDate) === 'Today' 
                  ? 'Enjoy your rest day or check with your trainer for additional workouts.'
                  : `No workouts scheduled for ${formatDate(selectedDate).toLowerCase()}.`
                }
              </p>
            </Card.Content>
          </Card>
        ) : (
          todaysWorkouts.map(workout => (
            <Card key={workout.id} className="hover:shadow-md transition-shadow">
              <Card.Content className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{workout.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getWorkoutTypeColor(workout.workoutType)}`}>
                        {workout.workoutType}
                      </span>
                      {workout.isCompleted && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{workout.programName}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {workout.estimatedDuration} min
                      </div>
                      <div className="flex items-center">
                        <Dumbbell className="h-4 w-4 mr-1" />
                        {workout.exercises.length} exercises
                      </div>
                      <div className="flex items-center">
                        <Activity className="h-4 w-4 mr-1" />
                        {workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} sets
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exercise Preview */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Exercise Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {workout.exercises.slice(0, 6).map((exercise) => (
                      <div key={exercise.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900">{exercise.name}</span>
                          <span className="text-xs text-gray-500">{exercise.sets.length} sets</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {exercise.sets[0].reps} reps @ {exercise.sets[0].weight}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {exercise.bodyPart} • {exercise.equipment}
                        </div>
                      </div>
                    ))}
                    {workout.exercises.length > 6 && (
                      <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-center">
                        <span className="text-sm text-gray-600">
                          +{workout.exercises.length - 6} more
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trainer Notes */}
                {workout.trainerNotes && (
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">Trainer Notes</p>
                        <p className="text-sm text-blue-800">{workout.trainerNotes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {workout.lastAttempt && (
                      <span>Last completed: {new Date(workout.lastAttempt).toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye className="h-4 w-4" />}
                    >
                      Preview
                    </Button>
                    
                    {workout.isCompleted ? (
                      <Button
                        variant="outline"
                        leftIcon={<CheckCircle className="h-4 w-4" />}
                      >
                        View Results
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleStartWorkout(workout)}
                        leftIcon={<Play className="h-4 w-4" />}
                      >
                        Start Workout
                      </Button>
                    )}
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DailyWorkoutView;
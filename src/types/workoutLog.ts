// Workout logging and tracking types for Epic 007

export interface WorkoutLogSet {
  id?: string;
  setNumber: number;
  reps: number;
  weight?: number;
  rpe?: number; // 1-10 scale
  rir?: number; // Reps in Reserve
  duration?: number; // in seconds for cardio/timed exercises
  restTime?: number; // actual rest taken in seconds
  completed: boolean;
  notes?: string;
  timestamp?: string;
}

export interface ExerciseLog {
  id?: string;
  exerciseId: string;
  workoutExerciseId?: string;
  exerciseName: string;
  orderIndex: number;
  supersetGroup?: string;
  sets: WorkoutLogSet[];
  totalVolume?: number; // weight * reps summed
  personalBest?: boolean;
  skipped: boolean;
  notes?: string;
  startTime?: string;
  endTime?: string;
}

export interface WorkoutLog {
  id?: string;
  programAssignmentId: string;
  workoutId: string;
  workoutName: string;
  clientId: string;
  trainerId: string;
  scheduledDate: string;
  actualStartTime?: string;
  actualEndTime?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'missed';
  
  // Workout data
  exercises: ExerciseLog[];
  
  // Session metrics
  totalDuration?: number; // in minutes
  totalVolume?: number; // sum of all weight * reps
  averageRpe?: number;
  adherenceScore?: number; // percentage of exercises completed as planned
  
  // Feedback
  effortRating?: number; // 1-10 how hard the workout felt
  enjoymentRating?: number; // 1-10 how much they enjoyed it  
  energyBefore?: number; // 1-10 energy level before
  energyAfter?: number; // 1-10 energy level after
  clientNotes?: string;
  trainerFeedback?: string;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutSession {
  workoutLog: WorkoutLog;
  currentExerciseIndex: number;
  currentSetIndex: number;
  isTimerRunning: boolean;
  timerStartTime?: number;
  restTimerDuration?: number;
  isPaused: boolean;
  pausedAt?: number;
  totalPausedTime: number;
}

// Progress tracking types
export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  measurements: Array<{
    date: string;
    weight: number;
    reps: number;
    rpe?: number;
    volume: number;
    personalBest?: boolean;
  }>;
  trends: {
    strengthGain: number; // percentage over time period
    volumeGain: number; // percentage over time period  
    consistency: number; // percentage of scheduled sessions completed
  };
}

export interface ClientProgress {
  clientId: string;
  programId: string;
  programName: string;
  totalWorkouts: number;
  completedWorkouts: number;
  adherenceRate: number;
  averageRpe: number;
  totalVolume: number;
  strengthGains: number; // percentage
  exercises: ExerciseProgress[];
  recentWorkouts: WorkoutLog[];
  milestones: Array<{
    id: string;
    type: 'personal_best' | 'consistency' | 'volume' | 'strength_gain';
    title: string;
    description: string;
    achievedAt: string;
    value?: number;
  }>;
}

// Real-time workout data for trainer monitoring
export interface LiveWorkoutData {
  clientId: string;
  clientName: string;
  workoutId: string;
  workoutName: string;
  status: 'warming_up' | 'active' | 'resting' | 'completed';
  currentExercise: string;
  currentSet: number;
  totalSets: number;
  startTime: string;
  expectedDuration: number;
  actualDuration?: number;
  completionPercentage: number;
  lastActivity: string;
}

// Analytics and reporting types
export interface WorkoutAnalytics {
  period: 'week' | 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  
  // Overall metrics
  totalWorkouts: number;
  completedWorkouts: number;
  adherenceRate: number;
  averageDuration: number;
  totalVolume: number;
  
  // Trends
  workoutFrequency: Array<{
    date: string;
    count: number;
  }>;
  
  volumeProgression: Array<{
    date: string;
    volume: number;
  }>;
  
  strengthProgression: Array<{
    exerciseId: string;
    exerciseName: string;
    progression: Array<{
      date: string;
      maxWeight: number;
      maxReps: number;
    }>;
  }>;
  
  // Performance insights
  bestPerformanceDays: string[]; // day names
  preferredWorkoutDuration: number;
  mostImprovedExercises: string[];
  strugglingExercises: string[];
}

export interface TrainerDashboardData {
  totalClients: number;
  activeClients: number; // worked out in last 7 days
  todaysWorkouts: number;
  completedToday: number;
  
  clientsWorkingOut: LiveWorkoutData[];
  upcomingWorkouts: Array<{
    clientId: string;
    clientName: string;
    workoutName: string;
    scheduledTime: string;
    programName: string;
  }>;
  
  recentActivity: Array<{
    id: string;
    type: 'workout_completed' | 'personal_best' | 'missed_workout' | 'feedback_received';
    clientId: string;
    clientName: string;
    message: string;
    timestamp: string;
    data?: any;
  }>;
  
  alertsAndConcerns: Array<{
    id: string;
    type: 'missed_workouts' | 'declining_performance' | 'low_adherence' | 'injury_risk';
    clientId: string;
    clientName: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    actionRequired?: string;
  }>;
}
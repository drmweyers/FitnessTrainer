// Program builder types that match backend API

export enum ProgramType {
  STRENGTH = 'strength',
  HYPERTROPHY = 'hypertrophy',
  ENDURANCE = 'endurance',
  POWERLIFTING = 'powerlifting',
  OLYMPIC_WEIGHTLIFTING = 'olympic_weightlifting',
  CROSSFIT = 'crossfit',
  CALISTHENICS = 'calisthenics',
  CARDIO = 'cardio',
  FLEXIBILITY = 'flexibility',
  REHABILITATION = 'rehabilitation',
  SPORT_SPECIFIC = 'sports_specific',
  GENERAL_FITNESS = 'general_fitness',
  WEIGHT_LOSS = 'weight_loss',
  MUSCLE_GAIN = 'muscle_gain',
  HYBRID = 'hybrid'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export enum WorkoutType {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  HIIT = 'hiit',
  FLEXIBILITY = 'flexibility',
  MIXED = 'mixed',
  RECOVERY = 'recovery'
}

export enum SetType {
  WARMUP = 'warmup',
  WORKING = 'working',
  DROP = 'drop',
  PYRAMID = 'pyramid',
  AMRAP = 'amrap',
  CLUSTER = 'cluster',
  REST_PAUSE = 'rest_pause'
}

export interface ExerciseConfiguration {
  id?: string;
  workoutExerciseId?: string;
  setNumber: number;
  setType: SetType;
  reps: string; // "8-10", "AMRAP", "30s"
  weightGuidance?: string; // "70% 1RM", "RPE 7", "Bodyweight"
  restSeconds?: number;
  tempo?: string; // "3-1-2-0"
  rpe?: number; // Rate of Perceived Exertion (1-10)
  rir?: number; // Reps in Reserve
  notes?: string;
  createdAt?: string;
}

export interface WorkoutExercise {
  id?: string;
  workoutId?: string;
  exerciseId: string;
  orderIndex: number;
  supersetGroup?: string; // A, B, C for grouping
  setsConfig: any; // [{type: 'working', count: 3}, {type: 'warmup', count: 2}]
  notes?: string;
  createdAt?: string;
  
  // Relations
  exercise?: {
    id: string;
    name: string;
    gifUrl: string;
    bodyPart: string;
    equipment: string;
    targetMuscle: string;
    secondaryMuscles: string[];
    instructions: string[];
    difficulty: DifficultyLevel;
  };
  configurations: ExerciseConfiguration[];
}

export interface ProgramWorkout {
  id?: string;
  programWeekId?: string;
  dayNumber: number;
  name: string;
  description?: string;
  workoutType?: WorkoutType;
  estimatedDuration?: number; // minutes
  isRestDay: boolean;
  createdAt?: string;
  
  // Relations
  exercises: WorkoutExercise[];
}

export interface ProgramWeek {
  id?: string;
  programId?: string;
  weekNumber: number;
  name: string;
  description?: string;
  isDeload: boolean;
  createdAt?: string;
  
  // Relations
  workouts: ProgramWorkout[];
}

export interface Program {
  id: string;
  trainerId: string;
  name: string;
  description?: string;
  programType: ProgramType;
  difficultyLevel: DifficultyLevel;
  durationWeeks: number;
  goals: string[];
  equipmentNeeded: string[];
  isTemplate: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt?: string;
  
  // Relations
  trainer?: {
    id: string;
    email: string;
    userProfile?: {
      profilePhotoUrl?: string;
    };
  };
  weeks: ProgramWeek[];
  assignments?: ProgramAssignment[];
  templates?: ProgramTemplate[];
}

export interface ProgramAssignment {
  id: string;
  programId: string;
  clientId: string;
  trainerId: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  customNotes?: string;
  progressData?: any; // For tracking completion
  assignedAt: string;
  completedAt?: string;
  
  // Relations
  program?: Program;
  client?: {
    id: string;
    email: string;
    userProfile?: {
      profilePhotoUrl?: string;
    };
  };
  trainer?: {
    id: string;
    email: string;
    userProfile?: {
      profilePhotoUrl?: string;
    };
  };
}

export interface ProgramTemplate {
  id: string;
  programId: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  useCount: number;
  usageCount?: number; // Alias for backward compatibility
  rating?: number;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  goals?: string[]; // Program fitness goals
  equipmentNeeded?: string[]; // Required equipment

  // Relations
  program?: Program;
  creator?: {
    id: string;
    email: string;
    userProfile?: {
      profilePhotoUrl?: string;
    };
  };
}

// Request/Response types for API calls
export interface ProgramData {
  name: string;
  description?: string;
  programType: ProgramType;
  difficultyLevel: DifficultyLevel;
  durationWeeks: number;
  goals?: string[];
  equipmentNeeded?: string[];
  isTemplate?: boolean;
  weeks?: ProgramWeekData[];
}

export interface ProgramWeekData {
  weekNumber: number;
  name: string;
  description?: string;
  isDeload?: boolean;
  workouts?: ProgramWorkoutData[];
}

export interface ProgramWorkoutData {
  dayNumber: number;
  name: string;
  description?: string;
  workoutType?: WorkoutType;
  estimatedDuration?: number;
  isRestDay?: boolean;
  exercises?: WorkoutExerciseData[];
}

export interface WorkoutExerciseData {
  exerciseId: string;
  orderIndex: number;
  supersetGroup?: string;
  setsConfig: any;
  notes?: string;
  configurations?: ExerciseConfigurationData[];
}

export interface ExerciseConfigurationData {
  setNumber: number;
  setType: SetType;
  reps: string;
  weightGuidance?: string;
  restSeconds?: number;
  tempo?: string;
  rpe?: number;
  rir?: number;
  notes?: string;
}

export interface AssignProgramData {
  clientId: string;
  startDate: string;
}

export interface ProgramListResponse {
  programs: Program[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProgramFilters {
  programType?: ProgramType;
  difficultyLevel?: DifficultyLevel;
  search?: string;
  isTemplate?: boolean;
  sortBy?: 'name' | 'createdAt' | 'durationWeeks';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
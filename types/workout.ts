export interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  weight?: string
  duration?: number // in seconds
  restTime?: number // in seconds
}

export interface Workout {
  id: string
  title: string
  type: 'strength' | 'cardio' | 'flexibility' | 'rest' | 'hiit'
  duration: number // in minutes
  exercises: Exercise[]
  completed: boolean
  synced: boolean
}

export interface DayPlan {
  date: Date
  workouts: Workout[]
  isActive: boolean
}

// Additional types for workout logging
export interface WorkoutSession {
  id: string
  workoutId: string
  startTime: Date
  endTime?: Date
  exercises: WorkoutExercise[]
  exerciseLogs?: ExerciseLog[]
  notes?: string
  status?: 'planned' | 'in_progress' | 'completed' | 'skipped'
  program?: Program
  programWorkout?: ProgramWorkout
  totalVolume?: number
  totalSets?: number
  completedSets?: number
  weekNumber?: number
  dayNumber?: number
  programId?: string
}

export interface Program {
  id: string
  name: string
  description?: string
}

export interface ProgramWorkout {
  id: string
  name: string
  exercises: any[]
}

export interface WorkoutExercise {
  exerciseId: string
  name: string
  sets: LoggedSet[]
}

export interface ExerciseLog {
  id: string
  exercise?: { id: string; name: string }
  targetReps?: string
  restSeconds?: number
  targetWeight?: number
  setLogs?: LoggedSet[]
}

export interface LoggedSet {
  id?: string
  setNumber: number
  weight?: number
  reps?: number
  actualReps?: number
  duration?: number
  distance?: number
  completed: boolean
  restTime?: number
  previousBest?: { weight?: number; reps?: number; volume?: string }
}

export interface LogSetDTO {
  exerciseId: string
  setNumber: number
  weight?: number
  reps?: number
  duration?: number
  distance?: number
  completed: boolean
}

export interface UpdateSetDTO extends LogSetDTO {
  id: string
}

export interface ProgressData {
  totalWorkouts: number
  totalVolume: number
  streak: number
  completionRate: number
  personalRecords?: { exercise: string; value: number; date: string }[]
}

export interface WorkoutFilters {
  type?: string
  duration?: {
    min?: number
    max?: number
  }
  dateRange?: {
    start?: Date
    end?: Date
  }
  startDate?: Date
  endDate?: Date
  completed?: boolean
  status?: 'planned' | 'in_progress' | 'completed' | 'skipped'
  programId?: string
  clientId?: string
  limit?: number
}

export interface WorkoutLog {
  id: string
  workoutId: string
  userId: string
  date: Date
  exercises: WorkoutExercise[]
  duration: number
  notes?: string
  completed: boolean
}
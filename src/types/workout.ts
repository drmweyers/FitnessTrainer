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
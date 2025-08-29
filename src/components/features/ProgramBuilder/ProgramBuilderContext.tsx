'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { 
  ProgramType, 
  DifficultyLevel, 
  WorkoutType,
  ProgramData,
  ProgramWeekData,
  ProgramWorkoutData,
  WorkoutExerciseData 
} from '@/types/program'

// Program builder state
export interface ProgramBuilderState {
  // Step 1: Basic Program Info
  name: string
  description: string
  programType: ProgramType | ''
  difficultyLevel: DifficultyLevel | ''
  durationWeeks: number
  goals: string[]
  equipmentNeeded: string[]
  
  // Step 2: Week Structure
  weeks: ProgramWeekData[]
  
  // Step 3: Workouts
  currentWeekIndex: number
  currentWorkoutIndex: number
  
  // Step 4: Exercises
  selectedExercises: WorkoutExerciseData[]
  
  // Navigation
  currentStep: number
  isValid: boolean
  isDirty: boolean
  
  // UI State
  isLoading: boolean
  errors: Record<string, string>
}

// Actions
export type ProgramBuilderAction =
  | { type: 'SET_BASIC_INFO'; payload: Partial<Pick<ProgramBuilderState, 'name' | 'description' | 'programType' | 'difficultyLevel' | 'durationWeeks' | 'goals' | 'equipmentNeeded'>> }
  | { type: 'UPDATE_WEEKS'; payload: ProgramWeekData[] }
  | { type: 'ADD_WEEK'; payload?: ProgramWeekData }
  | { type: 'REMOVE_WEEK'; payload: number }
  | { type: 'UPDATE_WEEK'; payload: { index: number; week: ProgramWeekData } }
  | { type: 'DUPLICATE_WEEK'; payload: number }
  | { type: 'UPDATE_WORKOUT'; payload: { weekIndex: number; workoutIndex: number; workout: ProgramWorkoutData } }
  | { type: 'ADD_WORKOUT'; payload: { weekIndex: number; workout?: ProgramWorkoutData } }
  | { type: 'REMOVE_WORKOUT'; payload: { weekIndex: number; workoutIndex: number } }
  | { type: 'SET_CURRENT_WEEK'; payload: number }
  | { type: 'SET_CURRENT_WORKOUT'; payload: number }
  | { type: 'ADD_EXERCISES'; payload: WorkoutExerciseData[] }
  | { type: 'REMOVE_EXERCISE'; payload: number }
  | { type: 'UPDATE_EXERCISE'; payload: { index: number; exercise: WorkoutExerciseData } }
  | { type: 'REORDER_EXERCISES'; payload: { from: number; to: number } }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: { field: string; message: string } }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'RESET_STATE' }
  | { type: 'LOAD_FROM_STORAGE' }
  | { type: 'VALIDATE_CURRENT_STEP' }

// Initial state
const initialState: ProgramBuilderState = {
  name: '',
  description: '',
  programType: '',
  difficultyLevel: '',
  durationWeeks: 4,
  goals: [],
  equipmentNeeded: [],
  weeks: [],
  currentWeekIndex: 0,
  currentWorkoutIndex: 0,
  selectedExercises: [],
  currentStep: 1,
  isValid: false,
  isDirty: false,
  isLoading: false,
  errors: {}
}

// Create initial weeks based on duration
const createInitialWeeks = (weekCount: number): ProgramWeekData[] => {
  return Array.from({ length: weekCount }, (_, index) => ({
    weekNumber: index + 1,
    name: `Week ${index + 1}`,
    description: '',
    isDeload: false,
    workouts: []
  }))
}

// Validation functions
const validateStep1 = (state: ProgramBuilderState): boolean => {
  return Boolean(
    state.name.trim() &&
    state.programType &&
    state.difficultyLevel &&
    state.durationWeeks > 0
  )
}

const validateStep2 = (state: ProgramBuilderState): boolean => {
  return state.weeks.length > 0
}

const validateStep3 = (state: ProgramBuilderState): boolean => {
  return state.weeks.some(week => week.workouts.length > 0)
}

const validateStep4 = (state: ProgramBuilderState): boolean => {
  return state.weeks.some(week => 
    week.workouts.some(workout => workout.exercises && workout.exercises.length > 0)
  )
}

const validateCurrentStep = (state: ProgramBuilderState): boolean => {
  switch (state.currentStep) {
    case 1: return validateStep1(state)
    case 2: return validateStep2(state)
    case 3: return validateStep3(state)
    case 4: return validateStep4(state)
    default: return true
  }
}

// Reducer
function programBuilderReducer(state: ProgramBuilderState, action: ProgramBuilderAction): ProgramBuilderState {
  switch (action.type) {
    case 'SET_BASIC_INFO':
      const newState = { 
        ...state, 
        ...action.payload,
        isDirty: true 
      }
      
      // Auto-generate weeks if duration changed
      if (action.payload.durationWeeks && action.payload.durationWeeks !== state.durationWeeks) {
        newState.weeks = createInitialWeeks(action.payload.durationWeeks)
      }
      
      return newState

    case 'UPDATE_WEEKS':
      return { 
        ...state, 
        weeks: action.payload,
        isDirty: true 
      }

    case 'ADD_WEEK':
      const newWeek = action.payload || {
        weekNumber: state.weeks.length + 1,
        name: `Week ${state.weeks.length + 1}`,
        description: '',
        isDeload: false,
        workouts: []
      }
      return { 
        ...state, 
        weeks: [...state.weeks, newWeek],
        durationWeeks: state.weeks.length + 1,
        isDirty: true 
      }

    case 'REMOVE_WEEK':
      const filteredWeeks = state.weeks.filter((_, index) => index !== action.payload)
      // Re-number weeks
      const renumberedWeeks = filteredWeeks.map((week, index) => ({
        ...week,
        weekNumber: index + 1,
        name: week.name.includes(`Week ${week.weekNumber}`) 
          ? `Week ${index + 1}` 
          : week.name
      }))
      return { 
        ...state, 
        weeks: renumberedWeeks,
        durationWeeks: renumberedWeeks.length,
        isDirty: true 
      }

    case 'UPDATE_WEEK':
      return { 
        ...state, 
        weeks: state.weeks.map((week, index) => 
          index === action.payload.index ? action.payload.week : week
        ),
        isDirty: true 
      }

    case 'DUPLICATE_WEEK':
      const weekToDuplicate = state.weeks[action.payload]
      if (!weekToDuplicate) return state
      
      const duplicatedWeek: ProgramWeekData = {
        ...weekToDuplicate,
        weekNumber: state.weeks.length + 1,
        name: `${weekToDuplicate.name} (Copy)`,
        workouts: weekToDuplicate.workouts?.map(workout => ({ ...workout })) || []
      }
      
      return { 
        ...state, 
        weeks: [...state.weeks, duplicatedWeek],
        durationWeeks: state.weeks.length + 1,
        isDirty: true 
      }

    case 'UPDATE_WORKOUT':
      return { 
        ...state, 
        weeks: state.weeks.map((week, weekIdx) => 
          weekIdx === action.payload.weekIndex
            ? {
                ...week,
                workouts: week.workouts?.map((workout, workoutIdx) => 
                  workoutIdx === action.payload.workoutIndex ? action.payload.workout : workout
                ) || []
              }
            : week
        ),
        isDirty: true 
      }

    case 'ADD_WORKOUT':
      const defaultWorkout: ProgramWorkoutData = action.payload.workout || {
        dayNumber: 1,
        name: 'New Workout',
        description: '',
        workoutType: WorkoutType.STRENGTH,
        estimatedDuration: 60,
        isRestDay: false,
        exercises: []
      }
      
      return { 
        ...state, 
        weeks: state.weeks.map((week, index) => 
          index === action.payload.weekIndex
            ? {
                ...week,
                workouts: [...(week.workouts || []), defaultWorkout]
              }
            : week
        ),
        isDirty: true 
      }

    case 'REMOVE_WORKOUT':
      return { 
        ...state, 
        weeks: state.weeks.map((week, weekIdx) => 
          weekIdx === action.payload.weekIndex
            ? {
                ...week,
                workouts: week.workouts?.filter((_, workoutIdx) => 
                  workoutIdx !== action.payload.workoutIndex
                ) || []
              }
            : week
        ),
        isDirty: true 
      }

    case 'SET_CURRENT_WEEK':
      return { ...state, currentWeekIndex: action.payload }

    case 'SET_CURRENT_WORKOUT':
      return { ...state, currentWorkoutIndex: action.payload }

    case 'ADD_EXERCISES':
      return { 
        ...state, 
        selectedExercises: [...state.selectedExercises, ...action.payload],
        isDirty: true 
      }

    case 'REMOVE_EXERCISE':
      return { 
        ...state, 
        selectedExercises: state.selectedExercises.filter((_, index) => index !== action.payload),
        isDirty: true 
      }

    case 'UPDATE_EXERCISE':
      return { 
        ...state, 
        selectedExercises: state.selectedExercises.map((exercise, index) => 
          index === action.payload.index ? action.payload.exercise : exercise
        ),
        isDirty: true 
      }

    case 'REORDER_EXERCISES':
      const exercises = [...state.selectedExercises]
      const [removed] = exercises.splice(action.payload.from, 1)
      exercises.splice(action.payload.to, 0, removed)
      
      return { 
        ...state, 
        selectedExercises: exercises.map((exercise, index) => ({
          ...exercise,
          orderIndex: index
        })),
        isDirty: true 
      }

    case 'SET_STEP':
      return { 
        ...state, 
        currentStep: Math.max(1, Math.min(5, action.payload))
      }

    case 'NEXT_STEP':
      return { 
        ...state, 
        currentStep: Math.min(5, state.currentStep + 1)
      }

    case 'PREV_STEP':
      return { 
        ...state, 
        currentStep: Math.max(1, state.currentStep - 1)
      }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_ERROR':
      return { 
        ...state, 
        errors: { 
          ...state.errors, 
          [action.payload.field]: action.payload.message 
        }
      }

    case 'CLEAR_ERROR':
      const { [action.payload]: removedError, ...remainingErrors } = state.errors
      return { ...state, errors: remainingErrors }

    case 'CLEAR_ALL_ERRORS':
      return { ...state, errors: {} }

    case 'VALIDATE_CURRENT_STEP':
      return { 
        ...state, 
        isValid: validateCurrentStep(state)
      }

    case 'RESET_STATE':
      return initialState

    case 'LOAD_FROM_STORAGE':
      try {
        const savedState = localStorage.getItem('programBuilderDraft')
        if (savedState) {
          const parsed = JSON.parse(savedState)
          return { ...state, ...parsed, isLoading: false }
        }
      } catch (error) {
        console.error('Failed to load from storage:', error)
      }
      return state

    default:
      return state
  }
}

// Context
const ProgramBuilderContext = createContext<{
  state: ProgramBuilderState
  dispatch: React.Dispatch<ProgramBuilderAction>
} | undefined>(undefined)

// Provider component
export function ProgramBuilderProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(programBuilderReducer, initialState)

  // Auto-save to localStorage
  useEffect(() => {
    if (state.isDirty) {
      try {
        const stateToSave = { ...state, isLoading: false }
        localStorage.setItem('programBuilderDraft', JSON.stringify(stateToSave))
      } catch (error) {
        console.error('Failed to save to storage:', error)
      }
    }
  }, [state])

  // Load from localStorage on mount
  useEffect(() => {
    dispatch({ type: 'LOAD_FROM_STORAGE' })
  }, [])

  // Auto-validate current step when state changes
  useEffect(() => {
    dispatch({ type: 'VALIDATE_CURRENT_STEP' })
  }, [state.currentStep, state.name, state.programType, state.difficultyLevel, state.weeks])

  return (
    <ProgramBuilderContext.Provider value={{ state, dispatch }}>
      {children}
    </ProgramBuilderContext.Provider>
  )
}

// Hook to use the context
export function useProgramBuilder() {
  const context = useContext(ProgramBuilderContext)
  if (context === undefined) {
    throw new Error('useProgramBuilder must be used within a ProgramBuilderProvider')
  }
  return context
}

// Helper functions
export const programBuilderHelpers = {
  // Convert state to API format
  toApiFormat: (state: ProgramBuilderState): ProgramData => ({
    name: state.name.trim(),
    description: state.description.trim() || undefined,
    programType: state.programType as ProgramType,
    difficultyLevel: state.difficultyLevel as DifficultyLevel,
    durationWeeks: state.durationWeeks,
    goals: state.goals.length > 0 ? state.goals : undefined,
    equipmentNeeded: state.equipmentNeeded.length > 0 ? state.equipmentNeeded : undefined,
    weeks: state.weeks
  }),

  // Clear the draft
  clearDraft: () => {
    localStorage.removeItem('programBuilderDraft')
  },

  // Check if there's a saved draft
  hasDraft: (): boolean => {
    try {
      return Boolean(localStorage.getItem('programBuilderDraft'))
    } catch {
      return false
    }
  },

  // Get step names
  getStepName: (step: number): string => {
    const steps = {
      1: 'Program Info',
      2: 'Week Structure', 
      3: 'Workouts',
      4: 'Exercises',
      5: 'Preview'
    }
    return steps[step as keyof typeof steps] || 'Unknown'
  }
}
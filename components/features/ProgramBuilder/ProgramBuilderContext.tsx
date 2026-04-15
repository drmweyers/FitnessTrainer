'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import type {
  ProgramData,
  ProgramWeekData,
  ProgramWorkoutData,
  WorkoutExerciseData,
  ExerciseConfigurationData,
  SectionType,
  SectionMetadata,
} from '@/types/program'
import {
  ProgramType,
  DifficultyLevel,
  WorkoutType,
  SetType,
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

  // Canvas multi-selection (for superset grouping)
  selectedExerciseIds: Set<string>
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
  // Canvas builder actions (Stream B)
  | {
      type: 'ADD_EXERCISE_TO_WORKOUT'
      payload: {
        weekIdx: number
        workoutIdx: number
        sectionType?: SectionType
        exercise: { id: string; name: string; gifUrl?: string; targetMuscle?: string; equipment?: string }
        atIndex?: number
      }
    }
  | {
      type: 'MOVE_EXERCISE'
      payload: {
        from: { weekIdx: number; workoutIdx: number; exerciseIdx: number }
        to: { weekIdx: number; workoutIdx: number; exerciseIdx: number }
      }
    }
  | {
      // Canvas variant — distinct from legacy REMOVE_EXERCISE (payload: number) to avoid union collision.
      // Stream C: dispatch({ type: 'REMOVE_WORKOUT_EXERCISE', payload: { weekIdx, workoutIdx, exerciseIdx } })
      type: 'REMOVE_WORKOUT_EXERCISE'
      payload: { weekIdx: number; workoutIdx: number; exerciseIdx: number }
    }
  | {
      type: 'GROUP_AS_SUPERSET'
      payload: {
        weekIdx: number
        workoutIdx: number
        exerciseIdxs: number[]
        sharedSets?: number
        endRest?: number
      }
    }
  | {
      type: 'UNGROUP_SUPERSET'
      payload: { weekIdx: number; workoutIdx: number; supersetGroup: string }
    }
  | {
      type: 'ADD_SECTION'
      payload: { weekIdx: number; workoutIdx: number; sectionType: SectionType }
    }
  | {
      type: 'SET_SECTION_METADATA'
      payload: { weekIdx: number; workoutIdx: number; supersetGroup: string; metadata: SectionMetadata }
    }
  | {
      type: 'SET_ALTERNATE_EXERCISE'
      payload: { weekIdx: number; workoutIdx: number; exerciseIdx: number; alternateExerciseId: string | null }
    }
  | {
      type: 'UPDATE_EXERCISE_CONFIG'
      payload: { weekIdx: number; workoutIdx: number; exerciseIdx: number; configurations: ExerciseConfigurationData[]; notes?: string }
    }
  | { type: 'TOGGLE_EXERCISE_SELECTION'; payload: string }
  | { type: 'CLEAR_SELECTION' }

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
  errors: {},
  selectedExerciseIds: new Set<string>(),
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
  return state.weeks.some(week => week.workouts && week.workouts.length > 0)
}

const validateStep4 = (state: ProgramBuilderState): boolean => {
  return state.weeks.some(week =>
    week.workouts && week.workouts.some(workout => workout.exercises && workout.exercises.length > 0)
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
      // Create new state with proper field replacement to prevent concatenation
      const newState: ProgramBuilderState = {
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

    case 'NEXT_STEP': {
      const nextStep = Math.min(5, state.currentStep + 1)
      const nextState = { ...state, currentStep: nextStep }

      // Step 1→2: auto-scaffold weeks if none created yet (user never changed duration slider)
      if (state.currentStep === 1 && nextState.weeks.length === 0) {
        nextState.weeks = createInitialWeeks(state.durationWeeks)
        nextState.isDirty = true
      }

      // Step 2→3: ensure each week has at least one workout so drag-drop works immediately
      if (state.currentStep === 2) {
        const defaultWorkout: ProgramWorkoutData = {
          dayNumber: 1,
          name: 'Day 1',
          description: '',
          workoutType: WorkoutType.STRENGTH,
          estimatedDuration: 60,
          isRestDay: false,
          exercises: [],
        }
        nextState.weeks = nextState.weeks.map(week => ({
          ...week,
          workouts: week.workouts && week.workouts.length > 0 ? week.workouts : [defaultWorkout],
        }))
        nextState.isDirty = true
      }

      return nextState
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
          const restored = { ...state, ...parsed, isLoading: false }
          // Defensive: if draft has us on step 2+ with no weeks, scaffold them.
          // This happens when a draft was saved before the auto-scaffold fix landed.
          if (restored.currentStep >= 2 && (!restored.weeks || restored.weeks.length === 0)) {
            restored.weeks = createInitialWeeks(restored.durationWeeks || 4)
          }
          return restored
        }
      } catch (error) {
        console.error('Failed to load from storage:', error)
      }
      return state

    // ─── Canvas Builder Actions (Stream B) ───────────────────────────────────

    case 'ADD_EXERCISE_TO_WORKOUT': {
      const { weekIdx, workoutIdx, sectionType = 'regular', exercise, atIndex } = action.payload
      const weeks = state.weeks.map((week, wi) => {
        if (wi !== weekIdx) return week
        const workouts = (week.workouts || []).map((workout, woi) => {
          if (woi !== workoutIdx) return workout
          const exercises = [...(workout.exercises || [])]
          const orderIndex = atIndex !== undefined ? atIndex : exercises.length
          const newExercise: WorkoutExerciseData = {
            exerciseId: exercise.id,
            name: exercise.name,
            orderIndex,
            sectionType,
            supersetGroup: undefined,
            alternateExerciseId: undefined,
            setsConfig: [{ type: 'working', count: 1 }],
            notes: undefined,
            configurations: [
              {
                setNumber: 1,
                setType: SetType.WORKING,
                reps: '8',
                restSeconds: 90,
              },
            ],
          }
          if (atIndex !== undefined) {
            exercises.splice(atIndex, 0, newExercise)
          } else {
            exercises.push(newExercise)
          }
          // Re-index orderIndex
          const reindexed = exercises.map((ex, idx) => ({ ...ex, orderIndex: idx }))
          return { ...workout, exercises: reindexed }
        })
        return { ...week, workouts }
      })
      return { ...state, weeks, isDirty: true }
    }

    case 'MOVE_EXERCISE': {
      const { from, to } = action.payload
      let exerciseToMove: WorkoutExerciseData | null = null
      // Extract from source
      let weeks = state.weeks.map((week, wi) => {
        if (wi !== from.weekIdx) return week
        const workouts = (week.workouts || []).map((workout, woi) => {
          if (woi !== from.workoutIdx) return workout
          const exercises = [...(workout.exercises || [])]
          const [removed] = exercises.splice(from.exerciseIdx, 1)
          exerciseToMove = removed
          return { ...workout, exercises: exercises.map((ex, idx) => ({ ...ex, orderIndex: idx })) }
        })
        return { ...week, workouts }
      })
      if (!exerciseToMove) return state
      // Insert into destination
      weeks = weeks.map((week, wi) => {
        if (wi !== to.weekIdx) return week
        const workouts = (week.workouts || []).map((workout, woi) => {
          if (woi !== to.workoutIdx) return workout
          const exercises = [...(workout.exercises || [])]
          exercises.splice(to.exerciseIdx, 0, exerciseToMove as WorkoutExerciseData)
          return { ...workout, exercises: exercises.map((ex, idx) => ({ ...ex, orderIndex: idx })) }
        })
        return { ...week, workouts }
      })
      return { ...state, weeks, isDirty: true }
    }

    case 'REMOVE_WORKOUT_EXERCISE': {
      const { weekIdx, workoutIdx, exerciseIdx } = action.payload
      const weeks = state.weeks.map((week, wi) => {
        if (wi !== weekIdx) return week
        const workouts = (week.workouts || []).map((workout, woi) => {
          if (woi !== workoutIdx) return workout
          const exercises = (workout.exercises || [])
            .filter((_, idx) => idx !== exerciseIdx)
            .map((ex, idx) => ({ ...ex, orderIndex: idx }))
          return { ...workout, exercises }
        })
        return { ...week, workouts }
      })
      return { ...state, weeks, isDirty: true }
    }

    case 'GROUP_AS_SUPERSET': {
      const { weekIdx, workoutIdx, exerciseIdxs, sharedSets, endRest } = action.payload
      const weeks = state.weeks.map((week, wi) => {
        if (wi !== weekIdx) return week
        const workouts = (week.workouts || []).map((workout, woi) => {
          if (woi !== workoutIdx) return workout
          // Find next unused superset letter
          const usedLetters = new Set(
            (workout.exercises || [])
              .map(ex => ex.supersetGroup)
              .filter((g): g is string => Boolean(g))
          )
          let nextLetter = 'A'
          while (usedLetters.has(nextLetter)) {
            nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1)
          }
          const exercises = (workout.exercises || []).map((ex, idx) => {
            if (!exerciseIdxs.includes(idx)) return ex
            const updatedEx: WorkoutExerciseData = {
              ...ex,
              supersetGroup: nextLetter,
              sectionType: 'superset' as SectionType,
            }
            // Resize configurations if sharedSets provided
            if (sharedSets !== undefined && updatedEx.configurations) {
              const template = updatedEx.configurations[0]
              updatedEx.configurations = Array.from({ length: sharedSets }, (_, si) => ({
                ...template,
                setNumber: si + 1,
              }))
            }
            return updatedEx
          })
          // Store endRest on the first grouped exercise's configurations[0].notes
          if (endRest !== undefined) {
            const firstIdx = exerciseIdxs[0]
            if (firstIdx !== undefined && exercises[firstIdx]?.configurations?.[0]) {
              const firstEx = exercises[firstIdx]
              exercises[firstIdx] = {
                ...firstEx,
                configurations: [
                  { ...firstEx.configurations![0], notes: JSON.stringify({ endRest }) },
                  ...(firstEx.configurations!.slice(1)),
                ],
              }
            }
          }
          return { ...workout, exercises }
        })
        return { ...week, workouts }
      })
      return { ...state, weeks, isDirty: true }
    }

    case 'UNGROUP_SUPERSET': {
      const { weekIdx, workoutIdx, supersetGroup } = action.payload
      const weeks = state.weeks.map((week, wi) => {
        if (wi !== weekIdx) return week
        const workouts = (week.workouts || []).map((workout, woi) => {
          if (woi !== workoutIdx) return workout
          const exercises = (workout.exercises || []).map(ex => {
            if (ex.supersetGroup !== supersetGroup) return ex
            return { ...ex, supersetGroup: undefined, sectionType: 'regular' as SectionType }
          })
          return { ...workout, exercises }
        })
        return { ...week, workouts }
      })
      return { ...state, weeks, isDirty: true }
    }

    case 'ADD_SECTION': {
      const { weekIdx, workoutIdx, sectionType } = action.payload
      const weeks = state.weeks.map((week, wi) => {
        if (wi !== weekIdx) return week
        const workouts = (week.workouts || []).map((workout, woi) => {
          if (woi !== workoutIdx) return workout
          const exercises = [...(workout.exercises || [])]
          const placeholder: WorkoutExerciseData = {
            exerciseId: '__section_header__',
            orderIndex: exercises.length,
            sectionType,
            supersetGroup: undefined,
            setsConfig: [],
            configurations: [],
          }
          exercises.push(placeholder)
          return { ...workout, exercises: exercises.map((ex, idx) => ({ ...ex, orderIndex: idx })) }
        })
        return { ...week, workouts }
      })
      return { ...state, weeks, isDirty: true }
    }

    case 'SET_SECTION_METADATA': {
      const { weekIdx, workoutIdx, supersetGroup, metadata } = action.payload
      const weeks = state.weeks.map((week, wi) => {
        if (wi !== weekIdx) return week
        const workouts = (week.workouts || []).map((workout, woi) => {
          if (woi !== workoutIdx) return workout
          let found = false
          const exercises = (workout.exercises || []).map(ex => {
            if (found || ex.supersetGroup !== supersetGroup) return ex
            found = true
            if (!ex.configurations || ex.configurations.length === 0) return ex
            const firstConfig = { ...ex.configurations[0], notes: JSON.stringify(metadata) }
            return { ...ex, configurations: [firstConfig, ...(ex.configurations.slice(1))] }
          })
          return { ...workout, exercises }
        })
        return { ...week, workouts }
      })
      return { ...state, weeks, isDirty: true }
    }

    case 'SET_ALTERNATE_EXERCISE': {
      const { weekIdx, workoutIdx, exerciseIdx, alternateExerciseId } = action.payload
      const weeks = state.weeks.map((week, wi) => {
        if (wi !== weekIdx) return week
        const workouts = (week.workouts || []).map((workout, woi) => {
          if (woi !== workoutIdx) return workout
          const exercises = (workout.exercises || []).map((ex, idx) => {
            if (idx !== exerciseIdx) return ex
            return { ...ex, alternateExerciseId: alternateExerciseId ?? undefined }
          })
          return { ...workout, exercises }
        })
        return { ...week, workouts }
      })
      return { ...state, weeks, isDirty: true }
    }

    case 'UPDATE_EXERCISE_CONFIG': {
      const { weekIdx, workoutIdx, exerciseIdx, configurations, notes } = action.payload
      const weeks = state.weeks.map((week, wi) => {
        if (wi !== weekIdx) return week
        const workouts = (week.workouts || []).map((workout, woi) => {
          if (woi !== workoutIdx) return workout
          const exercises = (workout.exercises || []).map((ex, idx) => {
            if (idx !== exerciseIdx) return ex
            return { ...ex, configurations, ...(notes !== undefined ? { notes } : {}) }
          })
          return { ...workout, exercises }
        })
        return { ...week, workouts }
      })
      return { ...state, weeks, isDirty: true }
    }

    case 'TOGGLE_EXERCISE_SELECTION': {
      const id = action.payload
      const next = new Set(state.selectedExerciseIds)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return { ...state, selectedExerciseIds: next }
    }

    case 'CLEAR_SELECTION':
      return { ...state, selectedExerciseIds: new Set<string>() }

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

// Export validator so ProgramBuilder can compute validity synchronously
// instead of relying on the stale `state.isValid` closure in handleNext.
export { validateCurrentStep }

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
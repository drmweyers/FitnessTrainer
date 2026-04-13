// STREAM_C_STUB_REMOVE_ON_MERGE
// Temporary type/function stubs until Stream B merges.
// Delete this file during integration.

import { WorkoutExerciseData, ExerciseConfigurationData, SetType } from '@/types/program'

// STREAM_C_STUB_REMOVE_ON_MERGE: SectionType — Stream B adds this to types/program.ts
export type SectionType = 'regular' | 'superset' | 'circuit' | 'interval' | 'amrap' | 'timed'

// STREAM_C_STUB_REMOVE_ON_MERGE: SectionMetadata — Stream B adds to types/program.ts
export interface SectionMetadata {
  rounds?: number
  endRest?: number
  intervalWork?: number
  intervalRest?: number
}

// STREAM_C_STUB_REMOVE_ON_MERGE: WorkoutExerciseData extensions — Stream B adds these optional fields
// sectionType?: SectionType
// alternateExerciseId?: string

// STREAM_C_STUB_REMOVE_ON_MERGE: Extended WorkoutExerciseData that includes Stream B's new fields
export interface WorkoutExerciseDataExtended extends WorkoutExerciseData {
  sectionType?: SectionType
  alternateExerciseId?: string
}

// STREAM_C_STUB_REMOVE_ON_MERGE: Exercise library item shape from API
export interface LibraryExercise {
  id: string
  name: string
  gifUrl?: string
  bodyPart: string
  equipment: string
  targetMuscle: string
  secondaryMuscles?: string[]
  difficulty?: string
}

// STREAM_C_STUB_REMOVE_ON_MERGE: useExerciseLibrary hook — Stream B creates this
// Hook return shape expected by ExerciseLibraryPanel
export interface UseExerciseLibraryReturn {
  search: string
  setSearch: (v: string) => void
  muscleGroup: string
  setMuscleGroup: (v: string) => void
  equipment: string
  setEquipment: (v: string) => void
  hasVideo: boolean
  setHasVideo: (v: boolean) => void
  tab: 'all' | 'favorites' | 'collections'
  setTab: (v: 'all' | 'favorites' | 'collections') => void
  exercises: LibraryExercise[]
  isLoading: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => void
}

// STREAM_C_STUB_REMOVE_ON_MERGE: Minimal stub implementation of useExerciseLibrary
// Stream B will replace this with a real TanStack Query implementation.
import { useState, useCallback } from 'react'

export function useExerciseLibrary(): UseExerciseLibraryReturn {
  const [search, setSearch] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [equipment, setEquipment] = useState('')
  const [hasVideo, setHasVideo] = useState(false)
  const [tab, setTab] = useState<'all' | 'favorites' | 'collections'>('all')
  const [exercises] = useState<LibraryExercise[]>([])

  const loadMore = useCallback(() => {
    // stub — Stream B implements with intersection observer + API pagination
  }, [])

  return {
    search, setSearch,
    muscleGroup, setMuscleGroup,
    equipment, setEquipment,
    hasVideo, setHasVideo,
    tab, setTab,
    exercises,
    isLoading: false,
    error: null,
    hasMore: false,
    loadMore,
  }
}

// STREAM_C_STUB_REMOVE_ON_MERGE: Context action types Stream B adds to ProgramBuilderContext
// These action type strings are used in dispatch calls throughout Stream C components.
// ADD_EXERCISE_TO_WORKOUT, MOVE_EXERCISE, REMOVE_EXERCISE, GROUP_AS_SUPERSET,
// UNGROUP_SUPERSET, ADD_SECTION, SET_SECTION_METADATA, SET_ALTERNATE_EXERCISE,
// UPDATE_EXERCISE_CONFIG, TOGGLE_EXERCISE_SELECTION, CLEAR_SELECTION

// STREAM_C_STUB_REMOVE_ON_MERGE: selectedExerciseIds — Stream B adds Set<string> to ProgramBuilderState
// Components in this file read state.selectedExerciseIds which will be undefined until Stream B merges.
// The WorkoutCanvas guards with `state.selectedExerciseIds ?? new Set()` for safety.

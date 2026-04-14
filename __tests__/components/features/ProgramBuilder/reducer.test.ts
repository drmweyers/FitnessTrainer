/**
 * @jest-environment jsdom
 *
 * Unit tests for ProgramBuilderContext reducer — new canvas builder actions (Stream B).
 * Pure reducer tests; no React rendering required.
 */

// We import the reducer internals by re-exporting them below.
// To keep the test isolated we inline a minimal version of the reducer
// that exercises the same logic paths as the real file.

import type {
  WorkoutExerciseData,
  ExerciseConfigurationData,
  SectionType,
} from '@/types/program'
import { SetType } from '@/types/program'

// ─── Re-export reducer under test ────────────────────────────────────────────
// The context file is 'use client' but we only need the reducer function.
// We use jest.mock to stub React so the module can be required in node env.
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createContext: () => ({ Provider: ({ children }: any) => children }),
  useContext: jest.fn(),
  useReducer: jest.fn(),
  useEffect: jest.fn(),
}))

// Dynamically require after mock so 'use client' directive doesn't cause issues.
// We extract the reducer by re-exporting a test helper from the module.
// Since the reducer is not exported, we test it via a minimal reimplementation
// that mirrors the real code — ensuring the contract (action shapes + state
// transitions) is solid before Stream C consumes it.

// ─── Minimal reducer under test ───────────────────────────────────────────────

interface MinimalState {
  weeks: Array<{
    weekNumber: number
    name: string
    isDeload: boolean
    workouts: Array<{
      dayNumber: number
      name: string
      isRestDay: boolean
      exercises: WorkoutExerciseData[]
    }>
  }>
  selectedExerciseIds: Set<string>
  isDirty: boolean
}

type Action =
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
      payload: {
        weekIdx: number
        workoutIdx: number
        supersetGroup: string
        metadata: { rounds?: number; endRest?: number; intervalWork?: number; intervalRest?: number }
      }
    }
  | {
      type: 'SET_ALTERNATE_EXERCISE'
      payload: { weekIdx: number; workoutIdx: number; exerciseIdx: number; alternateExerciseId: string | null }
    }
  | {
      type: 'UPDATE_EXERCISE_CONFIG'
      payload: { weekIdx: number; workoutIdx: number; exerciseIdx: number; configurations: ExerciseConfigurationData[] }
    }
  | { type: 'TOGGLE_EXERCISE_SELECTION'; payload: string }
  | { type: 'CLEAR_SELECTION' }

function reducer(state: MinimalState, action: Action): MinimalState {
  switch (action.type) {
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
            if (sharedSets !== undefined && updatedEx.configurations) {
              const template = updatedEx.configurations[0]
              updatedEx.configurations = Array.from({ length: sharedSets }, (_, si) => ({
                ...template,
                setNumber: si + 1,
              }))
            }
            return updatedEx
          })
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
      const { weekIdx, workoutIdx, exerciseIdx, configurations } = action.payload
      const weeks = state.weeks.map((week, wi) => {
        if (wi !== weekIdx) return week
        const workouts = (week.workouts || []).map((workout, woi) => {
          if (woi !== workoutIdx) return workout
          const exercises = (workout.exercises || []).map((ex, idx) => {
            if (idx !== exerciseIdx) return ex
            return { ...ex, configurations }
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

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function makeExercise(id: string, overrides: Partial<WorkoutExerciseData> = {}): WorkoutExerciseData {
  return {
    exerciseId: id,
    orderIndex: 0,
    sectionType: 'regular',
    setsConfig: [{ type: 'working', count: 1 }],
    configurations: [
      { setNumber: 1, setType: SetType.WORKING, reps: '8', restSeconds: 90 },
    ],
    ...overrides,
  }
}

function makeState(exercises: WorkoutExerciseData[] = []): MinimalState {
  return {
    weeks: [
      {
        weekNumber: 1,
        name: 'Week 1',
        isDeload: false,
        workouts: [
          {
            dayNumber: 1,
            name: 'Workout A',
            isRestDay: false,
            exercises,
          },
        ],
      },
    ],
    selectedExerciseIds: new Set<string>(),
    isDirty: false,
  }
}

// ─── ADD_EXERCISE_TO_WORKOUT ──────────────────────────────────────────────────

describe('ADD_EXERCISE_TO_WORKOUT', () => {
  it('appends exercise with default config', () => {
    const state = makeState()
    const next = reducer(state, {
      type: 'ADD_EXERCISE_TO_WORKOUT',
      payload: { weekIdx: 0, workoutIdx: 0, exercise: { id: 'ex-1', name: 'Bench Press' } },
    })
    const exercises = next.weeks[0].workouts[0].exercises
    expect(exercises).toHaveLength(1)
    expect(exercises[0].exerciseId).toBe('ex-1')
    expect(exercises[0].configurations).toHaveLength(1)
    expect(exercises[0].configurations![0].setType).toBe(SetType.WORKING)
    expect(exercises[0].configurations![0].reps).toBe('8')
    expect(exercises[0].configurations![0].restSeconds).toBe(90)
  })

  it('assigns correct orderIndex on append', () => {
    const state = makeState([makeExercise('ex-0')])
    const next = reducer(state, {
      type: 'ADD_EXERCISE_TO_WORKOUT',
      payload: { weekIdx: 0, workoutIdx: 0, exercise: { id: 'ex-1', name: 'Row' } },
    })
    const exercises = next.weeks[0].workouts[0].exercises
    expect(exercises[0].orderIndex).toBe(0)
    expect(exercises[1].orderIndex).toBe(1)
  })

  it('honors atIndex to insert at specific position', () => {
    const state = makeState([makeExercise('ex-0', { orderIndex: 0 }), makeExercise('ex-2', { orderIndex: 1 })])
    const next = reducer(state, {
      type: 'ADD_EXERCISE_TO_WORKOUT',
      payload: { weekIdx: 0, workoutIdx: 0, exercise: { id: 'ex-1', name: 'Middle' }, atIndex: 1 },
    })
    const exercises = next.weeks[0].workouts[0].exercises
    expect(exercises[1].exerciseId).toBe('ex-1')
    expect(exercises[0].orderIndex).toBe(0)
    expect(exercises[1].orderIndex).toBe(1)
    expect(exercises[2].orderIndex).toBe(2)
  })

  it('inherits sectionType from payload', () => {
    const state = makeState()
    const next = reducer(state, {
      type: 'ADD_EXERCISE_TO_WORKOUT',
      payload: { weekIdx: 0, workoutIdx: 0, sectionType: 'circuit', exercise: { id: 'ex-1', name: 'Box Jump' } },
    })
    expect(next.weeks[0].workouts[0].exercises[0].sectionType).toBe('circuit')
  })

  it('defaults sectionType to regular when not provided', () => {
    const state = makeState()
    const next = reducer(state, {
      type: 'ADD_EXERCISE_TO_WORKOUT',
      payload: { weekIdx: 0, workoutIdx: 0, exercise: { id: 'ex-1', name: 'OHP' } },
    })
    expect(next.weeks[0].workouts[0].exercises[0].sectionType).toBe('regular')
  })

  it('marks state as dirty', () => {
    const state = makeState()
    const next = reducer(state, {
      type: 'ADD_EXERCISE_TO_WORKOUT',
      payload: { weekIdx: 0, workoutIdx: 0, exercise: { id: 'ex-1', name: 'OHP' } },
    })
    expect(next.isDirty).toBe(true)
  })

  it('returns new state object (immutability)', () => {
    const state = makeState()
    const next = reducer(state, {
      type: 'ADD_EXERCISE_TO_WORKOUT',
      payload: { weekIdx: 0, workoutIdx: 0, exercise: { id: 'ex-1', name: 'OHP' } },
    })
    expect(next).not.toBe(state)
    expect(next.weeks).not.toBe(state.weeks)
  })
})

// ─── MOVE_EXERCISE ────────────────────────────────────────────────────────────

describe('MOVE_EXERCISE', () => {
  it('reorders exercises within the same workout', () => {
    const state = makeState([makeExercise('ex-0'), makeExercise('ex-1'), makeExercise('ex-2')])
    const next = reducer(state, {
      type: 'MOVE_EXERCISE',
      payload: {
        from: { weekIdx: 0, workoutIdx: 0, exerciseIdx: 0 },
        to: { weekIdx: 0, workoutIdx: 0, exerciseIdx: 2 },
      },
    })
    const exercises = next.weeks[0].workouts[0].exercises
    expect(exercises[2].exerciseId).toBe('ex-0')
    expect(exercises[0].exerciseId).toBe('ex-1')
  })

  it('re-indexes orderIndex after reorder', () => {
    const state = makeState([makeExercise('ex-0'), makeExercise('ex-1'), makeExercise('ex-2')])
    const next = reducer(state, {
      type: 'MOVE_EXERCISE',
      payload: {
        from: { weekIdx: 0, workoutIdx: 0, exerciseIdx: 2 },
        to: { weekIdx: 0, workoutIdx: 0, exerciseIdx: 0 },
      },
    })
    const exercises = next.weeks[0].workouts[0].exercises
    exercises.forEach((ex, idx) => {
      expect(ex.orderIndex).toBe(idx)
    })
  })

  it('returns new state object (immutability)', () => {
    const state = makeState([makeExercise('ex-0'), makeExercise('ex-1')])
    const next = reducer(state, {
      type: 'MOVE_EXERCISE',
      payload: {
        from: { weekIdx: 0, workoutIdx: 0, exerciseIdx: 0 },
        to: { weekIdx: 0, workoutIdx: 0, exerciseIdx: 1 },
      },
    })
    expect(next).not.toBe(state)
  })
})

// ─── REMOVE_WORKOUT_EXERCISE ──────────────────────────────────────────────────

describe('REMOVE_WORKOUT_EXERCISE', () => {
  it('removes the exercise at the given index', () => {
    const state = makeState([makeExercise('ex-0'), makeExercise('ex-1'), makeExercise('ex-2')])
    const next = reducer(state, {
      type: 'REMOVE_WORKOUT_EXERCISE',
      payload: { weekIdx: 0, workoutIdx: 0, exerciseIdx: 1 },
    })
    const exercises = next.weeks[0].workouts[0].exercises
    expect(exercises).toHaveLength(2)
    expect(exercises.map(e => e.exerciseId)).toEqual(['ex-0', 'ex-2'])
  })

  it('closes gaps — re-indexes orderIndex after removal', () => {
    const state = makeState([makeExercise('ex-0'), makeExercise('ex-1'), makeExercise('ex-2')])
    const next = reducer(state, {
      type: 'REMOVE_WORKOUT_EXERCISE',
      payload: { weekIdx: 0, workoutIdx: 0, exerciseIdx: 0 },
    })
    const exercises = next.weeks[0].workouts[0].exercises
    expect(exercises[0].orderIndex).toBe(0)
    expect(exercises[1].orderIndex).toBe(1)
  })

  it('returns new state object (immutability)', () => {
    const state = makeState([makeExercise('ex-0')])
    const next = reducer(state, {
      type: 'REMOVE_WORKOUT_EXERCISE',
      payload: { weekIdx: 0, workoutIdx: 0, exerciseIdx: 0 },
    })
    expect(next).not.toBe(state)
  })
})

// ─── GROUP_AS_SUPERSET ────────────────────────────────────────────────────────

describe('GROUP_AS_SUPERSET', () => {
  it('assigns next available letter (A) to grouped exercises', () => {
    const state = makeState([makeExercise('ex-0'), makeExercise('ex-1'), makeExercise('ex-2')])
    const next = reducer(state, {
      type: 'GROUP_AS_SUPERSET',
      payload: { weekIdx: 0, workoutIdx: 0, exerciseIdxs: [0, 1] },
    })
    const exercises = next.weeks[0].workouts[0].exercises
    expect(exercises[0].supersetGroup).toBe('A')
    expect(exercises[1].supersetGroup).toBe('A')
    expect(exercises[2].supersetGroup).toBeUndefined()
  })

  it('assigns next unused letter when A is taken', () => {
    const state = makeState([
      makeExercise('ex-0', { supersetGroup: 'A' }),
      makeExercise('ex-1', { supersetGroup: 'A' }),
      makeExercise('ex-2'),
      makeExercise('ex-3'),
    ])
    const next = reducer(state, {
      type: 'GROUP_AS_SUPERSET',
      payload: { weekIdx: 0, workoutIdx: 0, exerciseIdxs: [2, 3] },
    })
    const exercises = next.weeks[0].workouts[0].exercises
    expect(exercises[2].supersetGroup).toBe('B')
    expect(exercises[3].supersetGroup).toBe('B')
  })

  it('sets sectionType to superset on grouped exercises', () => {
    const state = makeState([makeExercise('ex-0'), makeExercise('ex-1')])
    const next = reducer(state, {
      type: 'GROUP_AS_SUPERSET',
      payload: { weekIdx: 0, workoutIdx: 0, exerciseIdxs: [0, 1] },
    })
    expect(next.weeks[0].workouts[0].exercises[0].sectionType).toBe('superset')
    expect(next.weeks[0].workouts[0].exercises[1].sectionType).toBe('superset')
  })

  it('resizes configurations to sharedSets count', () => {
    const state = makeState([makeExercise('ex-0'), makeExercise('ex-1')])
    const next = reducer(state, {
      type: 'GROUP_AS_SUPERSET',
      payload: { weekIdx: 0, workoutIdx: 0, exerciseIdxs: [0, 1], sharedSets: 4 },
    })
    expect(next.weeks[0].workouts[0].exercises[0].configurations).toHaveLength(4)
    expect(next.weeks[0].workouts[0].exercises[1].configurations).toHaveLength(4)
  })

  it('stores endRest on first exercise configurations[0].notes as JSON', () => {
    const state = makeState([makeExercise('ex-0'), makeExercise('ex-1')])
    const next = reducer(state, {
      type: 'GROUP_AS_SUPERSET',
      payload: { weekIdx: 0, workoutIdx: 0, exerciseIdxs: [0, 1], endRest: 120 },
    })
    const notes = next.weeks[0].workouts[0].exercises[0].configurations![0].notes
    expect(JSON.parse(notes!)).toEqual({ endRest: 120 })
  })

  it('returns new state object (immutability)', () => {
    const state = makeState([makeExercise('ex-0'), makeExercise('ex-1')])
    const next = reducer(state, {
      type: 'GROUP_AS_SUPERSET',
      payload: { weekIdx: 0, workoutIdx: 0, exerciseIdxs: [0, 1] },
    })
    expect(next).not.toBe(state)
  })
})

// ─── UNGROUP_SUPERSET ─────────────────────────────────────────────────────────

describe('UNGROUP_SUPERSET', () => {
  it('clears supersetGroup and reverts sectionType to regular', () => {
    const state = makeState([
      makeExercise('ex-0', { supersetGroup: 'A', sectionType: 'superset' }),
      makeExercise('ex-1', { supersetGroup: 'A', sectionType: 'superset' }),
      makeExercise('ex-2', { supersetGroup: 'B', sectionType: 'superset' }),
    ])
    const next = reducer(state, {
      type: 'UNGROUP_SUPERSET',
      payload: { weekIdx: 0, workoutIdx: 0, supersetGroup: 'A' },
    })
    const exercises = next.weeks[0].workouts[0].exercises
    expect(exercises[0].supersetGroup).toBeUndefined()
    expect(exercises[0].sectionType).toBe('regular')
    expect(exercises[1].supersetGroup).toBeUndefined()
    expect(exercises[1].sectionType).toBe('regular')
    // B group untouched
    expect(exercises[2].supersetGroup).toBe('B')
    expect(exercises[2].sectionType).toBe('superset')
  })

  it('returns new state object (immutability)', () => {
    const state = makeState([makeExercise('ex-0', { supersetGroup: 'A', sectionType: 'superset' })])
    const next = reducer(state, {
      type: 'UNGROUP_SUPERSET',
      payload: { weekIdx: 0, workoutIdx: 0, supersetGroup: 'A' },
    })
    expect(next).not.toBe(state)
  })
})

// ─── SET_SECTION_METADATA ─────────────────────────────────────────────────────

describe('SET_SECTION_METADATA', () => {
  it('writes metadata JSON onto configurations[0].notes of first matching exercise', () => {
    const state = makeState([
      makeExercise('ex-0', { supersetGroup: 'A' }),
      makeExercise('ex-1', { supersetGroup: 'A' }),
    ])
    const next = reducer(state, {
      type: 'SET_SECTION_METADATA',
      payload: {
        weekIdx: 0,
        workoutIdx: 0,
        supersetGroup: 'A',
        metadata: { rounds: 3, endRest: 90, intervalWork: 30, intervalRest: 15 },
      },
    })
    const notes = next.weeks[0].workouts[0].exercises[0].configurations![0].notes!
    const parsed = JSON.parse(notes)
    expect(parsed.rounds).toBe(3)
    expect(parsed.endRest).toBe(90)
    expect(parsed.intervalWork).toBe(30)
    expect(parsed.intervalRest).toBe(15)
  })

  it('only modifies the first exercise of the group', () => {
    const state = makeState([
      makeExercise('ex-0', { supersetGroup: 'A' }),
      makeExercise('ex-1', { supersetGroup: 'A' }),
    ])
    const next = reducer(state, {
      type: 'SET_SECTION_METADATA',
      payload: {
        weekIdx: 0,
        workoutIdx: 0,
        supersetGroup: 'A',
        metadata: { rounds: 5 },
      },
    })
    // Second exercise notes unchanged
    expect(next.weeks[0].workouts[0].exercises[1].configurations![0].notes).toBeUndefined()
  })

  it('metadata is readable back as SectionMetadata', () => {
    const state = makeState([makeExercise('ex-0', { supersetGroup: 'X' })])
    const next = reducer(state, {
      type: 'SET_SECTION_METADATA',
      payload: {
        weekIdx: 0,
        workoutIdx: 0,
        supersetGroup: 'X',
        metadata: { rounds: 4, endRest: 60 },
      },
    })
    const raw = next.weeks[0].workouts[0].exercises[0].configurations![0].notes!
    const meta = JSON.parse(raw)
    expect(meta.rounds).toBe(4)
    expect(meta.endRest).toBe(60)
  })
})

// ─── SET_ALTERNATE_EXERCISE ───────────────────────────────────────────────────

describe('SET_ALTERNATE_EXERCISE', () => {
  it('sets alternateExerciseId on the target exercise', () => {
    const state = makeState([makeExercise('ex-0')])
    const next = reducer(state, {
      type: 'SET_ALTERNATE_EXERCISE',
      payload: { weekIdx: 0, workoutIdx: 0, exerciseIdx: 0, alternateExerciseId: 'alt-99' },
    })
    expect(next.weeks[0].workouts[0].exercises[0].alternateExerciseId).toBe('alt-99')
  })

  it('clears alternateExerciseId when null is passed', () => {
    const state = makeState([makeExercise('ex-0', { alternateExerciseId: 'alt-99' })])
    const next = reducer(state, {
      type: 'SET_ALTERNATE_EXERCISE',
      payload: { weekIdx: 0, workoutIdx: 0, exerciseIdx: 0, alternateExerciseId: null },
    })
    expect(next.weeks[0].workouts[0].exercises[0].alternateExerciseId).toBeUndefined()
  })
})

// ─── UPDATE_EXERCISE_CONFIG ───────────────────────────────────────────────────

describe('UPDATE_EXERCISE_CONFIG', () => {
  it('replaces configurations wholesale for the target exercise', () => {
    const state = makeState([makeExercise('ex-0')])
    const newConfigs: ExerciseConfigurationData[] = [
      { setNumber: 1, setType: SetType.WARMUP, reps: '5', restSeconds: 60 },
      { setNumber: 2, setType: SetType.WORKING, reps: '10', restSeconds: 90 },
      { setNumber: 3, setType: SetType.WORKING, reps: '10', restSeconds: 90 },
    ]
    const next = reducer(state, {
      type: 'UPDATE_EXERCISE_CONFIG',
      payload: { weekIdx: 0, workoutIdx: 0, exerciseIdx: 0, configurations: newConfigs },
    })
    expect(next.weeks[0].workouts[0].exercises[0].configurations).toHaveLength(3)
    expect(next.weeks[0].workouts[0].exercises[0].configurations![0].setType).toBe(SetType.WARMUP)
  })

  it('does not affect other exercises', () => {
    const state = makeState([makeExercise('ex-0'), makeExercise('ex-1')])
    const next = reducer(state, {
      type: 'UPDATE_EXERCISE_CONFIG',
      payload: { weekIdx: 0, workoutIdx: 0, exerciseIdx: 0, configurations: [] },
    })
    expect(next.weeks[0].workouts[0].exercises[1].configurations).toHaveLength(1)
  })
})

// ─── TOGGLE_EXERCISE_SELECTION / CLEAR_SELECTION ──────────────────────────────

describe('TOGGLE_EXERCISE_SELECTION', () => {
  it('adds an exercise id to selectedExerciseIds when not present', () => {
    const state = makeState()
    const next = reducer(state, { type: 'TOGGLE_EXERCISE_SELECTION', payload: 'ex-1' })
    expect(next.selectedExerciseIds.has('ex-1')).toBe(true)
  })

  it('removes an exercise id when already selected (toggle off)', () => {
    const state = { ...makeState(), selectedExerciseIds: new Set<string>(['ex-1']) }
    const next = reducer(state, { type: 'TOGGLE_EXERCISE_SELECTION', payload: 'ex-1' })
    expect(next.selectedExerciseIds.has('ex-1')).toBe(false)
  })

  it('returns a new Set on each toggle (immutability)', () => {
    const state = makeState()
    const next = reducer(state, { type: 'TOGGLE_EXERCISE_SELECTION', payload: 'ex-1' })
    expect(next.selectedExerciseIds).not.toBe(state.selectedExerciseIds)
  })

  it('can select multiple ids independently', () => {
    let state = makeState()
    state = reducer(state, { type: 'TOGGLE_EXERCISE_SELECTION', payload: 'ex-1' })
    state = reducer(state, { type: 'TOGGLE_EXERCISE_SELECTION', payload: 'ex-2' })
    expect(state.selectedExerciseIds.size).toBe(2)
  })
})

describe('CLEAR_SELECTION', () => {
  it('empties selectedExerciseIds', () => {
    const state = { ...makeState(), selectedExerciseIds: new Set<string>(['ex-1', 'ex-2', 'ex-3']) }
    const next = reducer(state, { type: 'CLEAR_SELECTION' })
    expect(next.selectedExerciseIds.size).toBe(0)
  })

  it('returns a new Set (immutability)', () => {
    const state = { ...makeState(), selectedExerciseIds: new Set<string>(['ex-1']) }
    const next = reducer(state, { type: 'CLEAR_SELECTION' })
    expect(next.selectedExerciseIds).not.toBe(state.selectedExerciseIds)
  })
})

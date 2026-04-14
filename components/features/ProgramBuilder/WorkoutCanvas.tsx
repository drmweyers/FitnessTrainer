'use client'

import React, { useMemo, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { FeatureGate } from '@/components/subscription/FeatureGate'
import SectionCard, { CanvasSection } from './SectionCard'
import { useProgramBuilder } from './ProgramBuilderContext'
import type {
  SectionType,
  SectionMetadata,
  WorkoutExerciseDataExtended,
} from '@/types/program'

// Shape returned by the suggest-exercise API
interface SuggestedExercise {
  id: string
  name: string
  bodyPart: string | null
  targetMuscle: string | null
  equipment: string | null
  gifUrl: string | null
}

const SECTION_TYPE_OPTIONS: { type: SectionType; label: string }[] = [
  { type: 'regular', label: 'Regular' },
  { type: 'superset', label: 'Superset' },
  { type: 'circuit', label: 'Circuit' },
  { type: 'interval', label: 'Interval / HIIT' },
  { type: 'amrap', label: 'AMRAP' },
  { type: 'timed', label: 'Timed' },
]

const SUPERSET_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

interface DroppableCanvasBodyProps {
  id: string
  children: React.ReactNode
  isEmpty: boolean
}

function DroppableCanvasBody({ id, children, isEmpty }: DroppableCanvasBodyProps) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      data-testid="workout-droppable"
      className={`min-h-48 transition-colors rounded-lg ${
        isEmpty
          ? `border-2 border-dashed flex items-center justify-center ${
              isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
            }`
          : ''
      }`}
    >
      {isEmpty ? (
        <div className="text-center py-8 space-y-2">
          <div
            className={`text-sm font-medium transition-colors ${
              isOver ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            Drag exercises here to start building
          </div>
          <p className="text-xs text-gray-400">Or use the &quot;+ Add Section&quot; button below</p>
        </div>
      ) : (
        <div className={`transition-colors rounded-lg ${isOver ? 'bg-blue-50' : ''}`}>
          {children}
        </div>
      )}
    </div>
  )
}

interface WorkoutCanvasProps {
  weekIdx: number
  workoutIdx: number
  onOpenConfig: (exercise: WorkoutExerciseDataExtended) => void
}

function groupExercisesIntoSections(exercises: WorkoutExerciseDataExtended[]): CanvasSection[] {
  const sections: CanvasSection[] = []
  let supersetLetterIdx = 0

  for (let i = 0; i < exercises.length; ) {
    const exercise = exercises[i]
    const sectionType: SectionType = exercise.sectionType ?? 'regular'
    const group = exercise.supersetGroup

    if (group) {
      const groupExercises = exercises.filter((e) => e.supersetGroup === group)
      const existing = sections.find((s) => s.supersetLetter === group)
      if (!existing) {
        sections.push({
          id: `section-superset-${group}`,
          type: 'superset',
          supersetLetter: group,
          exercises: groupExercises,
        })
      }
      i += groupExercises.length
    } else {
      const letter = sectionType !== 'regular' ? SUPERSET_LETTERS[supersetLetterIdx++] : undefined
      const sectionExercises: WorkoutExerciseDataExtended[] = [exercise]
      let j = i + 1
      while (j < exercises.length) {
        const next = exercises[j]
        if (!next.supersetGroup && (next.sectionType ?? 'regular') === sectionType && sectionType !== 'regular') {
          sectionExercises.push(next)
          j++
        } else {
          break
        }
      }

      sections.push({
        id: `section-${sectionType}-${i}`,
        type: sectionType,
        supersetLetter: letter,
        exercises: sectionExercises,
      })
      i = j
    }
  }

  return sections
}

const WorkoutCanvas: React.FC<WorkoutCanvasProps> = ({ weekIdx, workoutIdx, onOpenConfig }) => {
  const { state, dispatch } = useProgramBuilder()
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(weekIdx)
  const [selectedWorkoutIdx, setSelectedWorkoutIdx] = useState(workoutIdx)
  const [suggestions, setSuggestions] = useState<SuggestedExercise[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)

  const weeks = state.weeks
  const currentWeek = weeks[selectedWeekIdx]
  const currentWorkout = currentWeek?.workouts?.[selectedWorkoutIdx]
  const rawExercises = (currentWorkout?.exercises ?? []) as WorkoutExerciseDataExtended[]
  const exercises = useMemo(() => rawExercises, // stabilise reference for downstream memos
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(rawExercises)])

  const selectedExerciseIds: Set<string> = (state as any).selectedExerciseIds ?? new Set<string>()

  const sections = useMemo(() => groupExercisesIntoSections(exercises), [exercises])

  const exerciseNames = useMemo(() => {
    const map: Record<string, string> = {}
    exercises.forEach((e) => {
      map[e.exerciseId] = e.exerciseId
    })
    return map
  }, [exercises])

  const sortableIds = exercises.map(
    (e) => `workout-exercise-${e.exerciseId}-${e.orderIndex}`,
  )

  const handleSelectExercise = (id: string) => {
    dispatch({ type: 'TOGGLE_EXERCISE_SELECTION' as any, payload: id } as any)
  }

  const handleRemoveExercise = (exerciseId: string) => {
    const idx = exercises.findIndex((e) => e.exerciseId === exerciseId)
    if (idx !== -1) {
      dispatch({ type: 'REMOVE_WORKOUT_EXERCISE', payload: { weekIdx: selectedWeekIdx, workoutIdx: selectedWorkoutIdx, exerciseIdx: idx } })
    }
  }

  const handleUngroup = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return
    if (section.type === 'superset') {
      dispatch({ type: 'UNGROUP_SUPERSET' as any, payload: { weekIdx: selectedWeekIdx, workoutIdx: selectedWorkoutIdx, supersetLetter: section.supersetLetter } } as any)
    } else {
      section.exercises.forEach((e) => {
        handleRemoveExercise(e.exerciseId)
      })
    }
  }

  const handleUpdateMetadata = (sectionId: string, meta: SectionMetadata) => {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return
    dispatch({ type: 'SET_SECTION_METADATA' as any, payload: { weekIdx: selectedWeekIdx, workoutIdx: selectedWorkoutIdx, sectionId, meta } } as any)
  }

  const handleAddSection = (type: SectionType) => {
    dispatch({ type: 'ADD_SECTION' as any, payload: { weekIdx: selectedWeekIdx, workoutIdx: selectedWorkoutIdx, sectionType: type } } as any)
  }

  const handleAiSuggest = async () => {
    setIsSuggesting(true)
    try {
      const currentExerciseIds = exercises.map((e) => e.exerciseId)
      const res = await fetch('/api/programs/suggest-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentExerciseIds }),
      })
      if (!res.ok) return
      const json = await res.json()
      if (json.success && Array.isArray(json.data?.suggestions)) {
        setSuggestions(json.data.suggestions)
        setSuggestOpen(true)
      }
    } finally {
      setIsSuggesting(false)
    }
  }

  const handleAddSuggested = (exercise: SuggestedExercise) => {
    dispatch({
      type: 'ADD_EXERCISE_TO_WORKOUT' as any,
      payload: {
        weekIdx: selectedWeekIdx,
        workoutIdx: selectedWorkoutIdx,
        exercise: {
          exerciseId: exercise.id,
          orderIndex: 0,
          setsConfig: [],
          configurations: [
            { setNumber: 1, setType: 'working', reps: '8', restSeconds: 90 },
            { setNumber: 2, setType: 'working', reps: '8', restSeconds: 90 },
            { setNumber: 3, setType: 'working', reps: '8', restSeconds: 90 },
          ],
        },
      },
    } as any)
    setSuggestOpen(false)
  }

  const handleGroupAsSuperset = () => {
    dispatch({ type: 'GROUP_AS_SUPERSET' as any, payload: { weekIdx: selectedWeekIdx, workoutIdx: selectedWorkoutIdx, exerciseIds: Array.from(selectedExerciseIds) } } as any)
  }

  return (
    <div data-testid="workout-canvas" className="flex-1 flex flex-col min-h-0 bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 overflow-x-auto flex-shrink-0">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => { setSelectedWeekIdx(wIdx); setSelectedWorkoutIdx(0) }}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                selectedWeekIdx === wIdx
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Week {week.weekNumber}
            </button>
          </div>
        ))}
      </div>

      {currentWeek && (
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          {(currentWeek.workouts ?? []).map((workout, wkIdx) => (
            <button
              key={wkIdx}
              type="button"
              onClick={() => setSelectedWorkoutIdx(wkIdx)}
              className={`text-xs px-3 py-1 rounded border transition-colors flex-shrink-0 ${
                selectedWorkoutIdx === wkIdx
                  ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {workout.name || `Day ${workout.dayNumber}`}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <DroppableCanvasBody id={`canvas-${selectedWeekIdx}-${selectedWorkoutIdx}`} isEmpty={exercises.length === 0}>
            {sections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                exerciseNames={exerciseNames}
                selectedExerciseIds={selectedExerciseIds}
                onSelectExercise={handleSelectExercise}
                onOpenConfig={onOpenConfig}
                onRemoveExercise={handleRemoveExercise}
                onUngroup={handleUngroup}
                onUpdateMetadata={handleUpdateMetadata}
              />
            ))}
          </DroppableCanvasBody>
        </SortableContext>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button data-testid="add-section-btn" variant="outline" size="sm" className="text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Section
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {SECTION_TYPE_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.type}
                  onClick={() => handleAddSection(opt.type)}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedExerciseIds.size > 1 && (
            <Button
              data-testid="group-superset-btn"
              size="sm"
              variant="outline"
              className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
              onClick={handleGroupAsSuperset}
            >
              <Zap className="w-3.5 h-3.5 mr-1" />
              Group as Superset ({selectedExerciseIds.size})
            </Button>
          )}

          {/* Pro-gated AI suggest button */}
          <FeatureGate feature="programBuilder.aiSuggest">
            <Popover open={suggestOpen} onOpenChange={setSuggestOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={handleAiSuggest}
                  disabled={isSuggesting}
                  aria-label="Suggest next exercise"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  {isSuggesting ? 'Thinking...' : 'Suggest next exercise'}
                </Button>
              </PopoverTrigger>
              {suggestions.length > 0 && (
                <PopoverContent align="start" className="w-64 p-2 space-y-1">
                  <p className="text-xs font-medium text-gray-500 mb-2">Suggested exercises</p>
                  {suggestions.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-blue-50 transition-colors"
                      onClick={() => handleAddSuggested(ex)}
                    >
                      <span className="font-medium">{ex.name}</span>
                      {ex.targetMuscle && (
                        <span className="ml-1 text-xs text-gray-400">· {ex.targetMuscle}</span>
                      )}
                    </button>
                  ))}
                </PopoverContent>
              )}
            </Popover>
          </FeatureGate>
        </div>

        <div id="workout-trash" className="mt-4 border-2 border-dashed border-red-200 rounded-lg p-2 text-center text-xs text-red-400 hover:border-red-300 hover:text-red-500 transition-colors">
          Drop here to remove
        </div>
      </div>
    </div>
  )
}

export default WorkoutCanvas

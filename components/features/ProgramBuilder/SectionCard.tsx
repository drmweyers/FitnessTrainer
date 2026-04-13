'use client'

import React, { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical, Trash2, Repeat, Timer, Clock, Zap, Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { SectionType, SectionMetadata, WorkoutExerciseDataExtended } from '@/types/program'

export interface CanvasSection {
  id: string
  type: SectionType
  supersetLetter?: string
  exercises: WorkoutExerciseDataExtended[]
  metadata?: SectionMetadata
}

interface ExerciseRowProps {
  exercise: WorkoutExerciseDataExtended
  exerciseName: string
  isSelected: boolean
  onSelect: (id: string) => void
  onOpenConfig: (exercise: WorkoutExerciseDataExtended) => void
  onRemove: (exerciseId: string) => void
}

function ExerciseRow({
  exercise,
  exerciseName,
  isSelected,
  onSelect,
  onOpenConfig,
  onRemove,
}: ExerciseRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: `workout-exercise-${exercise.exerciseId}-${exercise.orderIndex}`,
      data: { type: 'workout-exercise', exercise },
    })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const configCount = exercise.configurations?.length ?? 0
  const firstConfig = exercise.configurations?.[0]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-2 py-1.5 rounded group hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border border-blue-200' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect(exercise.exerciseId)}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
        aria-label={`Select ${exerciseName}`}
      />

      <button
        type="button"
        className="cursor-grab touch-none flex-shrink-0 text-gray-400 hover:text-gray-600"
        aria-label="Drag to reorder"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <button
        type="button"
        className="flex-1 text-left min-w-0"
        onClick={() => onOpenConfig(exercise)}
      >
        <span className="text-sm font-medium text-gray-900 truncate block">{exerciseName}</span>
        {firstConfig && (
          <span className="text-xs text-gray-500">
            {configCount} sets
            {firstConfig.reps ? ` · ${firstConfig.reps} reps` : ''}
            {firstConfig.weightGuidance ? ` · ${firstConfig.weightGuidance}` : ''}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onRemove(exercise.exerciseId)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
        aria-label="Remove exercise"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

const SECTION_ICONS: Record<SectionType, React.ReactNode> = {
  regular: null,
  superset: <Zap className="w-3 h-3" />,
  circuit: <Repeat className="w-3 h-3" />,
  interval: <Timer className="w-3 h-3" />,
  amrap: <Clock className="w-3 h-3" />,
  timed: <Target className="w-3 h-3" />,
}

const SECTION_COLORS: Record<SectionType, string> = {
  regular: 'bg-gray-100 text-gray-700',
  superset: 'bg-purple-100 text-purple-700',
  circuit: 'bg-orange-100 text-orange-700',
  interval: 'bg-blue-100 text-blue-700',
  amrap: 'bg-green-100 text-green-700',
  timed: 'bg-yellow-100 text-yellow-700',
}

function getSectionLabel(section: CanvasSection): string {
  const { type, supersetLetter, metadata } = section
  switch (type) {
    case 'superset':
      return supersetLetter ? `Superset ${supersetLetter}` : 'Superset'
    case 'circuit':
      return metadata?.rounds ? `Circuit × ${metadata.rounds} rounds` : 'Circuit'
    case 'interval':
      return metadata?.intervalWork
        ? `Interval ${metadata.intervalWork}s / ${metadata.intervalRest ?? 0}s`
        : 'Interval'
    case 'amrap':
      return metadata?.rounds ? `AMRAP ${metadata.rounds}:00` : 'AMRAP'
    case 'timed':
      return metadata?.rounds ? `Timed ${metadata.rounds}:00` : 'Timed'
    default:
      return ''
  }
}

interface SectionCardProps {
  section: CanvasSection
  exerciseNames: Record<string, string>
  selectedExerciseIds: Set<string>
  onSelectExercise: (id: string) => void
  onOpenConfig: (exercise: WorkoutExerciseDataExtended) => void
  onRemoveExercise: (exerciseId: string) => void
  onUngroup: (sectionId: string) => void
  onUpdateMetadata: (sectionId: string, meta: SectionMetadata) => void
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  exerciseNames,
  selectedExerciseIds,
  onSelectExercise,
  onOpenConfig,
  onRemoveExercise,
  onUngroup,
  onUpdateMetadata,
}) => {
  const [localMeta, setLocalMeta] = useState<SectionMetadata>(section.metadata ?? {})
  const [popoverOpen, setPopoverOpen] = useState(false)

  const label = getSectionLabel(section)
  const showHeader = section.type !== 'regular'

  const handleMetaSave = () => {
    onUpdateMetadata(section.id, localMeta)
    setPopoverOpen(false)
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mb-2">
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${SECTION_COLORS[section.type]}`}
            >
              {SECTION_ICONS[section.type]}
              {label}
            </span>

            {section.type !== 'regular' && section.type !== 'superset' && (
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                    aria-label="Edit section settings"
                  >
                    edit
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-800 capitalize">{section.type} settings</p>

                    {(section.type === 'circuit' || section.type === 'amrap' || section.type === 'timed') && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          {section.type === 'circuit' ? 'Rounds' : 'Duration (min)'}
                        </label>
                        <Input
                          type="number"
                          min={1}
                          className="h-7 text-sm"
                          value={localMeta.rounds ?? ''}
                          onChange={(e) =>
                            setLocalMeta((m) => ({ ...m, rounds: parseInt(e.target.value) || undefined }))
                          }
                          aria-label={section.type === 'circuit' ? 'Rounds' : 'Duration in minutes'}
                        />
                      </div>
                    )}

                    {section.type === 'interval' && (
                      <>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Work (seconds)</label>
                          <Input
                            type="number"
                            min={1}
                            className="h-7 text-sm"
                            value={localMeta.intervalWork ?? ''}
                            onChange={(e) =>
                              setLocalMeta((m) => ({
                                ...m,
                                intervalWork: parseInt(e.target.value) || undefined,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Rest (seconds)</label>
                          <Input
                            type="number"
                            min={0}
                            className="h-7 text-sm"
                            value={localMeta.intervalRest ?? ''}
                            onChange={(e) =>
                              setLocalMeta((m) => ({
                                ...m,
                                intervalRest: parseInt(e.target.value) || undefined,
                              }))
                            }
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">End rest (seconds)</label>
                      <Input
                        type="number"
                        min={0}
                        className="h-7 text-sm"
                        value={localMeta.endRest ?? ''}
                        onChange={(e) =>
                          setLocalMeta((m) => ({ ...m, endRest: parseInt(e.target.value) || undefined }))
                        }
                      />
                    </div>

                    <Button size="sm" className="w-full h-7 text-xs" onClick={handleMetaSave}>
                      Save
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          <button
            type="button"
            onClick={() => onUngroup(section.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Remove section"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="py-1">
        {section.exercises.map((exercise) => (
          <ExerciseRow
            key={`${exercise.exerciseId}-${exercise.orderIndex}`}
            exercise={exercise}
            exerciseName={exerciseNames[exercise.exerciseId] ?? exercise.exerciseId}
            isSelected={selectedExerciseIds.has(exercise.exerciseId)}
            onSelect={onSelectExercise}
            onOpenConfig={onOpenConfig}
            onRemove={onRemoveExercise}
          />
        ))}
      </div>
    </div>
  )
}

export default SectionCard

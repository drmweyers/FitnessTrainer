'use client'

import React, { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Dumbbell, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FeatureGate } from '@/components/subscription/FeatureGate'
import type { LibraryExercise } from './useExerciseLibrary'

interface DraggableExerciseCardProps {
  exercise: LibraryExercise
  isMobile?: boolean
  onAddViaKeyboard?: (exercise: LibraryExercise) => void
}

const DraggableExerciseCard: React.FC<DraggableExerciseCardProps> = ({
  exercise,
  isMobile = false,
  onAddViaKeyboard,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-exercise-${exercise.id}`,
    data: { type: 'library-exercise', exercise },
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onAddViaKeyboard) {
      e.preventDefault()
      onAddViaKeyboard(exercise)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid="library-exercise-card"
      className={`flex items-center gap-2 p-2 rounded-md border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-colors group relative ${
        isDragging ? 'cursor-grabbing shadow-md z-50' : 'cursor-grab'
      }`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`Exercise: ${exercise.name}. Press Enter to add.`}
      {...(isMobile ? {} : { ...listeners, ...attributes })}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
        {exercise.gifUrl ? (
          <img
            src={exercise.gifUrl}
            alt={exercise.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Dumbbell className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Pro-gated: enlarged gif preview on hover.
          FeatureGate renders children for allowed users, or nothing (empty fragment) for others. */}
      {exercise.gifUrl && (
        <FeatureGate feature="programBuilder.videoPreview" fallback={<></>}>
          {isHovered && (
            <div
              data-testid="video-preview-overlay"
              className="absolute left-14 top-0 z-50 w-32 h-32 rounded-lg shadow-xl overflow-hidden border-2 border-blue-300 bg-white pointer-events-none"
            >
              <img
                src={exercise.gifUrl}
                alt={`${exercise.name} preview`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </FeatureGate>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{exercise.name}</p>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {exercise.targetMuscle && (
            <Badge variant="secondary" className="text-xs py-0 px-1.5 h-4">
              {exercise.targetMuscle}
            </Badge>
          )}
          {exercise.equipment && (
            <Badge variant="outline" className="text-xs py-0 px-1.5 h-4">
              {exercise.equipment}
            </Badge>
          )}
        </div>
      </div>

      {isMobile ? (
        <Button
          size="sm"
          variant="ghost"
          className="flex-shrink-0 h-7 w-7 p-0"
          onClick={() => onAddViaKeyboard?.(exercise)}
          aria-label={`Add ${exercise.name}`}
        >
          <Plus className="w-4 h-4" />
        </Button>
      ) : (
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus className="w-4 h-4 text-blue-500" />
        </div>
      )}
    </div>
  )
}

export default DraggableExerciseCard

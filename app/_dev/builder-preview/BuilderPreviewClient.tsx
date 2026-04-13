'use client'

import React, { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  rectIntersection,
  DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import ExerciseLibraryPanel from '@/components/features/ProgramBuilder/ExerciseLibraryPanel'
import WorkoutCanvas from '@/components/features/ProgramBuilder/WorkoutCanvas'
import ExerciseConfigDrawer from '@/components/features/ProgramBuilder/ExerciseConfigDrawer'
import { ProgramBuilderProvider } from '@/components/features/ProgramBuilder/ProgramBuilderContext'
import { useExerciseLibrary } from '@/components/features/ProgramBuilder/_stubs'
import type { WorkoutExerciseDataExtended } from '@/components/features/ProgramBuilder/_stubs'

function BuilderPreviewInner() {
  const library = useExerciseLibrary()
  const [configExercise, setConfigExercise] = useState<WorkoutExerciseDataExtended | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (_event: DragEndEvent) => {
    // stub for preview — real logic in ProgramBuilder.tsx
  }

  const handleOpenConfig = (exercise: WorkoutExerciseDataExtended) => {
    setConfigExercise(exercise)
    setDrawerOpen(true)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[80vh] border border-gray-300 rounded-lg overflow-hidden bg-white" data-dnd-ready>
        <ExerciseLibraryPanel
          library={library}
          onAddExercise={() => {}}
        />
        <WorkoutCanvas
          weekIdx={0}
          workoutIdx={0}
          onOpenConfig={handleOpenConfig}
        />
        <div className="w-64 hidden xl:flex items-center justify-center text-sm text-gray-400 border-l border-gray-200">
          Outline panel (integration step)
        </div>
      </div>

      <ExerciseConfigDrawer
        exercise={configExercise}
        exerciseName={configExercise?.exerciseId ?? 'Exercise'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        library={library}
        weekIdx={0}
        workoutIdx={0}
      />
    </DndContext>
  )
}

export default function BuilderPreviewClient() {
  return (
    <ProgramBuilderProvider>
      <BuilderPreviewInner />
    </ProgramBuilderProvider>
  )
}

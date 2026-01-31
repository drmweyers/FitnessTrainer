'use client'

import React from 'react'
import { ExerciseWithUserData } from '@/types/exercise'
import { ExerciseCard } from './ExerciseCard'
import { ExerciseGridSkeleton } from './ExerciseGridSkeleton'

interface ExerciseGridProps {
  exercises: ExerciseWithUserData[]
  viewMode: 'grid' | 'list'
  isLoading?: boolean
  className?: string
  onAddExercise?: (exercise: ExerciseWithUserData) => void
}

export function ExerciseGrid({
  exercises,
  viewMode,
  isLoading = false,
  className = '',
  onAddExercise
}: ExerciseGridProps) {

  if (isLoading) {
    return (
      <div className={`grid gap-6 ${
        viewMode === 'grid'
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'grid-cols-1'
      } ${className}`}>
        {Array.from({ length: 12 }).map((_, index) => (
          <ExerciseGridSkeleton key={index} viewMode={viewMode} />
        ))}
      </div>
    )
  }

  if (exercises.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No exercises found</h3>
          <p className="text-gray-500">
            Try adjusting your search terms or filters to find more exercises.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid gap-6 ${
      viewMode === 'grid'
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        : 'grid-cols-1'
    } ${className}`}>
      {exercises.map(exercise => (
        <ExerciseCard
          key={exercise.exerciseId || exercise.id}
          exercise={exercise}
          viewMode={viewMode}
          onAddExercise={onAddExercise}
        />
      ))}
    </div>
  )
}
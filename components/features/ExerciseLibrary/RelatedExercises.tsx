'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { ExerciseWithUserData } from '@/types/exercise'
import { searchExercises } from '@/services/exerciseService'
import { ExerciseCard } from './ExerciseCard'

interface RelatedExercisesProps {
  currentExercise: ExerciseWithUserData
  onExerciseClick?: (exercise: ExerciseWithUserData) => void
  maxExercises?: number
  className?: string
}

export function RelatedExercises({
  currentExercise,
  onExerciseClick,
  maxExercises = 6,
  className = ''
}: RelatedExercisesProps) {
  const [relatedExercises, setRelatedExercises] = useState<ExerciseWithUserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'bodyPart' | 'muscle' | 'equipment'>('all')

  useEffect(() => {
    const fetchRelatedExercises = async () => {
      setIsLoading(true)

      try {
        const filters = {
          search: '',
          bodyParts: selectedFilter === 'bodyPart' || selectedFilter === 'all'
            ? currentExercise.bodyParts : [],
          equipments: selectedFilter === 'equipment'
            ? currentExercise.equipments : [],
          targetMuscles: selectedFilter === 'muscle'
            ? currentExercise.targetMuscles : [],
        }

        const result = await searchExercises(filters, 1, maxExercises + 1)

        const filtered = result.exercises
          .filter(ex => ex.exerciseId !== currentExercise.exerciseId)
          .slice(0, maxExercises)

        setRelatedExercises(filtered)
      } catch (error) {
        console.error('Failed to fetch related exercises:', error)
        setRelatedExercises([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRelatedExercises()
  }, [currentExercise.exerciseId, currentExercise.bodyParts, currentExercise.equipments, currentExercise.targetMuscles, selectedFilter, maxExercises])

  const itemsToShow = 3 // Number of cards to show at once
  const canScrollLeft = currentIndex > 0
  const canScrollRight = currentIndex < relatedExercises.length - itemsToShow

  const scrollLeft = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1))
  }

  const scrollRight = () => {
    setCurrentIndex(Math.min(relatedExercises.length - itemsToShow, currentIndex + 1))
  }

  const handleExerciseClick = (exercise: ExerciseWithUserData) => {
    onExerciseClick?.(exercise)
  }

  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case 'bodyPart':
        return 'Same Body Part'
      case 'muscle':
        return 'Same Muscles'
      case 'equipment':
        return 'Same Equipment'
      default:
        return 'Most Relevant'
    }
  }

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (relatedExercises.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Exercises</h3>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-gray-500">No related exercises found for the current filter.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Related Exercises</h3>
            <p className="text-sm text-gray-500">
              {relatedExercises.length} exercise{relatedExercises.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center space-x-2">
            {(['all', 'bodyPart', 'muscle', 'equipment'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setSelectedFilter(filter)
                  setCurrentIndex(0)
                }}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedFilter === filter
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getFilterLabel(filter)}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise Cards */}
        <div className="relative">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)` }}
            >
              {relatedExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="w-1/3 flex-shrink-0 px-2 first:pl-0 last:pr-0"
                >
                  <ExerciseCard
                    exercise={exercise}
                    viewMode="grid"
                    onFavorite={(id) => {
                      // Handle favorite toggle
                      setRelatedExercises(prev =>
                        prev.map(ex => ex.id === id ? { ...ex, isFavorited: !ex.isFavorited } : ex)
                      )
                    }}
                    onQuickView={handleExerciseClick}
                    className="h-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          {relatedExercises.length > itemsToShow && (
            <>
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all ${
                  canScrollLeft
                    ? 'text-gray-600 hover:text-gray-800 hover:shadow-xl'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all ${
                  canScrollRight
                    ? 'text-gray-600 hover:text-gray-800 hover:shadow-xl'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* View All Link */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button className="flex items-center justify-center w-full py-3 text-blue-600 hover:text-blue-700 font-medium transition-colors">
            <span>View All Related Exercises</span>
            <ArrowRight size={16} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  )
}
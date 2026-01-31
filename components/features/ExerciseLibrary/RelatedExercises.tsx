'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { ExerciseWithUserData } from '@/types/exercise'
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

  // Mock related exercises - in real app, this would come from API
  const mockRelatedExercises: ExerciseWithUserData[] = [
    {
      id: '2',
      exerciseId: 'Hy9D21L',
      name: '45° side bend',
      gifUrl: 'Hy9D21L.gif',
      targetMuscles: ['obliques'],
      bodyParts: ['waist'],
      equipments: ['dumbbell'],
      secondaryMuscles: ['abs'],
      instructions: ['Stand with feet shoulder-width apart', 'Hold dumbbell in right hand', 'Bend to the side'],
      isFavorited: false,
      usageCount: 8,
    },
    {
      id: '3',
      exerciseId: 'arvaszz',
      name: 'ab wheel',
      gifUrl: 'arvaszz.gif',
      targetMuscles: ['abs'],
      bodyParts: ['waist'],
      equipments: ['wheel roller'],
      secondaryMuscles: ['shoulders', 'lower back'],
      instructions: ['Kneel on floor', 'Hold ab wheel handles', 'Roll forward slowly'],
      isFavorited: true,
      usageCount: 15,
    },
    {
      id: '4',
      exerciseId: 'bdWcbaU',
      name: 'bicycle crunches',
      gifUrl: 'bdWcbaU.gif',
      targetMuscles: ['abs'],
      bodyParts: ['waist'],
      equipments: ['body weight'],
      secondaryMuscles: ['obliques'],
      instructions: ['Lie on back', 'Bring knees to chest', 'Alternate elbow to knee'],
      isFavorited: false,
      usageCount: 22,
    },
    {
      id: '5',
      exerciseId: 'cbuFJrn',
      name: 'crunch',
      gifUrl: 'cbuFJrn.gif',
      targetMuscles: ['abs'],
      bodyParts: ['waist'],
      equipments: ['body weight'],
      secondaryMuscles: [],
      instructions: ['Lie on back', 'Hands behind head', 'Lift shoulders off ground'],
      isFavorited: false,
      usageCount: 18,
    },
    {
      id: '6',
      exerciseId: 'cuKYxhu',
      name: 'dead bug',
      gifUrl: 'cuKYxhu.gif',
      targetMuscles: ['abs'],
      bodyParts: ['waist'],
      equipments: ['body weight'],
      secondaryMuscles: ['lower back'],
      instructions: ['Lie on back', 'Arms up, knees bent', 'Lower opposite arm and leg'],
      isFavorited: true,
      usageCount: 7,
    },
    {
      id: '7',
      exerciseId: 'ecpY0rH',
      name: 'plank',
      gifUrl: 'ecpY0rH.gif',
      targetMuscles: ['abs'],
      bodyParts: ['waist'],
      equipments: ['body weight'],
      secondaryMuscles: ['shoulders', 'glutes'],
      instructions: ['Start in pushup position', 'Hold body straight', 'Engage core muscles'],
      isFavorited: false,
      usageCount: 31,
    }
  ]

  useEffect(() => {
    const fetchRelatedExercises = async () => {
      setIsLoading(true)
      
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/exercises/related/${currentExercise.id}?filter=${selectedFilter}&limit=${maxExercises}`)
        // const data = await response.json()
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Filter mock exercises based on selected criteria
        let filtered = mockRelatedExercises.filter(ex => ex.id !== currentExercise.id)
        
        switch (selectedFilter) {
          case 'bodyPart':
            filtered = filtered.filter(ex => 
              ex.bodyParts.some(part => currentExercise.bodyParts.includes(part))
            )
            break
          case 'muscle':
            filtered = filtered.filter(ex =>
              ex.targetMuscles.some(muscle => currentExercise.targetMuscles.includes(muscle)) ||
              ex.targetMuscles.some(muscle => currentExercise.secondaryMuscles?.includes(muscle))
            )
            break
          case 'equipment':
            filtered = filtered.filter(ex =>
              ex.equipments.some(equipment => currentExercise.equipments.includes(equipment))
            )
            break
          default:
            // 'all' - use relevance scoring
            filtered = filtered.sort((a, b) => {
              let scoreA = 0
              let scoreB = 0
              
              // Score by matching body parts (highest weight)
              scoreA += a.bodyParts.filter(part => currentExercise.bodyParts.includes(part)).length * 3
              scoreB += b.bodyParts.filter(part => currentExercise.bodyParts.includes(part)).length * 3
              
              // Score by matching target muscles
              scoreA += a.targetMuscles.filter(muscle => currentExercise.targetMuscles.includes(muscle)).length * 2
              scoreB += b.targetMuscles.filter(muscle => currentExercise.targetMuscles.includes(muscle)).length * 2
              
              // Score by matching equipment
              scoreA += a.equipments.filter(equipment => currentExercise.equipments.includes(equipment)).length * 1
              scoreB += b.equipments.filter(equipment => currentExercise.equipments.includes(equipment)).length * 1
              
              return scoreB - scoreA
            })
        }
        
        setRelatedExercises(filtered.slice(0, maxExercises))
      } catch (error) {
        console.error('Failed to fetch related exercises:', error)
        setRelatedExercises([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRelatedExercises()
  }, [currentExercise, selectedFilter, maxExercises])

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
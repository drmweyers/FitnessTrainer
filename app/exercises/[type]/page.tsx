'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import ExerciseList from '@/components/features/ExerciseList/ExerciseList'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Exercise type configurations
const EXERCISE_TYPES: Record<string, { title: string; description: string; filters: any }> = {
  strength: {
    title: 'Strength Exercises',
    description: 'Build muscle and increase power with resistance training exercises',
    filters: {
      // Strength exercises typically target upper body, lower body, back, chest
      // Exclude cardio and stretching exercises
      bodyPart: [],
      equipment: [],
      targetMuscle: []
    }
  },
  cardio: {
    title: 'Cardio Exercises',
    description: 'Improve endurance and burn calories with cardiovascular training',
    filters: {
      bodyPart: ['cardio']
    }
  },
  flexibility: {
    title: 'Flexibility Exercises',
    description: 'Improve range of motion and prevent injury with stretching exercises',
    filters: {
      // Flexibility exercises have "stretch" in the name
      search: 'stretch'
    }
  },
  balance: {
    title: 'Balance Exercises',
    description: 'Enhance stability and coordination with balance training',
    filters: {
      search: 'balance'
    }
  }
}

export default function ExerciseTypePage({
  params
}: {
  params: { type: string }
}) {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exercises, setExercises] = useState<any[]>([])

  const exerciseType = EXERCISE_TYPES[params.type]

  useEffect(() => {
    const loadExercisesByType = async () => {
      try {
        setLoading(true)
        setError(null)

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

        // Build query parameters based on exercise type
        const queryParams = new URLSearchParams()
        queryParams.set('page', '1')
        queryParams.set('limit', '100')

        if (exerciseType?.filters.bodyPart && exerciseType.filters.bodyPart.length > 0) {
          queryParams.set('bodyPart', exerciseType.filters.bodyPart[0])
        }

        if (exerciseType?.filters.search) {
          queryParams.set('query', exerciseType.filters.search)
        }

        const response = await fetch(`${API_BASE_URL}/exercises?${queryParams.toString()}`)

        if (!response.ok) {
          throw new Error(`Failed to load exercises: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || 'API returned error')
        }

        let filteredExercises = data.data.exercises

        // Additional client-side filtering for strength exercises
        if (params.type === 'strength') {
          // Filter out cardio and flexibility exercises
          filteredExercises = filteredExercises.filter((ex: any) =>
            ex.bodyPart !== 'cardio' &&
            !ex.name.toLowerCase().includes('stretch') &&
            !ex.name.toLowerCase().includes('warm')
          )
        }

        setExercises(filteredExercises)

        if (filteredExercises.length === 0) {
          setError(`No ${params.type} exercises found`)
        }
      } catch (err) {
        console.error('Error loading exercises:', err)
        setError(err instanceof Error ? err.message : 'Failed to load exercises')
      } finally {
        setLoading(false)
      }
    }

    loadExercisesByType()
  }, [params.type, exerciseType])

  // Invalid exercise type
  if (!exerciseType) {
    return (
      <>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="mb-6">
            <Link href="/exercises" className="flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft size={20} className="mr-2" />
              Back to Exercise Library
            </Link>
          </div>
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Exercise Type Not Found</h1>
            <p className="text-gray-600 mb-6">The exercise type "{params.type}" does not exist.</p>
            <Link
              href="/exercises"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Browse All Exercises
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/exercises" className="flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft size={20} className="mr-2" />
            Back to Exercise Library
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{exerciseType.title}</h1>
            <p className="text-gray-600">{exerciseType.description}</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600">Loading {params.type} exercises...</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="text-red-500 font-medium mb-2">Failed to load exercises</div>
            <div className="text-gray-600 text-sm mb-4">{error}</div>
            <Link
              href="/exercises"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Browse All Exercises
            </Link>
          </div>
        )}

        {!loading && !error && exercises.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {exercises.length} {params.type} exercises
          </div>
        )}

        {!loading && !error && (
          <ExerciseList preloadedExercises={exercises} />
        )}
      </div>
    </>
  )
}

// Note: generateStaticParams cannot be used in client components
// This route uses 'use client' for useState, useEffect, and useSearchParams hooks

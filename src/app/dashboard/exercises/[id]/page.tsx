'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { ExerciseDetailView } from '@/components/features/ExerciseLibrary/ExerciseDetailView'
import { ExerciseWithUserData } from '@/types/exercise'
import { getExerciseById } from '@/services/exerciseService'
import { useFavorites } from '@/hooks/useFavorites'
import { ArrowLeft } from 'lucide-react'

export default function ExerciseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const exerciseId = params.id as string
  
  const [exercise, setExercise] = useState<ExerciseWithUserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { toggleFavorite, isFavorited } = useFavorites()

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Load exercise from the real database
        const exerciseData = await getExerciseById(exerciseId)
        
        if (!exerciseData) {
          throw new Error('Exercise not found')
        }

        // Enhance with user data
        const exerciseWithUserData: ExerciseWithUserData = {
          ...exerciseData,
          isFavorited: isFavorited(exerciseData.exerciseId),
          usageCount: 0, // TODO: Implement usage tracking
          lastUsed: undefined, // TODO: Implement usage tracking
          collections: [] // TODO: Implement collections
        }
        
        setExercise(exerciseWithUserData)
      } catch (err) {
        console.error('Error loading exercise:', err)
        setError(err instanceof Error ? err.message : 'Failed to load exercise')
      } finally {
        setIsLoading(false)
      }
    }

    if (exerciseId) {
      fetchExercise()
    }
  }, [exerciseId, isFavorited])

  const handleBack = () => {
    router.back()
  }

  const handleFavorite = async (_exerciseId: string) => {
    try {
      if (exercise) {
        await toggleFavorite(exercise.exerciseId)
        
        // Update local state
        setExercise(prev => prev ? {
          ...prev,
          isFavorited: !prev.isFavorited
        } : null)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleAddToCollection = (exerciseId: string) => {
    // TODO: Implement add to collection functionality
    console.log('Add to collection:', exerciseId)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          {/* Loading Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-6">
            <div className="max-w-6xl mx-auto flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse mr-4" />
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Loading Content */}
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Video Section */}
              <div className="space-y-4">
                <div className="aspect-video bg-gray-200 rounded-xl animate-pulse" />
                <div className="flex justify-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                </div>
              </div>

              {/* Info Section */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                  <div className="flex space-x-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-8 bg-gray-200 rounded-full w-20 animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !exercise) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {error || 'Exercise not found'}
            </h3>
            <p className="text-gray-500 mb-6">
              The exercise you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout 
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Exercise Library', href: '/dashboard/exercises' },
        { label: exercise.name, href: `/dashboard/exercises/${exercise.id}` }
      ]}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 capitalize">
                    {exercise.name}
                  </h1>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span className="capitalize">{exercise.bodyParts.join(', ')}</span>
                    <span>•</span>
                    <span className="capitalize">{exercise.equipments.join(', ')}</span>
                    {exercise.usageCount && exercise.usageCount > 0 && (
                      <>
                        <span>•</span>
                        <span>Used {exercise.usageCount} times</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleFavorite(exercise.id)}
                  className={`p-3 rounded-lg border transition-all ${
                    exercise.isFavorited
                      ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill={exercise.isFavorited ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => handleAddToCollection(exercise.id)}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Exercise Detail Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <ExerciseDetailView
            exercise={exercise}
            onFavorite={handleFavorite}
            onAddToCollection={handleAddToCollection}
          />
        </div>
      </div>
    </Layout>
  )
}
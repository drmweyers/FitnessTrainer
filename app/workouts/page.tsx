'use client'

import { useState, useEffect, useCallback } from 'react'
import { ExerciseLibrary } from '@/components/features/ExerciseLibrary/ExerciseLibrary'
import WorkoutBuilder from '@/components/features/WorkoutBuilder/WorkoutBuilder'
import Layout from '@/components/layout/Layout'
import { Exercise, ExerciseWithUserData } from '@/types/exercise'
import WorkoutModal from '@/components/features/WorkoutModal/WorkoutModal'
import { searchExercises } from '@/services/exerciseService'
import { Search, Loader2 } from 'lucide-react'

const PAGE_SIZE = 20

export default function WorkoutBuilderPage() {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Exercise library state
  const [exercises, setExercises] = useState<ExerciseWithUserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Fetch exercises from API
  const fetchExercises = useCallback(async (query: string, page: number) => {
    setIsLoading(true)
    try {
      const result = await searchExercises(
        {
          search: query,
          bodyParts: [],
          equipments: [],
          targetMuscles: [],
        },
        page,
        PAGE_SIZE
      )
      setExercises(result.exercises)
      setTotalCount(result.totalCount)
      setHasNextPage(result.hasNextPage)
    } catch (error) {
      console.error('Failed to fetch exercises:', error)
      setExercises([])
      setTotalCount(0)
      setHasNextPage(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load exercises on mount and when search/page changes
  useEffect(() => {
    fetchExercises(searchQuery, currentPage)
  }, [searchQuery, currentPage, fetchExercises])

  // Debounced search handler
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
      setCurrentPage(1) // Reset to page 1 on new search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleAddExercise = (exercise: ExerciseWithUserData) => {
    setSelectedExercises([...selectedExercises, { ...exercise, id: `${exercise.id}-${Date.now()}` }])
  }

  const handleRemoveExercise = (id: string) => {
    setSelectedExercises(selectedExercises.filter(ex => ex.id !== id))
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  return (
    <Layout breadcrumbItems={[{ label: "Workouts", href: "/workouts" }]}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Workout Builder</h1>
          <button
            onClick={openModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Section
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WorkoutBuilder
              exercises={selectedExercises}
              onRemoveExercise={handleRemoveExercise}
            />
          </div>
          <div>
            {/* Search input */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {isLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={18} />
                )}
              </div>
              {totalCount > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {totalCount} exercise{totalCount !== 1 ? 's' : ''} found
                </p>
              )}
            </div>

            <ExerciseLibrary
              exercises={exercises}
              viewMode="grid"
              isLoading={isLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              hasNextPage={hasNextPage}
              onPageChange={handlePageChange}
              onAddExercise={handleAddExercise}
            />
          </div>
        </div>
      </div>

      {/* Workout Section Modal */}
      <WorkoutModal
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </Layout>
  )
}
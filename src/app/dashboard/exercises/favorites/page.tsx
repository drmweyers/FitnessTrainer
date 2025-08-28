'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Heart, 
  Grid3X3, 
  List, 
  Search, 
  Filter,
  Trash2,
  Download,
  Share2,
  ArrowLeft,
  SortAsc,
  SortDesc
} from 'lucide-react'
import Layout from '@/components/layout/Layout'
import { ExerciseCard } from '@/components/features/ExerciseLibrary/ExerciseCard'
import { ExerciseGrid } from '@/components/features/ExerciseLibrary/ExerciseGrid'
import { ExerciseGridSkeleton } from '@/components/features/ExerciseLibrary/ExerciseGridSkeleton'
import { useFavorites } from '@/hooks/useFavorites'
import { ExerciseWithUserData, ExerciseSearchState } from '@/types/exercise'
import { getExercisesByIds } from '@/services/exerciseService'

type SortOption = 'name' | 'dateAdded' | 'usage' | 'lastUsed'
type SortOrder = 'asc' | 'desc'

export default function FavoritesPage() {
  const { 
    favorites, 
    favoriteExerciseIds, 
    isLoading, 
    error, 
    toggleFavorite, 
    clearFavorites,
    refreshFavorites
  } = useFavorites()

  const [favoriteExercises, setFavoriteExercises] = useState<ExerciseWithUserData[]>([])
  const [filteredExercises, setFilteredExercises] = useState<ExerciseWithUserData[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('dateAdded')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [showBulkActions, setShowBulkActions] = useState(false)

  const searchState: ExerciseSearchState = {
    query: searchQuery,
    filters: {
      bodyParts: [],
      equipments: [],
      targetMuscles: [],
      search: searchQuery,
      favorites: true
    },
    sortBy: 'name',
    sortOrder: 'asc',
    viewMode,
    pageSize: 20,
    currentPage: 1
  }

  // Load favorite exercises when favorites change
  useEffect(() => {
    const loadFavoriteExercises = async () => {
      if (favorites.length === 0) {
        setFavoriteExercises([])
        return
      }

      try {
        // Get exercise IDs from favorites
        const exerciseIds = favorites.map(fav => fav.exerciseId)
        
        // Fetch exercise details from the real database
        const exercises = await getExercisesByIds(exerciseIds)
        
        // Enhance with user data and ensure they're marked as favorited
        const exercisesWithUserData: ExerciseWithUserData[] = exercises.map(exercise => {
          const favorite = favorites.find(fav => fav.exerciseId === exercise.exerciseId)
          
          return {
            ...exercise,
            isFavorited: true,
            usageCount: 0, // TODO: Implement usage tracking
            lastUsed: undefined, // TODO: Implement usage tracking
            collections: [], // TODO: Implement collections
          }
        })

        setFavoriteExercises(exercisesWithUserData)
      } catch (error) {
        console.error('Error loading favorite exercises:', error)
        setFavoriteExercises([])
      }
    }

    loadFavoriteExercises()
  }, [favorites])

  // Apply search and sorting
  useEffect(() => {
    let result = [...favoriteExercises]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(exercise =>
        exercise.name.toLowerCase().includes(query) ||
        exercise.targetMuscles.some(muscle => muscle.toLowerCase().includes(query)) ||
        exercise.bodyParts.some(part => part.toLowerCase().includes(query)) ||
        exercise.equipments.some(equipment => equipment.toLowerCase().includes(query))
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'dateAdded':
          const aFav = favorites.find(f => f.exerciseId === a.exerciseId)
          const bFav = favorites.find(f => f.exerciseId === b.exerciseId)
          aValue = aFav?.favoritedAt || ''
          bValue = bFav?.favoritedAt || ''
          break
        case 'usage':
          aValue = a.usageCount || 0
          bValue = b.usageCount || 0
          break
        case 'lastUsed':
          aValue = a.lastUsed || ''
          bValue = b.lastUsed || ''
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortOrder === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      }
    })

    setFilteredExercises(result)
  }, [favoriteExercises, searchQuery, sortBy, sortOrder, favorites])

  const handleToggleFavorite = async (exerciseId: string) => {
    try {
      await toggleFavorite(exerciseId)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleSelectExercise = (exerciseId: string) => {
    setSelectedExercises(prev =>
      prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    )
  }

  const handleSelectAll = () => {
    if (selectedExercises.length === filteredExercises.length) {
      setSelectedExercises([])
    } else {
      setSelectedExercises(filteredExercises.map(ex => ex.id))
    }
  }

  const handleBulkRemove = async () => {
    try {
      await Promise.all(selectedExercises.map(id => {
        const exercise = filteredExercises.find(ex => ex.id === id)
        return exercise ? toggleFavorite(exercise.id) : Promise.resolve()
      }))
      setSelectedExercises([])
      setShowBulkActions(false)
    } catch (error) {
      console.error('Failed to remove favorites:', error)
    }
  }

  const handleClearAllFavorites = async () => {
    if (window.confirm('Are you sure you want to remove all favorites? This action cannot be undone.')) {
      try {
        await clearFavorites()
      } catch (error) {
        console.error('Failed to clear favorites:', error)
      }
    }
  }

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(option)
      setSortOrder('asc')
    }
  }

  if (isLoading) {
    return (
      <Layout 
        breadcrumbItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Exercise Library', href: '/dashboard/exercises' },
          { label: 'Favorites', href: '/dashboard/exercises/favorites' }
        ]}
      >
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Loading Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              </div>
              <div className="flex space-x-2">
                <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded w-10 animate-pulse" />
              </div>
            </div>

            {/* Loading Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <ExerciseGridSkeleton key={index} viewMode={viewMode} />
              ))}
            </div>
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
        { label: 'Favorites', href: '/dashboard/exercises/favorites' }
      ]}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link 
                  href="/dashboard/exercises"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4"
                >
                  <ArrowLeft size={20} />
                </Link>
                <div>
                  <div className="flex items-center">
                    <Heart size={24} className="text-red-500 mr-3" />
                    <h1 className="text-2xl font-bold text-gray-900">Favorite Exercises</h1>
                  </div>
                  <p className="text-gray-500 mt-1">
                    {favoriteExercises.length} exercise{favoriteExercises.length !== 1 ? 's' : ''} in your favorites
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {selectedExercises.length > 0 && (
                  <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                    <span className="text-sm text-blue-700">
                      {selectedExercises.length} selected
                    </span>
                    <button
                      onClick={handleBulkRemove}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {viewMode === 'grid' ? <List size={20} /> : <Grid3X3 size={20} />}
                </button>

                {favoriteExercises.length > 0 && (
                  <button
                    onClick={handleClearAllFavorites}
                    className="px-4 py-2 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        {favoriteExercises.length > 0 && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search favorites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Sort Options */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 mr-2">Sort by:</span>
                  {[
                    { key: 'name', label: 'Name' },
                    { key: 'dateAdded', label: 'Date Added' },
                    { key: 'usage', label: 'Usage' },
                    { key: 'lastUsed', label: 'Last Used' }
                  ].map(option => (
                    <button
                      key={option.key}
                      onClick={() => handleSort(option.key as SortOption)}
                      className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                        sortBy === option.key
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                      {sortBy === option.key && (
                        sortOrder === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
              <button
                onClick={refreshFavorites}
                className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
              >
                Try Again
              </button>
            </div>
          )}

          {favoriteExercises.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorite exercises yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Start building your collection by favoriting exercises from the exercise library.
              </p>
              <Link
                href="/dashboard/exercises"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Exercise Library
              </Link>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No exercises match your search</h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search query to find your favorite exercises.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
              : 'space-y-4'
            }>
              {filteredExercises.map(exercise => (
                <div key={exercise.id} className="relative">
                  {/* Selection checkbox */}
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={selectedExercises.includes(exercise.id)}
                      onChange={() => handleSelectExercise(exercise.id)}
                      className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  <ExerciseCard
                    exercise={exercise}
                    viewMode={viewMode}
                    onFavorite={handleToggleFavorite}
                    onQuickView={(exercise) => {
                      // Navigate to exercise detail
                      window.location.href = `/dashboard/exercises/${exercise.id}`
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
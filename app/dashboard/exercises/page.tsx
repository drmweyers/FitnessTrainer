'use client'

import { useState, useEffect, useMemo } from 'react'
import { ExerciseLibrary } from '@/components/features/ExerciseLibrary/ExerciseLibrary'
import { ExerciseSearch } from '@/components/features/ExerciseLibrary/ExerciseSearch'
import { ExerciseFiltersAdvanced } from '@/components/features/ExerciseLibrary/ExerciseFiltersAdvanced'
import { CollectionManager } from '@/components/features/ExerciseLibrary/CollectionManager'
import { Exercise, ExerciseWithUserData, ExerciseFilters, FilterOptions } from '@/types/exercise'
import { searchExercises, getFilterOptions, getPopularExercises } from '@/services/exerciseService'
import { Filter, BookOpen, TrendingUp, Loader2, Zap } from 'lucide-react'

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<ExerciseWithUserData[]>([])
  const [popularExercises, setPopularExercises] = useState<ExerciseWithUserData[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    bodyParts: [],
    equipments: [],
    targetMuscles: [],
    secondaryMuscles: []
  })
  const [currentFilters, setCurrentFilters] = useState<ExerciseFilters>({
    search: '',
    bodyParts: [],
    equipments: [],
    targetMuscles: [],
    favorites: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showCollections, setShowCollections] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'created'>('name')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)

  const pageSize = 20

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load exercises when filters change
  useEffect(() => {
    loadExercises()
  }, [currentFilters, currentPage, sortBy])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      
      // Load filter options and popular exercises in parallel
      const [options, popular] = await Promise.all([
        getFilterOptions(),
        getPopularExercises(12)
      ])
      
      setFilterOptions(options)
      setPopularExercises(popular)
      
      // Load initial exercises (no filters)
      await loadExercises()
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadExercises = async () => {
    try {
      setIsSearching(true)
      
      const result = await searchExercises(currentFilters, currentPage, pageSize)
      
      setExercises(result.exercises)
      setTotalCount(result.totalCount)
      setHasNextPage(result.hasNextPage)
    } catch (error) {
      console.error('Error loading exercises:', error)
      setExercises([])
      setTotalCount(0)
      setHasNextPage(false)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = (query: string) => {
    setCurrentFilters(prev => ({ ...prev, search: query }))
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleFiltersChange = (filters: Partial<ExerciseFilters>) => {
    setCurrentFilters(prev => ({ ...prev, ...filters }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const handleClearFilters = () => {
    setCurrentFilters({
      search: '',
      bodyParts: [],
      equipments: [],
      targetMuscles: [],
      difficulty: undefined,
      favorites: false
    })
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const hasActiveFilters = useMemo(() => {
    return currentFilters.search !== '' ||
           currentFilters.bodyParts.length > 0 ||
           currentFilters.equipments.length > 0 ||
           currentFilters.targetMuscles.length > 0 ||
           currentFilters.favorites === true ||
           currentFilters.difficulty !== undefined
  }, [currentFilters])

  const showingResults = exercises.length > 0 || hasActiveFilters

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Exercise Library</h2>
            <p className="text-gray-600">Preparing 1324+ exercises for you...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exercise Library</h1>
        <p className="text-gray-600">
          Discover and organize over 1,324 exercises with detailed demonstrations
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <ExerciseSearch
          onSearch={handleSearch}
          placeholder="Search exercises by name, muscle, or equipment..."
          initialValue={currentFilters.search}
        />
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter size={18} className="mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </button>

          {/* Collections Toggle */}
          <button
            onClick={() => setShowCollections(prev => !prev)}
            className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
              showCollections
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BookOpen size={18} className="mr-2" />
            Collections
          </button>
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-4">
          {/* Difficulty Filter */}
          <select
            value={currentFilters.difficulty || ''}
            onChange={(e) => {
              const value = e.target.value as 'beginner' | 'intermediate' | 'advanced' | ''
              setCurrentFilters(prev => ({
                ...prev,
                difficulty: value || undefined
              }))
              setCurrentPage(1)
            }}
            className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              currentFilters.difficulty
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-200'
            }`}
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="usage">Sort by Popularity</option>
            <option value="created">Sort by Date Added</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6">
          <ExerciseFiltersAdvanced
            filters={currentFilters}
            filterOptions={filterOptions}
            onChange={handleFiltersChange}
          />
        </div>
      )}

      {/* Collections Panel */}
      {showCollections && (
        <div className="mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <CollectionManager />
          </div>
        </div>
      )}

      {/* Results Info */}
      {showingResults && (
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            {isSearching ? (
              <span>Searching...</span>
            ) : (
              <span>
                Showing {exercises.length} of {totalCount.toLocaleString()} exercises
                {hasActiveFilters && ' (filtered)'}
              </span>
            )}
          </div>
          
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Exercise Library or Welcome Screen */}
      {showingResults ? (
        <ExerciseLibrary
          exercises={exercises}
          viewMode={viewMode}
          isLoading={isSearching}
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / pageSize)}
          hasNextPage={hasNextPage}
          onPageChange={handlePageChange}
        />
      ) : (
        /* Welcome/Popular Exercises Screen */
        <div className="space-y-8">
          {/* Popular Exercises Section */}
          <div>
            <div className="flex items-center mb-4">
              <TrendingUp size={20} className="text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Popular Exercises</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {popularExercises.map(exercise => (
                <div key={exercise.exerciseId} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={`/exerciseGifs/${exercise.gifUrl}`}
                      alt={exercise.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                    {exercise.name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {exercise.targetMuscles.slice(0, 2).map(muscle => (
                      <span 
                        key={muscle}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">
                    {exercise.equipments.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Start Actions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Get Started with Your Exercise Library
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Search through over 1,324 exercises, create custom collections, and build the perfect workout programs for your clients.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setShowFilters(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse by Category
              </button>
              <button
                onClick={() => setShowCollections(true)}
                className="px-6 py-3 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Create Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
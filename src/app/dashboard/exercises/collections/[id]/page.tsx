'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Share2,
  Users,
  Lock,
  Calendar,
  Hash,
  Grid3X3,
  List,
  Search,
  Plus
} from 'lucide-react'
import Layout from '@/components/layout/Layout'
import { ExerciseCard } from '@/components/features/ExerciseLibrary/ExerciseCard'
import { ExerciseGridSkeleton } from '@/components/features/ExerciseLibrary/ExerciseGridSkeleton'
import { useCollections } from '@/hooks/useCollections'
import { useFavorites } from '@/hooks/useFavorites'
import { ExerciseWithUserData, ExerciseCollection } from '@/types/exercise'
import { getExercisesByIds } from '@/services/exerciseService'

export default function CollectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const collectionId = params.id as string

  const { getCollection, deleteCollection, removeFromCollection } = useCollections()
  const { toggleFavorite } = useFavorites()

  const [collection, setCollection] = useState<ExerciseCollection | null>(null)
  const [exercises, setExercises] = useState<ExerciseWithUserData[]>([])
  const [filteredExercises, setFilteredExercises] = useState<ExerciseWithUserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const loadCollection = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get collection details
        const collectionData = getCollection(collectionId)
        if (!collectionData) {
          setError('Collection not found')
          return
        }

        setCollection(collectionData)

        // Load exercises in the collection from real database
        if (collectionData.exerciseIds.length > 0) {
          const exercisesData = await getExercisesByIds(collectionData.exerciseIds)
          
          // Enhance with user data
          const exercisesWithUserData: ExerciseWithUserData[] = exercisesData.map(exercise => ({
            ...exercise,
            isFavorited: false, // TODO: Check against user favorites
            usageCount: 0, // TODO: Implement usage tracking
            lastUsed: undefined, // TODO: Implement usage tracking
            collections: [collectionData.id] // This exercise is in this collection
          }))

          setExercises(exercisesWithUserData)
        } else {
          setExercises([])
        }
      } catch (err) {
        console.error('Error loading collection:', err)
        setError(err instanceof Error ? err.message : 'Failed to load collection')
      } finally {
        setIsLoading(false)
      }
    }

    if (collectionId) {
      loadCollection()
    }
  }, [collectionId, getCollection])

  // Apply search filter
  useEffect(() => {
    let result = [...exercises]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(exercise =>
        exercise.name.toLowerCase().includes(query) ||
        exercise.targetMuscles.some(muscle => muscle.toLowerCase().includes(query)) ||
        exercise.bodyParts.some(part => part.toLowerCase().includes(query)) ||
        exercise.equipments.some(equipment => equipment.toLowerCase().includes(query))
      )
    }

    setFilteredExercises(result)
  }, [exercises, searchQuery])

  const handleDeleteCollection = async () => {
    if (!collection) return

    const confirmMessage = `Are you sure you want to delete "${collection.name}"? This action cannot be undone.`
    if (!confirm(confirmMessage)) return

    try {
      setIsDeleting(true)
      await deleteCollection(collection.id)
      router.push('/dashboard/exercises/collections')
    } catch (error) {
      console.error('Failed to delete collection:', error)
      alert('Failed to delete collection. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRemoveFromCollection = async (exerciseId: string) => {
    if (!collection) return

    try {
      await removeFromCollection(collection.id, exerciseId)
      setExercises(prev => prev.filter(ex => ex.id !== exerciseId))
      setSelectedExercises(prev => prev.filter(id => id !== exerciseId))
    } catch (error) {
      console.error('Failed to remove exercise from collection:', error)
    }
  }

  const handleBulkRemove = async () => {
    if (!collection || selectedExercises.length === 0) return

    const confirmMessage = `Remove ${selectedExercises.length} exercise${selectedExercises.length !== 1 ? 's' : ''} from this collection?`
    if (!confirm(confirmMessage)) return

    try {
      await Promise.all(selectedExercises.map(exerciseId => 
        removeFromCollection(collection.id, exerciseId)
      ))
      setExercises(prev => prev.filter(ex => !selectedExercises.includes(ex.id)))
      setSelectedExercises([])
    } catch (error) {
      console.error('Failed to remove exercises from collection:', error)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          {/* Loading Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse mr-4" />
                  <div className="space-y-2">
                    <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-10 bg-gray-200 rounded w-20 animate-pulse" />
                  <div className="h-10 bg-gray-200 rounded w-10 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Loading Content */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <ExerciseGridSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !collection) {
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
              {error || 'Collection not found'}
            </h3>
            <p className="text-gray-500 mb-6">
              The collection you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/dashboard/exercises/collections"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Collections
            </Link>
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
        { label: 'Collections', href: '/dashboard/exercises/collections' },
        { label: collection.name, href: `/dashboard/exercises/collections/${collection.id}` }
      ]}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link 
                  href="/dashboard/exercises/collections"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4"
                >
                  <ArrowLeft size={20} />
                </Link>
                
                <div>
                  <div className="flex items-center mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 mr-3">{collection.name}</h1>
                    {collection.isPublic ? (
                      <div className="flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        <Users size={14} className="mr-1" />
                        Public
                      </div>
                    ) : (
                      <div className="flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        <Lock size={14} className="mr-1" />
                        Private
                      </div>
                    )}
                  </div>
                  
                  {collection.description && (
                    <p className="text-gray-600 mb-2">{collection.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Hash size={14} className="mr-1" />
                      <span>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      <span>Created {formatDate(collection.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {selectedExercises.length > 0 && (
                  <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                    <span className="text-sm text-blue-700">
                      {selectedExercises.length} selected
                    </span>
                    <button
                      onClick={handleBulkRemove}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Remove selected exercises"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
                >
                  {viewMode === 'grid' ? <List size={20} /> : <Grid3X3 size={20} />}
                </button>

                <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <Share2 size={20} />
                </button>

                <Link
                  href={`/dashboard/exercises/collections/${collection.id}/edit`}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Edit3 size={20} />
                </Link>

                <button
                  onClick={handleDeleteCollection}
                  disabled={isDeleting}
                  className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete collection"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Controls */}
        {exercises.length > 0 && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search exercises in this collection..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
                  >
                    {selectedExercises.length === filteredExercises.length ? 'Deselect All' : 'Select All'}
                  </button>

                  <Link
                    href={`/dashboard/exercises?addToCollection=${collection.id}`}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Exercises
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {exercises.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Hash size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No exercises in this collection</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Add exercises to this collection to start building your workout routine.
              </p>
              <Link
                href={`/dashboard/exercises?addToCollection=${collection.id}`}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} className="mr-2" />
                Add Exercises
              </Link>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No exercises match your search</h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search query to find exercises in this collection.
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
                    onFavorite={(id) => toggleFavorite(id)}
                    onQuickView={(exercise) => {
                      window.location.href = `/dashboard/exercises/${exercise.id}`
                    }}
                    onAddToCollection={() => handleRemoveFromCollection(exercise.id)}
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
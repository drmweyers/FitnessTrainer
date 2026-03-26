'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Plus,
  X,
  Hash,
  Calendar,
  Search,
  Loader2,
  Lock,
  Users,
} from 'lucide-react'
import { useCollections } from '@/hooks/useCollections'

interface Exercise {
  id: string
  exerciseId: string
  name: string
  bodyParts: string[]
  targetMuscles: string[]
  equipments: string[]
  gifUrl: string
  isFavorited?: boolean
  usageCount?: number
}

interface CollectionDetailProps {
  /** The ID of the collection to display */
  collectionId: string
  /** List of resolved exercise objects for this collection */
  exercises: Exercise[]
  /** Whether exercises are still being loaded */
  isLoadingExercises: boolean
  /** Called when user requests to delete the collection */
  onDeleteCollection: () => Promise<void>
  /** Called with exercise ID when user removes an exercise */
  onRemoveExercise: (exerciseId: string) => Promise<void>
  /** Called with updated fields when user saves inline edits */
  onUpdateCollection: (updates: { name: string; description: string }) => Promise<void>
}

/**
 * CollectionDetail renders a full-page view of a single exercise collection,
 * including the exercise list, inline editing, and delete functionality.
 */
export function CollectionDetail({
  collectionId,
  exercises,
  isLoadingExercises,
  onDeleteCollection,
  onRemoveExercise,
  onUpdateCollection,
}: CollectionDetailProps) {
  const { getCollection } = useCollections()
  const collection = getCollection(collectionId)

  const [searchQuery, setSearchQuery] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return exercises
    const q = searchQuery.toLowerCase()
    return exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        ex.targetMuscles.some((m) => m.toLowerCase().includes(q)) ||
        ex.bodyParts.some((p) => p.toLowerCase().includes(q)) ||
        ex.equipments.some((e) => e.toLowerCase().includes(q))
    )
  }, [exercises, searchQuery])

  const handleStartEdit = () => {
    if (!collection) return
    setEditName(collection.name)
    setEditDescription(collection.description || '')
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!editName.trim()) return
    try {
      setIsSaving(true)
      await onUpdateCollection({ name: editName.trim(), description: editDescription.trim() })
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!collection) return
    if (!confirm(`Delete "${collection.name}"? This action cannot be undone.`)) return
    try {
      setIsDeleting(true)
      await onDeleteCollection()
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRemoveExercise = async (exerciseId: string) => {
    if (!confirm('Remove this exercise from the collection?')) return
    await onRemoveExercise(exerciseId)
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

  if (isLoadingExercises) {
    return (
      <div data-testid="collection-detail-loading" className="space-y-4 p-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Collection not found</h3>
        <p className="text-gray-500 mb-4">
          This collection doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/dashboard/exercises/collections"
          className="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Collections
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <Link
                href="/dashboard/exercises/collections"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4 mt-0.5"
                aria-label="Back to collections"
              >
                <ArrowLeft size={20} />
              </Link>

              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none bg-transparent w-full"
                      autoFocus
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Add a description..."
                      rows={2}
                      className="text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full resize-none"
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={isSaving || !editName.trim()}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isSaving && <Loader2 size={12} className="mr-1.5 animate-spin" />}
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center mb-1">
                      <h1 className="text-2xl font-bold text-gray-900 mr-3">{collection.name}</h1>
                      {collection.isPublic ? (
                        <span className="flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          <Users size={12} className="mr-1" />
                          Public
                        </span>
                      ) : (
                        <span className="flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          <Lock size={12} className="mr-1" />
                          Private
                        </span>
                      )}
                    </div>

                    {collection.description && (
                      <p className="text-gray-600 mb-2">{collection.description}</p>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Hash size={14} className="mr-1" />
                        {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        Created {formatDate(collection.createdAt)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!isEditing && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleStartEdit}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit collection"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete collection"
                >
                  {isDeleting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      {exercises.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search exercises in this collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <Link
              href={`/dashboard/exercises?addToCollection=${collection.id}`}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm ml-4"
              aria-label="Add exercises"
            >
              <Plus size={16} className="mr-2" />
              Add Exercises
            </Link>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {exercises.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Hash size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No exercises in this collection</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Browse the exercise library and add exercises to build this collection.
            </p>
            <Link
              href={`/dashboard/exercises?addToCollection=${collection.id}`}
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              aria-label="Add exercises"
            >
              <Plus size={16} className="mr-2" />
              Add Exercises
            </Link>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-16">
            <Search size={28} className="text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No exercises match</h3>
            <button
              onClick={() => setSearchQuery('')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-gray-300 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{exercise.name}</p>
                  <p className="text-sm text-gray-500">
                    {exercise.bodyParts.join(', ')}
                    {exercise.equipments[0] ? ` · ${exercise.equipments[0]}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveExercise(exercise.id)}
                  className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Remove"
                >
                  <X size={14} className="mr-1" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

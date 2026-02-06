'use client'

import { useState, useEffect, useCallback } from 'react'
import { ExerciseCollection } from '@/types/exercise'

interface UseCollectionsOptions {
  autoLoad?: boolean
}

interface UseCollectionsReturn {
  collections: ExerciseCollection[]
  isLoading: boolean
  error: string | null
  createCollection: (name: string, description: string, exerciseIds?: string[]) => Promise<ExerciseCollection>
  updateCollection: (collectionId: string, updates: Partial<ExerciseCollection>) => Promise<void>
  deleteCollection: (collectionId: string) => Promise<void>
  addToCollection: (collectionId: string, exerciseId: string) => Promise<void>
  removeFromCollection: (collectionId: string, exerciseId: string) => Promise<void>
  getCollection: (collectionId: string) => ExerciseCollection | undefined
  isInCollection: (collectionId: string, exerciseId: string) => boolean
  getExerciseCollections: (exerciseId: string) => ExerciseCollection[]
  refreshCollections: () => Promise<void>
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export function useCollections(options: UseCollectionsOptions = {}): UseCollectionsReturn {
  const { autoLoad = true } = options

  const [collections, setCollections] = useState<ExerciseCollection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCollections = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch collection list
      const listResponse = await fetch('/api/exercises/collections', {
        headers: getAuthHeaders(),
      })

      if (!listResponse.ok) {
        if (listResponse.status === 401) {
          setCollections([])
          return
        }
        throw new Error('Failed to fetch collections')
      }

      const listResult = await listResponse.json()
      const collectionList = listResult.data || []

      // Fetch full details for each collection to get exercise IDs
      const fullCollections: ExerciseCollection[] = await Promise.all(
        collectionList.map(async (c: any) => {
          try {
            const detailResponse = await fetch(`/api/exercises/collections/${c.id}`, {
              headers: getAuthHeaders(),
            })
            if (detailResponse.ok) {
              const detailResult = await detailResponse.json()
              const detail = detailResult.data
              return {
                id: detail.id,
                name: detail.name,
                description: detail.description || '',
                userId: detail.userId,
                exerciseIds: (detail.exercises || []).map((e: any) => e.exerciseId),
                isPublic: detail.isPublic,
                createdAt: detail.createdAt,
                updatedAt: detail.updatedAt,
              }
            }
          } catch {
            // Fall back to list data without exercise IDs
          }
          return {
            id: c.id,
            name: c.name,
            description: c.description || '',
            userId: '',
            exerciseIds: [],
            isPublic: c.isPublic,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          }
        })
      )

      setCollections(fullCollections)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoLoad) {
      loadCollections()
    }
  }, [autoLoad, loadCollections])

  const createCollection = useCallback(async (name: string, description: string, exerciseIds: string[] = []) => {
    try {
      setError(null)
      const response = await fetch('/api/exercises/collections', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, description }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create collection')
      }

      const newCollection: ExerciseCollection = {
        id: result.data.id,
        name: result.data.name,
        description: result.data.description || '',
        userId: result.data.userId,
        exerciseIds: [],
        isPublic: result.data.isPublic,
        createdAt: result.data.createdAt,
        updatedAt: result.data.updatedAt,
      }

      // If initial exercises provided, add them
      if (exerciseIds.length > 0) {
        await Promise.all(
          exerciseIds.map(exerciseId =>
            fetch(`/api/exercises/collections/${newCollection.id}/exercises`, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({ exerciseId }),
            })
          )
        )
        newCollection.exerciseIds = exerciseIds
      }

      setCollections(prev => [...prev, newCollection])
      return newCollection
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create collection'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const updateCollection = useCallback(async (collectionId: string, updates: Partial<ExerciseCollection>) => {
    try {
      setError(null)
      const response = await fetch(`/api/exercises/collections/${collectionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: updates.name,
          description: updates.description,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update collection')
      }

      setCollections(prev =>
        prev.map(collection =>
          collection.id === collectionId
            ? { ...collection, ...updates, updatedAt: new Date().toISOString() }
            : collection
        )
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update collection'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const deleteCollection = useCallback(async (collectionId: string) => {
    try {
      setError(null)
      const response = await fetch(`/api/exercises/collections/${collectionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete collection')
      }

      setCollections(prev => prev.filter(collection => collection.id !== collectionId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete collection'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const addToCollection = useCallback(async (collectionId: string, exerciseId: string) => {
    try {
      setError(null)
      const response = await fetch(`/api/exercises/collections/${collectionId}/exercises`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ exerciseId }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add to collection')
      }

      setCollections(prev =>
        prev.map(collection =>
          collection.id === collectionId
            ? {
                ...collection,
                exerciseIds: collection.exerciseIds.includes(exerciseId)
                  ? collection.exerciseIds
                  : [...collection.exerciseIds, exerciseId],
                updatedAt: new Date().toISOString(),
              }
            : collection
        )
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to collection'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const removeFromCollection = useCallback(async (collectionId: string, exerciseId: string) => {
    try {
      setError(null)
      const response = await fetch(`/api/exercises/collections/${collectionId}/exercises`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ exerciseId }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove from collection')
      }

      setCollections(prev =>
        prev.map(collection =>
          collection.id === collectionId
            ? {
                ...collection,
                exerciseIds: collection.exerciseIds.filter(id => id !== exerciseId),
                updatedAt: new Date().toISOString(),
              }
            : collection
        )
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove from collection'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const getCollection = useCallback((collectionId: string) => {
    return collections.find(collection => collection.id === collectionId)
  }, [collections])

  const isInCollection = useCallback((collectionId: string, exerciseId: string) => {
    const collection = collections.find(c => c.id === collectionId)
    return collection ? collection.exerciseIds.includes(exerciseId) : false
  }, [collections])

  const getExerciseCollections = useCallback((exerciseId: string) => {
    return collections.filter(collection => collection.exerciseIds.includes(exerciseId))
  }, [collections])

  const refreshCollections = useCallback(async () => {
    await loadCollections()
  }, [loadCollections])

  return {
    collections,
    isLoading,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    getCollection,
    isInCollection,
    getExerciseCollections,
    refreshCollections,
  }
}

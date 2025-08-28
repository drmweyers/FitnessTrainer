'use client'

import { useState, useEffect, useCallback } from 'react'
import { ExerciseCollection } from '@/types/exercise'

interface UseCollectionsOptions {
  userId?: string
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

// Mock API functions - replace with actual API calls
const mockCollectionsApi = {
  async getCollections(userId?: string): Promise<ExerciseCollection[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const stored = localStorage.getItem('exercise-collections')
    if (!stored) return []
    
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  },

  async createCollection(data: Omit<ExerciseCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExerciseCollection> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const collection: ExerciseCollection = {
      id: `collection-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const stored = localStorage.getItem('exercise-collections')
    const collections = stored ? JSON.parse(stored) : []
    collections.push(collection)
    localStorage.setItem('exercise-collections', JSON.stringify(collections))

    return collection
  },

  async updateCollection(collectionId: string, updates: Partial<ExerciseCollection>): Promise<ExerciseCollection> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const stored = localStorage.getItem('exercise-collections')
    if (!stored) throw new Error('Collection not found')

    const collections = JSON.parse(stored)
    const index = collections.findIndex((c: ExerciseCollection) => c.id === collectionId)
    if (index === -1) throw new Error('Collection not found')

    collections[index] = {
      ...collections[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    localStorage.setItem('exercise-collections', JSON.stringify(collections))
    return collections[index]
  },

  async deleteCollection(collectionId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const stored = localStorage.getItem('exercise-collections')
    if (!stored) return

    const collections = JSON.parse(stored)
    const filtered = collections.filter((c: ExerciseCollection) => c.id !== collectionId)
    localStorage.setItem('exercise-collections', JSON.stringify(filtered))
  },

  async addToCollection(collectionId: string, exerciseId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const stored = localStorage.getItem('exercise-collections')
    if (!stored) throw new Error('Collection not found')

    const collections = JSON.parse(stored)
    const collection = collections.find((c: ExerciseCollection) => c.id === collectionId)
    if (!collection) throw new Error('Collection not found')

    if (!collection.exerciseIds.includes(exerciseId)) {
      collection.exerciseIds.push(exerciseId)
      collection.updatedAt = new Date().toISOString()
      localStorage.setItem('exercise-collections', JSON.stringify(collections))
    }
  },

  async removeFromCollection(collectionId: string, exerciseId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const stored = localStorage.getItem('exercise-collections')
    if (!stored) return

    const collections = JSON.parse(stored)
    const collection = collections.find((c: ExerciseCollection) => c.id === collectionId)
    if (!collection) return

    collection.exerciseIds = collection.exerciseIds.filter((id: string) => id !== exerciseId)
    collection.updatedAt = new Date().toISOString()
    localStorage.setItem('exercise-collections', JSON.stringify(collections))
  }
}

export function useCollections(options: UseCollectionsOptions = {}): UseCollectionsReturn {
  const { userId, autoLoad = true } = options
  
  const [collections, setCollections] = useState<ExerciseCollection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load collections
  const loadCollections = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const userCollections = await mockCollectionsApi.getCollections(userId)
      setCollections(userCollections)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (autoLoad) {
      loadCollections()
    }
  }, [autoLoad, loadCollections])

  // Create collection
  const createCollection = useCallback(async (name: string, description: string, exerciseIds: string[] = []) => {
    try {
      setError(null)
      
      const newCollection = await mockCollectionsApi.createCollection({
        name,
        description,
        userId: userId || 'current-user',
        exerciseIds,
        isPublic: false
      })
      
      setCollections(prev => [...prev, newCollection])
      return newCollection
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create collection'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [userId])

  // Update collection
  const updateCollection = useCallback(async (collectionId: string, updates: Partial<ExerciseCollection>) => {
    try {
      setError(null)
      
      await mockCollectionsApi.updateCollection(collectionId, updates)
      
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

  // Delete collection
  const deleteCollection = useCallback(async (collectionId: string) => {
    try {
      setError(null)
      
      await mockCollectionsApi.deleteCollection(collectionId)
      
      setCollections(prev => prev.filter(collection => collection.id !== collectionId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete collection'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  // Add exercise to collection
  const addToCollection = useCallback(async (collectionId: string, exerciseId: string) => {
    try {
      setError(null)
      
      await mockCollectionsApi.addToCollection(collectionId, exerciseId)
      
      setCollections(prev =>
        prev.map(collection =>
          collection.id === collectionId
            ? {
                ...collection,
                exerciseIds: collection.exerciseIds.includes(exerciseId)
                  ? collection.exerciseIds
                  : [...collection.exerciseIds, exerciseId],
                updatedAt: new Date().toISOString()
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

  // Remove exercise from collection
  const removeFromCollection = useCallback(async (collectionId: string, exerciseId: string) => {
    try {
      setError(null)
      
      await mockCollectionsApi.removeFromCollection(collectionId, exerciseId)
      
      setCollections(prev =>
        prev.map(collection =>
          collection.id === collectionId
            ? {
                ...collection,
                exerciseIds: collection.exerciseIds.filter(id => id !== exerciseId),
                updatedAt: new Date().toISOString()
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

  // Get specific collection
  const getCollection = useCallback((collectionId: string) => {
    return collections.find(collection => collection.id === collectionId)
  }, [collections])

  // Check if exercise is in collection
  const isInCollection = useCallback((collectionId: string, exerciseId: string) => {
    const collection = collections.find(c => c.id === collectionId)
    return collection ? collection.exerciseIds.includes(exerciseId) : false
  }, [collections])

  // Get collections containing an exercise
  const getExerciseCollections = useCallback((exerciseId: string) => {
    return collections.filter(collection => collection.exerciseIds.includes(exerciseId))
  }, [collections])

  // Refresh collections
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
    refreshCollections
  }
}